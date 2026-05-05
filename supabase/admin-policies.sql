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
grant insert on public.page_events to anon, authenticated;
grant select, delete on public.page_events to authenticated;
grant select on public.motoagent_settings to anon, authenticated;
grant insert, update on public.motoagent_conversations to anon, authenticated;
grant all on public.motoagent_settings to authenticated;
grant select, update, delete on public.motoagent_conversations to authenticated;

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

-- 6. Page events: admin reads + deletes; anon inserts handled by RLS.
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

-- 7. MotoAgent: admin sees ALL conversations + can edit settings.
drop policy if exists "Admin all motoagent settings" on public.motoagent_settings;
create policy "Admin all motoagent settings"
  on public.motoagent_settings for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Admin read motoagent conversations" on public.motoagent_conversations;
create policy "Admin read motoagent conversations"
  on public.motoagent_conversations for select
  to authenticated
  using (true);

drop policy if exists "Admin delete motoagent conversations" on public.motoagent_conversations;
create policy "Admin delete motoagent conversations"
  on public.motoagent_conversations for delete
  to authenticated
  using (true);

-- 8. Force PostgREST to pick up the new policies immediately.
notify pgrst, 'reload schema';
