-- =====================================================================
-- 004_pages_and_content.sql
--
-- Adds two related tables that turn the public site into a CMS:
--
--   1. `page_heroes`   — per-page hero image with admin-tunable
--                        height / radius / opacity / overlay.
--   2. `page_sections` — ordered, typed content blocks rendered below
--                        each page's existing structure. Supports
--                        paragraph and image in this round; more
--                        types come later (rich_text, gallery, list,
--                        cta, spacer, divider, embed).
--
-- Apply via Supabase Dashboard → SQL Editor → New Query → paste → Run.
-- Idempotent: safe to re-run.
-- =====================================================================

-- ─── page_heroes ─────────────────────────────────────────────────────
create table if not exists public.page_heroes (
  page_slug text primary key,
  image_url text,
  alt text,
  height_vh int default 60 check (height_vh between 20 and 100),
  border_radius_px int default 0 check (border_radius_px between 0 and 64),
  opacity numeric(3,2) default 1.00 check (opacity between 0.05 and 1.00),
  overlay_color text default '#0a0a0a',
  overlay_opacity numeric(3,2) default 0.35
    check (overlay_opacity between 0.00 and 1.00),
  is_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists page_heroes_enabled_idx
  on public.page_heroes (is_enabled);

-- Seed one row per known public page slug so the admin index always
-- shows the full set even before anyone edits one.
insert into public.page_heroes (page_slug)
values
  ('home'),
  ('about'),
  ('how-it-works'),
  ('vehicles'),
  ('news'),
  ('contact'),
  ('calculator'),
  ('faq'),
  ('terms'),
  ('privacy')
on conflict (page_slug) do nothing;

-- ─── page_sections ───────────────────────────────────────────────────
create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null,
  position int not null,
  type text not null
    check (type in (
      'paragraph','image','heading','rich_text',
      'gallery','list','cta','spacer','divider','embed'
    )),
  data jsonb not null default '{}'::jsonb,
  is_visible boolean not null default true,
  updated_at timestamptz not null default now()
);

-- One row per (page, position) — used by the renderer for ordering and
-- by the admin reorder action to swap positions atomically.
create unique index if not exists page_sections_pos_uq
  on public.page_sections (page_slug, position);

create index if not exists page_sections_visible_idx
  on public.page_sections (page_slug, position)
  where is_visible = true;

-- ─── RLS ─────────────────────────────────────────────────────────────
alter table public.page_heroes enable row level security;
alter table public.page_sections enable row level security;

-- Public can read enabled / visible rows only.
drop policy if exists "Public read enabled heroes" on public.page_heroes;
create policy "Public read enabled heroes"
  on public.page_heroes for select
  to anon, authenticated
  using (is_enabled = true);

drop policy if exists "Public read visible sections" on public.page_sections;
create policy "Public read visible sections"
  on public.page_sections for select
  to anon, authenticated
  using (is_visible = true);

-- Admin (any authenticated user, since public sign-ups are off)
-- gets full CRUD including reading rows that are not yet enabled /
-- visible.
grant all on public.page_heroes to authenticated;
grant all on public.page_sections to authenticated;

drop policy if exists "Admin full access page heroes" on public.page_heroes;
create policy "Admin full access page heroes"
  on public.page_heroes for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Admin full access page sections" on public.page_sections;
create policy "Admin full access page sections"
  on public.page_sections for all
  to authenticated
  using (true)
  with check (true);

-- ─── updated_at trigger ──────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists page_heroes_touch on public.page_heroes;
create trigger page_heroes_touch
  before update on public.page_heroes
  for each row execute function public.touch_updated_at();

drop trigger if exists page_sections_touch on public.page_sections;
create trigger page_sections_touch
  before update on public.page_sections
  for each row execute function public.touch_updated_at();

notify pgrst, 'reload schema';
