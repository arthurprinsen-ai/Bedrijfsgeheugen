begin;

alter table public.powerhouse_resource_impact_v1
  add column if not exists energy_wh numeric(20,6),
  add column if not exists energy_method text,
  add column if not exists energy_provenance jsonb,
  add column if not exists energy_confidence numeric(5,4),
  add column if not exists water_ml numeric(20,6),
  add column if not exists water_method text,
  add column if not exists water_provenance jsonb,
  add column if not exists water_confidence numeric(5,4),
  add column if not exists co2e_method text,
  add column if not exists co2e_provenance jsonb,
  add column if not exists co2e_confidence numeric(5,4);

alter table public.powerhouse_resource_impact_v1
  drop constraint if exists powerhouse_resource_impact_v1_energy_nonnegative,
  add constraint powerhouse_resource_impact_v1_energy_nonnegative check (energy_wh is null or energy_wh >= 0),
  drop constraint if exists powerhouse_resource_impact_v1_water_nonnegative,
  add constraint powerhouse_resource_impact_v1_water_nonnegative check (water_ml is null or water_ml >= 0),
  drop constraint if exists powerhouse_resource_impact_v1_energy_confidence_range,
  add constraint powerhouse_resource_impact_v1_energy_confidence_range check (energy_confidence is null or (energy_confidence >= 0 and energy_confidence <= 1)),
  drop constraint if exists powerhouse_resource_impact_v1_water_confidence_range,
  add constraint powerhouse_resource_impact_v1_water_confidence_range check (water_confidence is null or (water_confidence >= 0 and water_confidence <= 1)),
  drop constraint if exists powerhouse_resource_impact_v1_co2e_confidence_range,
  add constraint powerhouse_resource_impact_v1_co2e_confidence_range check (co2e_confidence is null or (co2e_confidence >= 0 and co2e_confidence <= 1));

comment on column public.powerhouse_resource_impact_v1.energy_wh is 'Nullable physical telemetry. NULL means unknown; never coerce unknown to zero.';
comment on column public.powerhouse_resource_impact_v1.water_ml is 'Nullable physical telemetry. NULL means unknown; never coerce unknown to zero.';
comment on column public.powerhouse_resource_impact_v1.energy_provenance is 'Machine-readable source/method evidence for energy telemetry.';
comment on column public.powerhouse_resource_impact_v1.water_provenance is 'Machine-readable source/method evidence for water telemetry.';
comment on column public.powerhouse_resource_impact_v1.co2e_provenance is 'Machine-readable source/method evidence for CO2e telemetry; legacy zero values are not proof of measured zero.';

create table if not exists public.powerhouse_compliance_evidence_v1 (
  evidence_id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  observed_at timestamptz not null default now(),
  control_key text not null,
  requirement_key text not null,
  subject_type text not null,
  subject_id text not null,
  evidence_status text not null check (evidence_status in ('evidence_present','evidence_missing','not_applicable','review_required')),
  evidence_refs jsonb not null default '[]'::jsonb,
  provenance jsonb not null default '{}'::jsonb,
  confidence numeric(5,4) not null check (confidence >= 0 and confidence <= 1),
  review_required boolean not null default false,
  reviewer_note text,
  source_key text not null unique,
  notes text
);

alter table public.powerhouse_compliance_evidence_v1 enable row level security;
alter table public.powerhouse_compliance_evidence_v1 force row level security;
revoke all on public.powerhouse_compliance_evidence_v1 from public, anon, authenticated;
grant select, insert, update on public.powerhouse_compliance_evidence_v1 to service_role;

create table if not exists public.powerhouse_optimization_candidate_v1 (
  candidate_id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_key text not null unique,
  component_id text not null,
  owner_agent text,
  opportunity_type text not null,
  baseline jsonb not null default '{}'::jsonb,
  expected_impact jsonb not null default '{}'::jsonb,
  confidence numeric(5,4) not null check (confidence >= 0 and confidence <= 1),
  safety_class text not null check (safety_class in ('safe_reversible','review_required','blocked_hard_boundary')),
  proposed_action jsonb not null default '{}'::jsonb,
  rollback_plan jsonb not null default '{}'::jsonb,
  status text not null default 'candidate' check (status in ('candidate','approved_by_policy','executing','measuring','kept','rolled_back','rejected','blocked')),
  production_authority text not null default 'BG169' check (production_authority = 'BG169'),
  measured_outcome jsonb,
  outcome_evidence jsonb,
  learning_fingerprint text,
  notes text
);

alter table public.powerhouse_optimization_candidate_v1 enable row level security;
alter table public.powerhouse_optimization_candidate_v1 force row level security;
revoke all on public.powerhouse_optimization_candidate_v1 from public, anon, authenticated;
grant select, insert, update on public.powerhouse_optimization_candidate_v1 to service_role;

create or replace view public.powerhouse_resource_intelligence_daily_v1
with (security_invoker = true)
as
with resource_daily as (
  select
    date_trunc('day', created_at) as day,
    coalesce(provider, 'unknown') as provider,
    coalesce(model_id, 'unknown') as model_id,
    count(*)::bigint as invocations,
    sum(coalesce(input_tokens, 0) + coalesce(output_tokens, 0))::bigint as tokens,
    sum(cloud_cost_eur) as cloud_cost_eur,
    sum(case when co2e_method is not null and co2e_confidence is not null then estimated_co2e_g else null end) as estimated_co2e_g,
    sum(energy_wh) as energy_wh,
    sum(water_ml) as water_ml,
    min(energy_confidence) filter (where energy_wh is not null) as min_energy_confidence,
    min(water_confidence) filter (where water_ml is not null) as min_water_confidence,
    min(co2e_confidence) filter (where co2e_method is not null) as min_co2e_confidence,
    bool_and(energy_wh is null or (energy_method is not null and energy_provenance is not null and energy_confidence is not null)) as energy_provenance_complete,
    bool_and(water_ml is null or (water_method is not null and water_provenance is not null and water_confidence is not null)) as water_provenance_complete
  from public.powerhouse_resource_impact_v1
  group by 1, 2, 3
),
value_daily as (
  select
    date_trunc('day', created_at) as day,
    coalesce(provider, 'unknown') as provider,
    coalesce(model_id, 'unknown') as model_id,
    sum(outcome_value_eur) as outcome_value_eur,
    avg(value_score_0_100) as avg_value_score_0_100,
    avg(risk_score_0_100) as avg_risk_score_0_100
  from public.powerhouse_business_value_v1
  group by 1, 2, 3
)
select
  r.*,
  v.outcome_value_eur,
  v.avg_value_score_0_100,
  v.avg_risk_score_0_100,
  case when r.cloud_cost_eur > 0 and v.outcome_value_eur is not null then v.outcome_value_eur / r.cloud_cost_eur else null end as value_per_cost_eur
from resource_daily r
left join value_daily v using (day, provider, model_id);

revoke all on public.powerhouse_resource_intelligence_daily_v1 from public, anon, authenticated;
grant select on public.powerhouse_resource_intelligence_daily_v1 to service_role;

create or replace view public.powerhouse_resource_optimization_queue_v1
with (security_invoker = true)
as
select *
from public.powerhouse_optimization_candidate_v1
where status in ('candidate','approved_by_policy','executing','measuring')
order by
  case safety_class when 'safe_reversible' then 0 when 'review_required' then 1 else 2 end,
  confidence desc,
  created_at asc;

revoke all on public.powerhouse_resource_optimization_queue_v1 from public, anon, authenticated;
grant select on public.powerhouse_resource_optimization_queue_v1 to service_role;

commit;
