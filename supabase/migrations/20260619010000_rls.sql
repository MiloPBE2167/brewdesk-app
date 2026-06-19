-- Migration: Row Level Security (RLS) for Beta v1 tables
-- Pulled forward from Week 2 → applied early (see brewdesk-docs/03-decisions-log.md).
-- Locked principles: brewdesk-docs/05-tech-spec.md §RLS Policies.
--
-- WHY RLS: tables access qua publishable key (client-side). Không có RLS = bảng
-- mở công khai đọc/ghi. RLS bắt Postgres lọc dòng theo danh tính user (auth.uid())
-- TRƯỚC khi trả về. service_role key (server-only) BỎ QUA mọi RLS — đó là cách admin ghi.
--
-- Note: `(select auth.uid())` thay vì `auth.uid()` trực tiếp = best practice Supabase
-- (Postgres cache kết quả 1 lần thay vì gọi lại mỗi dòng → nhanh hơn nhiều).

-- ───────────────────────────────────────────────────────────────────────────
-- Bật RLS. Khi vừa bật mà CHƯA có policy nào = DENY ALL (chặn hết).
-- Mỗi policy bên dưới là một "cửa cho phép" (mặc định đóng, policy mở ra).
-- ───────────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.cafes    enable row level security;
alter table public.checkins enable row level security;

-- ═══════════════════════════════════════════════════════════════════════════
-- profiles — Read: ai đã đăng nhập | Write: chỉ chính mình
-- ═══════════════════════════════════════════════════════════════════════════

-- Đọc: mọi user authenticated thấy mọi profile (cần để hiển thị display_name của
-- người đang ở café). `using (true)` = không lọc dòng, nhưng `to authenticated`
-- giới hạn chỉ user đã đăng nhập (anonymous không đọc được).
create policy "profiles: read for authenticated"
on public.profiles for select
to authenticated
using (true);

-- Tạo: chỉ được tạo profile của chính mình (id phải khớp user đang đăng nhập).
-- `with check` chạy khi INSERT để validate dòng mới.
create policy "profiles: insert own"
on public.profiles for insert
to authenticated
with check (id = (select auth.uid()));

-- Sửa: chỉ sửa profile của mình. `using` lọc dòng được phép đụng tới.
create policy "profiles: update own"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════════
-- cafes — Read: bất kỳ ai (kể cả chưa đăng nhập, cho landing preview) | Write: admin
-- ═══════════════════════════════════════════════════════════════════════════

-- Đọc công khai: `to anon, authenticated` cho cả khách vãng lai.
create policy "cafes: public read"
on public.cafes for select
to anon, authenticated
using (true);

-- KHÔNG tạo policy insert/update/delete cho cafes:
-- => user thường không ghi được. Chỉ service_role (bỏ qua RLS) ghi được,
--    tức Khánh nhập café qua server/script dùng service key. Đúng "admin-only".

-- ═══════════════════════════════════════════════════════════════════════════
-- checkins — Read: của mình + của café mình đang ngồi | Write/Update: chỉ của mình
-- ═══════════════════════════════════════════════════════════════════════════

-- ⚠️ BẪY ĐỆ QUY: policy SELECT của checkins cần tham chiếu chính bảng checkins
-- ("café nào mình đang active?"). Nếu viết subquery trực tiếp vào checkins trong
-- policy của checkins, Postgres áp lại RLS lên subquery đó → gọi lại policy →
-- ĐỆ QUY VÔ HẠN (lỗi "infinite recursion detected in policy").
--
-- Cách thoát: gói subquery vào 1 function SECURITY DEFINER. Function này chạy với
-- quyền của người TẠO nó (bỏ qua RLS bên trong) → không kích hoạt lại policy.
create or replace function public.user_active_cafe_ids()
returns setof uuid
language sql
security definer            -- chạy bằng quyền owner → bỏ qua RLS bên trong, cắt đệ quy
set search_path = public    -- chống search_path hijack (bắt buộc với security definer)
stable                      -- không đổi DB, kết quả ổn định trong 1 query → cho optimizer cache
as $$
  select cafe_id from public.checkins
  where user_id = (select auth.uid())
    and checked_out_at is null
$$;

-- Đọc: thấy check-in của chính mình HOẶC check-in ở café mình đang active
-- (để biết "ai đang ngồi cùng quán"). Café đã checkout thì không lọt vào danh sách.
create policy "checkins: read own or same active cafe"
on public.checkins for select
to authenticated
using (
  user_id = (select auth.uid())
  or cafe_id in (select public.user_active_cafe_ids())
);

-- Tạo check-in: chỉ tạo cho chính mình (không thể check-in hộ người khác).
create policy "checkins: insert own"
on public.checkins for insert
to authenticated
with check (user_id = (select auth.uid()));

-- Sửa (dùng cho checkout = set checked_out_at): chỉ sửa check-in của mình.
create policy "checkins: update own"
on public.checkins for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- (Không có policy DELETE: Beta v1 không cho xoá check-in — giữ lịch sử để đo metric.)
