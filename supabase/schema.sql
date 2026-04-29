-- =====================================================================
--  MotoLinkers — initial schema
--  Apply via Supabase Dashboard → SQL Editor → New Query → paste → Run
-- =====================================================================

-- Vehicles
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  brand text,
  model text,
  trim text,
  origin text not null check (origin in ('cn', 'ae')),
  type text not null check (type in ('ev', 'reev', 'phev', 'hybrid')),
  body text check (body in ('sedan','suv','hatchback','coupe','wagon','pickup','mpv','convertible')),
  drive_type text check (drive_type in ('fwd','rwd','awd','4wd')),
  year int not null,
  price_egp bigint not null,
  price_usd int,
  transmission text,
  drivetrain text,
  range_km int,
  image_url text,
  gallery jsonb default '[]'::jsonb,
  features jsonb default '{}'::jsonb,
  specs jsonb default '{}'::jsonb,
  is_featured boolean default false,
  is_published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists vehicles_origin_idx on public.vehicles(origin);
create index if not exists vehicles_type_idx on public.vehicles(type);
create index if not exists vehicles_brand_idx on public.vehicles(brand);
create index if not exists vehicles_trim_idx on public.vehicles(trim);
create index if not exists vehicles_body_idx on public.vehicles(body);
create index if not exists vehicles_drive_type_idx on public.vehicles(drive_type);
create index if not exists vehicles_published_idx on public.vehicles(is_published);
create index if not exists vehicles_price_idx on public.vehicles(price_egp);

-- Leads (contact form submissions)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  vehicle_interest text,
  message text,
  source text default 'website',
  created_at timestamptz default now()
);

-- Calculator config (single row, id=1)
create table if not exists public.calculator_config (
  id int primary key default 1,
  egp_rate numeric(10,4) default 51.30,
  freight_cn int default 4025,
  freight_ae int default 2900,
  transit_cn int default 45,
  transit_ae int default 28,
  tax_ev numeric(4,2) default 0.17,
  tax_reev numeric(4,2) default 0.27,
  tax_phev numeric(4,2) default 0.58,
  vat numeric(4,2) default 0.14,
  insurance_rate numeric(5,4) default 0.015,
  clearance_usd int default 1200,
  inland_delivery_usd int default 350,
  consulting_fee_pct numeric(4,3) default 0.04,
  payment_usd_fee numeric(4,3) default 0.030,
  payment_bank_fee numeric(4,3) default 0.015,
  updated_at timestamptz default now()
);

insert into public.calculator_config (id) values (1)
  on conflict (id) do nothing;

-- News (for /news + /news/[slug])
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  body_md text,
  cover_image_url text,
  published_at timestamptz,
  is_published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists news_published_idx on public.news(is_published, published_at desc);

-- =====================================================================
--  Row Level Security
--  - Public can read published vehicles + news + calculator_config
--  - Anyone can INSERT a lead (contact form)
-- =====================================================================
alter table public.vehicles enable row level security;
alter table public.leads enable row level security;
alter table public.calculator_config enable row level security;
alter table public.news enable row level security;

drop policy if exists "Public read published vehicles" on public.vehicles;
create policy "Public read published vehicles"
  on public.vehicles for select
  to anon, authenticated
  using (is_published = true);

drop policy if exists "Public read calc config" on public.calculator_config;
create policy "Public read calc config"
  on public.calculator_config for select
  to anon, authenticated
  using (true);

drop policy if exists "Public read published news" on public.news;
create policy "Public read published news"
  on public.news for select
  to anon, authenticated
  using (is_published = true);

drop policy if exists "Anyone can submit a lead" on public.leads;
create policy "Anyone can submit a lead"
  on public.leads for insert
  to anon, authenticated
  with check (true);

-- =====================================================================
--  Seed: 15 vehicles from the reference design
-- =====================================================================
insert into public.vehicles (slug, name, origin, type, year, price_egp, transmission, drivetrain, image_url) values
  ('denza-n9',        'Denza N9 Premium',                'cn', 'hybrid', 2026, 5495808, 'CVT',          'Hybrid',             'https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__ChxkPmcIg1SAC8aOABS-CaJfeEE991.avif'),
  ('denza-d9',        'Denza D9 DMI Navigator',          'cn', 'hybrid', 2026, 4582780, 'Auto',         'Hybrid',             'https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__Chto52l282aAdFJRACsqCVLYKVo946.avif'),
  ('leopard-8',       'Fang Cheng Bao Leopard 8',        'cn', 'hybrid', 2026, 5272026, 'CVT',          'Hybrid · 7-seat',    'https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__ChtlyGe294uAVmSDADGjc-F-DHE533.avif'),
  ('leopard-7',       'Leopard 7 190KM Ultra 4WD',       'cn', 'hybrid', 2026, 3123726, 'Auto',         'Hybrid 4WD',         'https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__ChxpWGkITn-AJLkFAAmiY-1RJCo135.avif'),
  ('byd-tang',        'BYD Tang L EV LiDAR Flagship',    'cn', 'ev',     2026, 2485445, 'Fixed',        '670 km · Pure EV',   'https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__ChtpWGknIiyATwyuADJRagq1gp0475.avif'),
  ('byd-sealion',     'BYD Sealion 06 EV 605 PLUS',      'cn', 'ev',     2026, 1735474, 'Fixed',        '605 km · Pure EV',   'https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__Chto52jx-KSAPEjYACgLYFpHJ3E958.avif'),
  ('byd-yuan',        'BYD Yuan Up Smart Driving',       'cn', 'ev',     2025, 1316556, 'Fixed',        '401 km · Pure EV',   'https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__ChtlyGe8g0SAGTSOACml6eF6rXE546.avif'),
  ('icar-v23',        'ICAR V23 4WD',                    'cn', 'ev',     2026, 1796978, 'Fixed',        'Electric 4WD',       'https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__ChtpWGkIPwCAYgMbADp0_hK49ow697.avif'),
  ('nissan-n7',       'Nissan N7 625 Max',               'cn', 'ev',     2026, 1517340, 'Single-Speed', '625 km · EV',        'https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__Chtlx2gR21iAVZEFAFTCkCgt7TI284-1.avif'),
  ('bmw-i3',          'BMW i3 40 L',                     'ae', 'ev',     2026, 2501031, 'Single-Speed', 'Pure EV',            'https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__ChxpVml3lMOAK5jcAD2ES09g0Ms415.avif'),
  ('deepal-s05-max',  'Deepal S05 EV 620 Max',           'cn', 'ev',     2026, 1447221, 'Single-Speed', '620 km · EV',        'https://motolinkers.com/wp-content/uploads/2026/04/560x420_c42_autohomecar__ChtpWGisQU-AHOnIAFNwUKrNxXc077-3.avif'),
  ('deepal-s05',      'Deepal S05 520 Plus',             'cn', 'ev',     2026, 1199785, 'Auto',         '520 km · EV',        'https://motolinkers.com/wp-content/uploads/2026/03/22-660x440.avif'),
  ('avatr-12',        'Avatr 12 Max EV',                 'ae', 'ev',     2026, 2717414, 'Auto',         'Pure EV · Flagship', 'https://motolinkers.com/wp-content/uploads/2026/02/banner_pc-660x440.jpg'),
  ('avatr-07r',       'Avatr 07 REEV Ultra',             'cn', 'hybrid', 2026, 2417567, 'Auto',         'REEV Ultra',         'https://motolinkers.com/wp-content/uploads/2026/02/CAR-2-660x440.jpg'),
  ('avatr-07e',       'Avatr 07 EV Max Plus',            'ae', 'ev',     2026, 2683590, 'Auto',         'Pure EV Max',        'https://motolinkers.com/wp-content/uploads/2026/02/CAR-1-660x440.jpg')
on conflict (slug) do nothing;
