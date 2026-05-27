-- ============================================================
-- Tài khoản mẫu ADMIN (chạy SAU khi đã tạo user trong Authentication)
-- ============================================================
--
-- Bước 1 — Dashboard: Authentication → Users → Add user
--   Email:    admin@example.com
--   Password: Admin123!          (đổi mật khẩu mạnh hơn khi deploy)
--   Bật: Auto Confirm User
--
-- Bước 2 — Chạy SQL dưới đây (đổi email nếu khác)
-- ============================================================

-- Gán role admin (trigger đã tạo profiles khi Add user)
update public.profiles p
set
  role_id = (select id from public.roles where name = 'admin' limit 1),
  username = 'admin'
where p.email = 'admin@example.com';

-- Kiểm tra
select
  p.id,
  p.username,
  p.email,
  r.name as role_name
from public.profiles p
left join public.roles r on r.id = p.role_id
where p.email = 'admin@example.com';
