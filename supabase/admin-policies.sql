-- =====================================================================
--  Admin CRUD policies for the authenticated role.
--  Apply via: Supabase Dashboard → SQL Editor → New Query → paste → Run.
--
--  Prerequisite: at least one admin user must exist (Supabase Dashboard
--  → Authentication → Users → Add User). With public sign-ups disabled
--  the `authenticated` role is effectively the admin role.
--
--  Idempotent — safe to run multiple times.
-- =====================================================================

-- 1. Grant table-level privileges to the authenticated role
grant all on public.vehicles to authenticated;
grant all on public.news to authenticated;
grant select, delete on public.leads to authenticated;
grant all on public.calculator_config to authenticated;
grant all on public.page_heroes to authenticated;
grant all on public.page_sections to authenticated;

-- 2. Vehicles: admin sees ALL rows (including unpublished), full CRUD.
drop policy if exists "Admin full access vehicles" on public.vehicles;
create policy "Admin full access vehicles"
  on public.vehicles for all
  to authenticated
  using (true)
  with check (true);

-- 3. News: admin sees ALL rows, full CRUD.
drop policy if exists "Admin full access news" on public.news;
create policy "Admin full access news"
  on public.news for all
  to authenticated
  using (true)
  with check (true);

-- 4. Leads: admin can read everything + delete.
drop policy if exists "Admin read leads" on public.leads;
create policy "Admin read leads"
  on public.leads for select
  to authenticated
  using (true);

drop policy if exists "Admin delete leads" on public.leads;
create policy "Admin delete leads"
  on public.leads for delete
  to authenticated
  using (true);

-- 5. Calculator config: admin can update the single row.
drop policy if exists "Admin update calc config" on public.calculator_config;
create policy "Admin update calc config"
  on public.calculator_config for update
  to authenticated
  using (true)
  with check (true);

-- 6. Force PostgREST to pick up the new policies immediately.
notify pgrst, 'reload schema';
