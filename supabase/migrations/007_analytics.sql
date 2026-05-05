-- =====================================================================
-- 007_analytics.sql
--
-- Adds the page_events table that backs /admin/analytics. One row per
-- public-page render. Visitor identity comes from the mlk_v / mlk_s
-- cookie pair set client-side; geo + device come from the Cloudflare
-- request context.
--
-- Apply via Supabase Dashboard → SQL Editor → New Query → paste → Run.
-- Idempotent — safe to re-run.
-- =====================================================================

create table if not exists public.page_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  path text not null,
  vehicle_slug text,
  country text,
  region text,
  city text,
  device text check (device in ('mobile','tablet','desktop')),
  referrer_kind text check (referrer_kind in ('direct','search','social','other')),
  is_new_visitor boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists page_events_path_created_idx
  on public.page_events (path, created_at desc);
create index if not exists page_events_vehicle_idx
  on public.page_events (vehicle_slug, created_at desc)
  where vehicle_slug is not null;
create index if not exists page_events_session_idx
  on public.page_events (session_id);
create index if not exists page_events_created_idx
  on public.page_events (created_at desc);
create index if not exists page_events_country_idx
  on public.page_events (country)
  where country is not null;

alter table public.page_events enable row level security;

-- Anyone can record their own page event (RLS allows insert only).
drop policy if exists "Anyone can insert a page event" on public.page_events;
create policy "Anyone can insert a page event"
  on public.page_events for insert
  to anon, authenticated
  with check (true);

-- Authenticated admin can read + delete (for retention cleanup +
-- /admin/analytics dashboard reads).
grant insert on public.page_events to anon, authenticated;
grant select, delete on public.page_events to authenticated;

drop policy if exists "Admin read page events" on public.page_events;
create policy "Admin read page events"
  on public.page_events for select
  to authenticated
  using (true);

drop policy if exists "Admin delete page events" on public.page_events;
create policy "Admin delete page events"
  on public.page_events for delete
  to authenticated
  using (true);

notify pgrst, 'reload schema';
