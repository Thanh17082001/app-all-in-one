-- ============================================================
-- RESET DEV SCHEMA (chỉ dùng khi chưa có dữ liệu production)
-- Chạy TRƯỚC 001_initial_schema.sql khi DB lệch (uuid, bảng trùng test/tests...)
-- Dashboard → SQL Editor → Run
-- ============================================================

-- Xóa toàn bộ object trong schema public (bảng, function, policy...)
drop schema if exists public cascade;

create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all on all routines in schema public to postgres, anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to postgres, anon, authenticated, service_role;

alter default privileges in schema public
  grant all on sequences to postgres, anon, authenticated, service_role;

alter default privileges in schema public
  grant all on routines to postgres, anon, authenticated, service_role;
