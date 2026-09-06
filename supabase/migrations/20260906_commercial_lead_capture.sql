create table if not exists public.commercial_leads (
  lead_id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  source text not null,
  email text not null,
  canonical text,
  attribution_root_key text,
  status text not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '365 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commercial_leads_email_check check (position('@' in email) > 1),
  constraint commercial_leads_status_check check (status in ('new','contacted','qualified','converted','closed'))
);

create index if not exists commercial_leads_attribution_idx on public.commercial_leads(attribution_root_key);
create index if not exists commercial_leads_created_idx on public.commercial_leads(created_at desc);
create index if not exists commercial_leads_expiry_idx on public.commercial_leads(expires_at);

alter table public.commercial_leads enable row level security;
revoke all on public.commercial_leads from anon, authenticated;
grant select, insert, update, delete on public.commercial_leads to service_role;

comment on table public.commercial_leads is 'Private EU commercial lead intake. PII is kept out of growth learning tables and expires by policy.';
