-- =====================================================================
-- 008_motoagent.sql
--
-- Tables backing MotoAgent (the floating bilingual chat widget):
--
--   motoagent_settings       — single-row config (id = 1).
--   motoagent_conversations  — one row per conversation; transcripts
--                               stored as a jsonb array of messages.
--
-- Auto-deletion after 30 days runs as a cron job (pg_cron preferred,
-- Cloudflare cron fallback). We do NOT store the user's IP in the
-- conversation row — the session_id is the only link, and it's an
-- opaque random UUID held in a first-party cookie.
--
-- Apply via Supabase Dashboard → SQL Editor → New Query → paste → Run.
-- =====================================================================

create table if not exists public.motoagent_settings (
  id int primary key default 1 check (id = 1),
  is_enabled boolean not null default true,
  model text not null default '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  temperature numeric(3,2) not null default 0.6
    check (temperature between 0 and 2),
  max_output_tokens int not null default 800
    check (max_output_tokens between 64 and 4096),
  system_prompt_extra text not null default '',
  greeting_en text not null default 'Hi! I''m the MotoLinkers assistant. Ask me anything about importing your next EV.',
  greeting_ar text not null default 'مرحباً! أنا مساعد MotoLinkers. اسألني أي شيء عن استيراد سيارتك الكهربائية القادمة.',
  daily_message_cap_per_session int not null default 60,
  per_minute_cap_per_session int not null default 12,
  updated_at timestamptz not null default now()
);

insert into public.motoagent_settings (id) values (1)
on conflict (id) do nothing;

create table if not exists public.motoagent_conversations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  locale text not null check (locale in ('en','ar')) default 'en',
  country text,
  message_count int not null default 0,
  transcript jsonb not null default '[]'::jsonb,
  lead_id uuid references public.leads(id) on delete set null,
  started_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create index if not exists motoagent_session_idx
  on public.motoagent_conversations (session_id);
create index if not exists motoagent_last_msg_idx
  on public.motoagent_conversations (last_message_at desc);
create index if not exists motoagent_started_idx
  on public.motoagent_conversations (started_at desc);

-- updated_at trigger (re-uses the helper from 004).
drop trigger if exists motoagent_settings_touch on public.motoagent_settings;
create trigger motoagent_settings_touch
  before update on public.motoagent_settings
  for each row execute function public.touch_updated_at();

alter table public.motoagent_settings enable row level security;
alter table public.motoagent_conversations enable row level security;

-- Public reads settings (so the widget knows enabled + greeting).
drop policy if exists "Public read motoagent settings" on public.motoagent_settings;
create policy "Public read motoagent settings"
  on public.motoagent_settings for select
  to anon, authenticated using (true);

-- Conversations are admin-only for read. Inserts + updates happen via
-- the chat API route which uses the cookies-bearing server client
-- (authenticated role) — but in our setup, the chat API runs as
-- ANONYMOUS (no admin login). So we also let anon INSERT new rows
-- and UPDATE rows whose session_id matches the caller's cookie.
--
-- Postgres RLS doesn't see cookies; we enforce session ownership at
-- the application layer in /api/motoagent. RLS here just bounds the
-- damage if the chat API is misused: anon can create rows + append
-- to any row (the API enforces session match), but cannot read other
-- sessions' transcripts.
grant select on public.motoagent_settings to anon, authenticated;
grant insert, update on public.motoagent_conversations to anon, authenticated;
grant select, update, delete on public.motoagent_conversations to authenticated;

drop policy if exists "Anon insert motoagent conversation" on public.motoagent_conversations;
create policy "Anon insert motoagent conversation"
  on public.motoagent_conversations for insert
  to anon, authenticated with check (true);

drop policy if exists "Anon update motoagent conversation" on public.motoagent_conversations;
create policy "Anon update motoagent conversation"
  on public.motoagent_conversations for update
  to anon, authenticated using (true) with check (true);

drop policy if exists "Admin all motoagent settings" on public.motoagent_settings;
create policy "Admin all motoagent settings"
  on public.motoagent_settings for all
  to authenticated using (true) with check (true);

drop policy if exists "Admin read motoagent conversations" on public.motoagent_conversations;
create policy "Admin read motoagent conversations"
  on public.motoagent_conversations for select
  to authenticated using (true);

drop policy if exists "Admin delete motoagent conversations" on public.motoagent_conversations;
create policy "Admin delete motoagent conversations"
  on public.motoagent_conversations for delete
  to authenticated using (true);

-- ─── retention cron (pg_cron) ───────────────────────────────────────
-- pg_cron is enabled by default on Supabase paid tiers. If the
-- following CREATE EXTENSION fails on your project, comment it out
-- and use a Cloudflare cron trigger instead.
do $$
begin
  if not exists (
    select 1 from pg_extension where extname = 'pg_cron'
  ) then
    -- pg_cron not installed; skip without failing the migration.
    raise notice 'pg_cron not installed; skipping retention cron schedule';
    return;
  end if;
end $$;

-- The schedule itself; idempotent because cron.schedule replaces
-- previous schedules with the same job name.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'motoagent-cleanup',
      '0 3 * * *',
      $cmd$ delete from public.motoagent_conversations where started_at < now() - interval '30 days' $cmd$
    );
    perform cron.schedule(
      'page-events-cleanup',
      '15 3 * * *',
      $cmd$ delete from public.page_events where created_at < now() - interval '90 days' $cmd$
    );
  end if;
end $$;

notify pgrst, 'reload schema';
