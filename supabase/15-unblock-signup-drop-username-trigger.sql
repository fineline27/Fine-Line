-- Emergency: sign-up fails with "Database error saving new user"
-- Paste this alone in Supabase SQL Editor and click Run. Safe to re-run.

drop trigger if exists on_auth_user_created_username on auth.users;
drop function if exists public.handle_new_user_username();
