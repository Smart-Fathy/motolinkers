-- =====================================================================
--  Migration: vehicle 360° spin frames + interior panorama
--  Apply via Supabase Dashboard → SQL Editor → New Query → paste → Run.
--  Idempotent — safe to re-run.
-- =====================================================================

-- Ordered list of frame URLs for the exterior 360° spin viewer.
-- Convention: 36 frames, named alphabetically in capture order
-- (the admin form sorts uploads by filename before storing).
alter table public.vehicles
  add column if not exists spin_frames jsonb not null default '[]'::jsonb;

-- Single equirectangular image URL for the interior panorama viewer.
alter table public.vehicles
  add column if not exists pano_url text;

-- Force PostgREST to pick up the new columns immediately.
notify pgrst, 'reload schema';
