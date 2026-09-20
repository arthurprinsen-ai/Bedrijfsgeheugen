create table if not exists public.saas_plans (
  code text primary key,
  name text not null,
  monthly_price_cents integer,
  currency text not null default 'eur',
  direct_checkout boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (monthly_price_cents is null or monthly_price_cents >= 0)
);

create table if not exists public.saas_plan_entitlements (
  plan_code text not null references public.saas_plans(code) on delete cascade,
  entitlement_key text not null,
  entitlement_value jsonb not null,
  primary key (plan_code, entitlement_key)
);

create table if not exists public.saas_checkout_intents (
  id uuid primary key default gen_random_uuid(),
  plan_code text not null references public.saas_plans(code),
  email text not null,
  company_name text not null,
  state text not null default 'created' check (state in ('created','checkout_open','completed','expired','failed')),
  provider text not null default 'stripe',
  provider_session_id text unique,
  organisation_id uuid references public.organisaties(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saas_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisaties(id) on delete cascade,
  plan_code text not null references public.saas_plans(code),
  provider text not null default 'stripe',
  provider_customer_id text,
  provider_subscription_id text unique,
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saas_usage_counters (
  organisation_id uuid not null references public.organisaties(id) on delete cascade,
  meter_key text not null,
  period_start date not null,
  used numeric not null default 0 check (used >= 0),
  updated_at timestamptz not null default now(),
  primary key (organisation_id, meter_key, period_start)
);

alter table public.saas_plans enable row level security;
alter table public.saas_plan_entitlements enable row level security;
alter table public.saas_checkout_intents enable row level security;
alter table public.saas_subscriptions enable row level security;
alter table public.saas_usage_counters enable row level security;

revoke all on table public.saas_plans from anon, authenticated;
revoke all on table public.saas_plan_entitlements from anon, authenticated;
revoke all on table public.saas_checkout_intents from anon, authenticated;
revoke all on table public.saas_subscriptions from anon, authenticated;
revoke all on table public.saas_usage_counters from anon, authenticated;
grant select, insert, update, delete on public.saas_plans, public.saas_plan_entitlements, public.saas_checkout_intents, public.saas_subscriptions, public.saas_usage_counters to service_role;

insert into public.saas_plans(code,name,monthly_price_cents,currency,direct_checkout,active,sort_order)
values
 ('control','Control',149500,'eur',true,true,10),
 ('scale','Scale',249500,'eur',true,true,20),
 ('enterprise','Enterprise',499500,'eur',false,true,30)
on conflict (code) do update set
 name=excluded.name,
 monthly_price_cents=excluded.monthly_price_cents,
 currency=excluded.currency,
 direct_checkout=excluded.direct_checkout,
 active=excluded.active,
 sort_order=excluded.sort_order,
 updated_at=now();

insert into public.saas_plan_entitlements(plan_code,entitlement_key,entitlement_value) values
 ('control','intelligence_core','true'::jsonb),
 ('control','data_sources','5'::jsonb),
 ('control','refresh_minutes','1440'::jsonb),
 ('control','external_signal_scan','"daily"'::jsonb),
 ('control','forecasting','true'::jsonb),
 ('control','scenario_analysis','true'::jsonb),
 ('control','agent_mode','"recommend"'::jsonb),
 ('control','organisations','1'::jsonb),
 ('control','sso','false'::jsonb),
 ('control','audit_trail','false'::jsonb),
 ('control','senior_advisory_minutes_month','60'::jsonb),
 ('scale','intelligence_core','true'::jsonb),
 ('scale','data_sources','15'::jsonb),
 ('scale','refresh_minutes','60'::jsonb),
 ('scale','external_signal_scan','"daily"'::jsonb),
 ('scale','forecasting','true'::jsonb),
 ('scale','scenario_analysis','true'::jsonb),
 ('scale','agent_mode','"approval_required"'::jsonb),
 ('scale','organisations','1'::jsonb),
 ('scale','sso','false'::jsonb),
 ('scale','audit_trail','true'::jsonb),
 ('scale','senior_advisory_minutes_month','120'::jsonb),
 ('enterprise','intelligence_core','true'::jsonb),
 ('enterprise','data_sources','999'::jsonb),
 ('enterprise','refresh_minutes','0'::jsonb),
 ('enterprise','external_signal_scan','"custom"'::jsonb),
 ('enterprise','forecasting','true'::jsonb),
 ('enterprise','scenario_analysis','true'::jsonb),
 ('enterprise','agent_mode','"guardrailed_autonomous"'::jsonb),
 ('enterprise','organisations','25'::jsonb),
 ('enterprise','sso','true'::jsonb),
 ('enterprise','audit_trail','true'::jsonb),
 ('enterprise','senior_advisory_minutes_month','240'::jsonb)
on conflict (plan_code,entitlement_key) do update set entitlement_value=excluded.entitlement_value;

create or replace view public.saas_active_entitlements with (security_invoker = true) as
select s.organisation_id,s.plan_code,s.status,p.name as plan_name,p.monthly_price_cents,
       jsonb_object_agg(e.entitlement_key,e.entitlement_value order by e.entitlement_key) as entitlements
from public.saas_subscriptions s
join public.saas_plans p on p.code=s.plan_code
join public.saas_plan_entitlements e on e.plan_code=s.plan_code
where s.status in ('trialing','active','past_due')
group by s.organisation_id,s.plan_code,s.status,p.name,p.monthly_price_cents;

revoke all on table public.saas_active_entitlements from public, anon, authenticated;
grant select on public.saas_active_entitlements to service_role;

comment on table public.saas_plan_entitlements is 'Canonical server-side SaaS capability limits. Core intelligence remains available in every paid plan; tiers differ by scale, freshness, automation and governance.';
comment on table public.saas_subscriptions is 'Provider-synchronized subscription truth used for portal entitlement enforcement.';
