-- Chạy file này nếu 001 đã chạy xong phần bảng/RLS nhưng chỉ lỗi ở policy hoặc muốn seed lại
-- Không cần chạy nếu vừa chạy full 001_initial_schema.sql thành công

insert into public.roles (name, description)
values
  ('admin', 'Quản trị viên - Toàn quyền'),
  ('moderator', 'Quản lý'),
  ('user', 'Người dùng')
on conflict (name) do nothing;
