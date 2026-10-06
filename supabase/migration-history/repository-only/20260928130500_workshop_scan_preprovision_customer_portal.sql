create table if not exists public.workshop_portal_intakes (
  submission_key text primary key references public.scan_inzendingen(submission_key) on delete cascade,
  portal_tenant_id text not null unique,
  organisatie_id uuid null references public.organisaties(id) on delete set null,
  company_name text not null,
  contact_name text not null,
  email text not null,
  website text null,
  employees text null,
  sector text null,
  region text null,
  consented_at timestamptz not null default now(),
  scan_snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'preprovisioned' check (status in ('preprovisioned','claimed')),
  claimed_tenant_id text null,
  claimed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workshop_portal_intakes enable row level security;
revoke all on public.workshop_portal_intakes from anon, authenticated;
grant all on public.workshop_portal_intakes to service_role;

comment on table public.workshop_portal_intakes is
  'Private pre-provisioned customer portal intake for workshop scans. Contains PII and is never used as benchmark/aggregate learning input.';

create index if not exists workshop_portal_intakes_email_idx
  on public.workshop_portal_intakes (lower(email));
