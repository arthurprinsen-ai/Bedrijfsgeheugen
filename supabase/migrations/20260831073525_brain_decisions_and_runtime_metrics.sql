create table if not exists public.brain_decisions (
  tenant_id text not null,
  decision_id text not null,
  correlation_id text,
  subject_id text,
  owner_id text not null,
  status text not null default 'DRAFT',
  recommended_scenario_id text,
  selected_scenario_id text,
  selected_by text,
  rationale text,
  scenarios jsonb not null default '[]'::jsonb,
  evidence_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, decision_id),
  check (status in ('DRAFT','EVALUATED','SELECTED','EXECUTING','CLOSED','CANCELLED'))
);

alter table public.brain_decisions enable row level security;
revoke all on public.brain_decisions from anon, authenticated;
grant select, insert, update on public.brain_decisions to service_role;
create index if not exists brain_decisions_tenant_correlation_idx on public.brain_decisions(tenant_id, correlation_id);

create or replace function public.brain_upsert_decision(
  p_tenant_id text,p_decision_id text,p_correlation_id text,p_subject_id text,p_owner_id text,
  p_status text,p_recommended_scenario_id text,p_selected_scenario_id text,p_selected_by text,p_rationale text,
  p_scenarios jsonb,p_evidence_ids text[]
) returns public.brain_decisions language plpgsql security definer set search_path=public as $$
declare r public.brain_decisions;
begin
  if coalesce(length(btrim(p_tenant_id)),0)=0 or coalesce(length(btrim(p_decision_id)),0)=0 then raise exception 'decision identity required'; end if;
  if p_status='SELECTED' and (coalesce(length(btrim(p_selected_scenario_id)),0)=0 or coalesce(length(btrim(p_rationale)),0)=0) then raise exception 'selected decision requires scenario and rationale'; end if;
  insert into public.brain_decisions(tenant_id,decision_id,correlation_id,subject_id,owner_id,status,recommended_scenario_id,selected_scenario_id,selected_by,rationale,scenarios,evidence_ids)
  values(p_tenant_id,p_decision_id,p_correlation_id,p_subject_id,p_owner_id,p_status,p_recommended_scenario_id,p_selected_scenario_id,p_selected_by,p_rationale,coalesce(p_scenarios,'[]'::jsonb),coalesce(p_evidence_ids,'{}'))
  on conflict(tenant_id,decision_id) do update set correlation_id=excluded.correlation_id,subject_id=excluded.subject_id,owner_id=excluded.owner_id,status=excluded.status,recommended_scenario_id=excluded.recommended_scenario_id,selected_scenario_id=excluded.selected_scenario_id,selected_by=excluded.selected_by,rationale=excluded.rationale,scenarios=excluded.scenarios,evidence_ids=excluded.evidence_ids,updated_at=now()
  returning * into r;
  return r;
end $$;
revoke all on function public.brain_upsert_decision(text,text,text,text,text,text,text,text,text,text,jsonb,text[]) from public,anon,authenticated;
grant execute on function public.brain_upsert_decision(text,text,text,text,text,text,text,text,text,text,jsonb,text[]) to service_role;

create table if not exists public.brain_runtime_metrics (
  id bigserial primary key,
  tenant_id text not null,
  surface text not null,
  route text not null,
  metric_name text not null,
  metric_value_ms numeric not null check(metric_value_ms>=0),
  cache_state text,
  revision text,
  session_id text,
  observed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
alter table public.brain_runtime_metrics enable row level security;
revoke all on public.brain_runtime_metrics from anon, authenticated;
grant select, insert on public.brain_runtime_metrics to service_role;
create index if not exists brain_runtime_metrics_route_time_idx on public.brain_runtime_metrics(tenant_id,surface,route,observed_at desc);

create or replace view public.brain_runtime_slo as
select tenant_id,surface,route,
 percentile_cont(.95) within group(order by metric_value_ms) filter(where metric_name='cached_ms') as p95_cached_ms,
 percentile_cont(.95) within group(order by metric_value_ms) filter(where metric_name='interactive_ms') as p95_interactive_ms,
 count(*) as samples,
 max(observed_at) as last_observed_at
from public.brain_runtime_metrics
group by tenant_id,surface,route;
revoke all on public.brain_runtime_slo from anon, authenticated;
grant select on public.brain_runtime_slo to service_role;
