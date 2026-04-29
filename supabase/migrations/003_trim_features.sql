-- =====================================================================
--  Migration: vehicle trim + features
--  Apply via Supabase Dashboard → SQL Editor → New Query → paste → Run.
--  Idempotent.
-- =====================================================================

alter table public.vehicles add column if not exists trim text;
alter table public.vehicles add column if not exists features jsonb default '{}'::jsonb;

create index if not exists vehicles_trim_idx on public.vehicles(trim);

-- Force PostgREST to pick up the new columns immediately.
notify pgrst, 'reload schema';
