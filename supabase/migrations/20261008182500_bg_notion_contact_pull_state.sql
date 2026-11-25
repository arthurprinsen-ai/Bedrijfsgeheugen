-- Canonical cursor for bounded Notion contact reconciliation in the existing hourly Edge Function.
create table if not exists public.bg_notion_contact_pull_state (
  source_id text primary key,
  next_cursor text,
  cycle_completed_at timestamptz,
  last_success_at timestamptz,
  pages_processed bigint not null default 0,
  contacts_updated bigint not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.bg_notion_contact_pull_state enable row level security;
revoke all on public.bg_notion_contact_pull_state from public, anon, authenticated;
grant select, insert, update on public.bg_notion_contact_pull_state to service_role;
