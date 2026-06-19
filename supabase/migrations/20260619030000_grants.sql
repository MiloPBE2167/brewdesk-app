-- Migration: table GRANTs cho anon/authenticated (nửa còn lại của RLS)
-- Phát hiện qua test RLS 2-user (scripts/rls-test.mjs): authenticated bị
-- "permission denied for table profiles" — vì init_schema bật RLS + tạo policy
-- nhưng CHƯA grant quyền tầng bảng cho 2 role này.
--
-- ⚠️ NGUYÊN TẮC: RLS chỉ LỌC DÒNG, KHÔNG cấp quyền. Postgres kiểm 2 lớp:
--   1) GRANT tầng bảng (role có được đụng bảng không?) — lớp này thiếu = permission denied
--   2) RLS policy (được thấy/ghi dòng nào?) — chỉ chạy SAU khi qua lớp 1
-- Phải có CẢ HAI. Grant ở đây mở "cửa bảng"; policy (xem 20260619010000_rls.sql)
-- mới quyết định dòng nào lọt qua. service_role bỏ qua cả hai (admin).
--
-- Phạm vi grant khớp đúng với policy đã viết — không thừa quyền:
--   - KHÔNG grant DELETE (không có policy delete — giữ lịch sử check-in)
--   - KHÔNG grant write trên cafes (admin-only qua service_role)

-- profiles: authenticated đọc (mọi profile) + ghi (policy lọc về chính mình)
grant select, insert, update on public.profiles to authenticated;

-- cafes: đọc công khai (kể cả khách chưa đăng nhập, cho landing preview)
grant select on public.cafes to anon, authenticated;

-- checkins: authenticated đọc (own + same active cafe) + tạo/checkout (own)
grant select, insert, update on public.checkins to authenticated;
