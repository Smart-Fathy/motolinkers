-- =====================================================================
--  Migration: vehicle filter fields + gallery
--  Apply via Supabase Dashboard → SQL Editor → New Query → paste → Run.
--  Idempotent — safe to run on a database that already has some of
--  these columns (e.g. `gallery`, which the team added by hand).
-- =====================================================================

-- Brand / model — free text (open-ended taxonomy)
alter table public.vehicles add column if not exists brand text;
alter table public.vehicles add column if not exists model text;

-- Body type — closed enum
alter table public.vehicles add column if not exists body text;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'vehicles_body_check'
  ) then
    alter table public.vehicles
      add constraint vehicles_body_check
      check (body is null or body in ('sedan','suv','hatchback','coupe','wagon','pickup','mpv','convertible'));
  end if;
end$$;

-- Drive type — closed enum (FWD / RWD / AWD / 4WD)
alter table public.vehicles add column if not exists drive_type text;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'vehicles_drive_type_check'
  ) then
    alter table public.vehicles
      add constraint vehicles_drive_type_check
      check (drive_type is null or drive_type in ('fwd','rwd','awd','4wd'));
  end if;
end$$;

-- Gallery — array of image URLs as jsonb. Likely already exists; the
-- `if not exists` makes this safe to re-run.
alter table public.vehicles add column if not exists gallery jsonb default '[]'::jsonb;

-- Indexes for the new filter columns + price (used by the public sort
-- and filter widget on /vehicles).
create index if not exists vehicles_brand_idx     on public.vehicles(brand);
create index if not exists vehicles_body_idx      on public.vehicles(body);
create index if not exists vehicles_drive_type_idx on public.vehicles(drive_type);
create index if not exists vehicles_price_idx     on public.vehicles(price_egp);

-- Force PostgREST to pick up the new columns immediately.
notify pgrst, 'reload schema';
