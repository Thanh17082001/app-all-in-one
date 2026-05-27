# Supabase setup

## Nguyên tắc (chuẩn)

- **Nguồn sự thật:** file trong `supabase/migrations/` — không tạo bảng tay lệch trên Dashboard.
- **FE** (`src/services/*`, `database.types.ts`) được viết cho schema **`001_initial_schema.sql`** (`id` kiểu **bigint**, một bảng **`tests`**).
- **`profiles.id`** = `uuid` (liên kết `auth.users`) — đúng chuẩn Supabase Auth.

## Thứ tự chạy migration (project mới hoặc sửa schema lệch)

| Bước | File | Khi nào |
|------|------|---------|
| 1 | `000_reset_dev_schema.sql` | DB đã tạo tay (uuid, `test` + `tests`, ...) — **chỉ dev, không production** |
| 2 | `001_initial_schema.sql` | Bắt buộc — roles, permissions, tests, profiles, RLS, seed |
| 3 | `002_expense_schema.sql` | Tùy chọn — bảng chi tiêu (bigint, khớp FE sau này) |

**SQL Editor:** chạy từng file theo thứ tự → **Run**.

## 1. Env frontend

`front-end/.env`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 2. Tài khoản mẫu (admin)

### Bước A — Tạo user trên Supabase (bắt buộc)

**Authentication** → **Users** → **Add user** → điền:

| Ô | Giá trị gợi ý |
|---|----------------|
| Email | `admin@example.com` |
| Password | `Admin123!` |
| Auto Confirm User | Bật |

Lưu ý: Mật khẩu **không** tạo bằng SQL — chỉ tạo ở đây hoặc API Auth.

Trigger `handle_new_user` tự thêm dòng `profiles` (username mặc định = phần trước `@`, ví dụ `admin`).

### Bước B — Gán quyền admin

SQL Editor → chạy `migrations/003_sample_admin_user.sql`  
(hoặc copy đoạn `UPDATE` trong file đó).

### Bước C — Đăng nhập app

`npm run dev` → `/login`:

| Cách nhập | Giá trị |
|-----------|---------|
| Username | `admin` |
| Hoặc email | `admin@example.com` |
| Password | `Admin123!` (đúng password đã tạo ở Bước A) |

### User thường (không admin)

- **Cách 1:** App → `/register` (đăng ký tự phục vụ, role `user` từ trigger).
- **Cách 2:** Dashboard Add user → **không** chạy `003`.

**Supabase Auth (dev):** Authentication → Providers → Email → tắt **Confirm email** nếu muốn đăng nhập ngay sau đăng ký. Bật **Enable sign ups**.

```sql
-- Xem tất cả profile + role
select p.username, p.email, r.name as role
from public.profiles p
left join public.roles r on r.id = p.role_id;
```

## 3. Chạy app

```bash
npm run dev
```

## Khắc phục schema lệch (chuẩn nhất)

Nếu Dashboard có schema **uuid** / hai bảng `test` & `tests` / thiếu RLS:

1. Backup nếu có dữ liệu quan trọng.
2. Chạy `000_reset_dev_schema.sql`.
3. Chạy `001_initial_schema.sql`.
4. (Tuỳ chọn) `002_expense_schema.sql`.
5. Tạo lại user Auth + `UPDATE profiles` gán admin.
6. Kiểm tra **Table Editor**: `roles.id` = **int8**, `profiles.role_id` = **int8**, chỉ có **`tests`** (không `test`).

## Không nên

- Sửa PK sang `uuid` trên DB mà không sửa toàn bộ FE types/services.
- Giữ đồng thời `test` và `tests`.
- Dùng `service_role` key trong Vite.

## Production

Không chạy `000_reset_dev_schema.sql` trên production. Dùng migration incremental hoặc `supabase db push` / CLI khi team đã setup Supabase CLI.
