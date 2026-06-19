-- Migration: hardening — đưa helper SECURITY DEFINER ra khỏi API schema
-- Fix Security Advisor warnings (xem brewdesk-docs/03-decisions-log.md, 2026-06-19):
--   - anon_security_definer_function_executable
--   - authenticated_security_definer_function_executable
--
-- VẤN ĐỀ: user_active_cafe_ids() nằm ở schema `public` → PostgREST tự expose thành
-- RPC /rest/v1/rpc/user_active_cafe_ids, ai cũng gọi được. Function này chạy
-- SECURITY DEFINER (bỏ qua RLS bên trong, để cắt đệ quy policy checkins) nên KHÔNG
-- nên cho client gọi trực tiếp — nó chỉ là helper dùng BÊN TRONG RLS policy.
--
-- CÁCH SỬA: chuyển sang schema `private` (PostgREST chỉ expose `public` + graphql).
-- Policy vẫn chạy bình thường vì `authenticated` vẫn giữ EXECUTE trong SQL/policy
-- (invoker cần EXECUTE — đó là lý do KHÔNG dùng cách `revoke from authenticated`,
--  sẽ gây "permission denied for function" ngay trong policy).

-- ───────────────────────────────────────────────────────────────────────────
-- schema riêng, không nằm trong danh sách PostgREST expose → hết cửa RPC.
create schema if not exists private;

-- Tạo lại function ở private (nội dung y hệt, vẫn security definer).
create or replace function private.user_active_cafe_ids()
returns setof uuid
language sql
security definer            -- chạy bằng quyền owner → bỏ qua RLS bên trong, cắt đệ quy
set search_path = public    -- chống search_path hijack (bắt buộc với security definer)
stable
as $$
  select cafe_id from public.checkins
  where user_id = (select auth.uid())
    and checked_out_at is null
$$;

-- Least-privilege: chỉ authenticated dùng được (anon không cần, cũng không có schema usage).
grant usage on schema private to authenticated;
revoke all on function private.user_active_cafe_ids() from public;
grant execute on function private.user_active_cafe_ids() to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- Trỏ policy sang function mới, rồi bỏ function cũ ở public.
drop policy if exists "checkins: read own or same active cafe" on public.checkins;

create policy "checkins: read own or same active cafe"
on public.checkins for select
to authenticated
using (
  user_id = (select auth.uid())
  or cafe_id in (select private.user_active_cafe_ids())
);

drop function if exists public.user_active_cafe_ids();
