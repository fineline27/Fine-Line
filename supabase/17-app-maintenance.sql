-- Remote maintenance switch: flip without redeploying the app.
-- Run in Supabase SQL Editor. Updates use the service role / dashboard only (no client write policies).

create table if not exists public.app_maintenance (
  id smallint primary key default 1 check (id = 1),
  enabled boolean not null default false,
  message text not null default 'We''re making a few updates and will be back shortly.',
  updated_at timestamptz not null default now()
);

insert into public.app_maintenance (id, enabled)
values (1, false)
on conflict (id) do nothing;

alter table public.app_maintenance enable row level security;

drop policy if exists "Anyone can read maintenance flag" on public.app_maintenance;
create policy "Anyone can read maintenance flag"
  on public.app_maintenance for select
  to anon, authenticated
  using (true);

-- Enable maintenance:
--   update public.app_maintenance set enabled = true, message = 'Your message', updated_at = now() where id = 1;
-- Disable:
--   update public.app_maintenance set enabled = false, updated_at = now() where id = 1;

grant select on public.app_maintenance to anon, authenticated;
