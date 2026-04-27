-- =====================================================================
--  RLS + grants patch for anon/authenticated roles.
--  Apply via Supabase Dashboard → SQL Editor → New Query → Run.
--  Idempotent. After running, the lead form and reads will work.
-- =====================================================================

-- 1. Re-grant table privileges to the public/anon roles.
grant usage on schema public to anon, authenticated;
grant select on public.vehicles to anon, authenticated;
grant select on public.calculator_config to anon, authenticated;
grant select on public.news to anon, authenticated;
grant insert on public.leads to anon, authenticated;

-- 2. Drop and re-create RLS policies with explicit role targeting.
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

-- 3. Force PostgREST to reload its schema cache.
notify pgrst, 'reload schema';
