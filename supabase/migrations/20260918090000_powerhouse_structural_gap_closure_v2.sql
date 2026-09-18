-- Powerhouse structural gap closure v2
-- Deterministic, idempotent wiring only. No synthetic human feedback, realized value or customer connectors.

create or replace view public.powerhouse_tenant_identity_review_v1
with (security_invoker=true) as
select
  'scan_inzendingen'::text as surface,
  s.id as source_id,
  s.klant_slug,
  s.tenant_identity_status,
  case
    when nullif(btrim(s.klant_slug),'') is null then 'missing_slug'
    when (
      select count(*) from public.organisaties o
      where lower(btrim(o.slug)) = lower(btrim(s.klant_slug))
    ) = 0 then 'no_organisatie_slug_match'
    else 'ambiguous_organisatie_slug_match'
  end as review_reason,
  (
    select count(*)::integer from public.organisaties o
    where nullif(btrim(s.klant_slug),'') is not null
      and lower(btrim(o.slug)) = lower(btrim(s.klant_slug))
  ) as candidate_count,
  s.aangemaakt as observed_at
from public.scan_inzendingen s
where s.organisatie_id is null

union all

select
  'offerte_inzendingen'::text as surface,
  oin.id as source_id,
  oin.klant_slug,
  oin.tenant_identity_status,
  case
    when nullif(btrim(oin.klant_slug),'') is null then 'missing_slug'
    when (
      select count(*) from public.organisaties o
      where lower(btrim(o.slug)) = lower(btrim(oin.klant_slug))
    ) = 0 then 'no_organisatie_slug_match'
    else 'ambiguous_organisatie_slug_match'
  end as review_reason,
  (
    select count(*)::integer from public.organisaties o
    where nullif(btrim(oin.klant_slug),'') is not null
      and lower(btrim(o.slug)) = lower(btrim(oin.klant_slug))
  ) as candidate_count,
  oin.aangemaakt as observed_at
from public.offerte_inzendingen oin
where oin.organisatie_id is null;

revoke all on public.powerhouse_tenant_identity_review_v1 from anon, authenticated;
grant select on public.powerhouse_tenant_identity_review_v1 to service_role;

create or replace function public.powerhouse_open_cycle_from_runtime_signal_v1(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  e public.powerhouse_runtime_events%rowtype;
  v_tenant constant text := 'canonical';
  v_subject text;
  v_evidence_ref text;
begin
  select * into e
  from public.powerhouse_runtime_events
  where event_id=p_event_id;

  if not found then return; end if;

  if e.event_type <> 'scan_submitted'
     or e.source <> 'website.frisse_blik'
     or lower(coalesce(e.source,'')) like '%test%' then
    return;
  end if;

  v_subject := coalesce(
    nullif(e.subject_key,''),
    nullif(e.company_key,''),
    nullif(e.person_key,''),
    e.event_id::text
  );
  v_evidence_ref := 'powerhouse_runtime_events:' || e.event_id::text;

  insert into public.powerhouse_decision_cycles(
    tenant_id,cycle_id,subject_key,source_signal_ref,current_stage,status,opened_at,updated_at
  )
  values(
    v_tenant,e.event_id,v_subject,v_evidence_ref,'signal','open',e.occurred_at,now()
  )
  on conflict (tenant_id,cycle_id) do update set
    subject_key=coalesce(public.powerhouse_decision_cycles.subject_key,excluded.subject_key),
    source_signal_ref=excluded.source_signal_ref,
    updated_at=now();

  insert into public.powerhouse_cycle_events(
    tenant_id,cycle_id,sequence_no,stage,entity_type,entity_id,
    evidence_ref,idempotency_key,payload,occurred_at
  )
  values(
    v_tenant,e.event_id,1,'signal','powerhouse_runtime_events',e.event_id::text,
    v_evidence_ref,'runtime-signal:' || e.event_id::text,
    jsonb_build_object(
      'event_type',e.event_type,
      'source',e.source,
      'data_quality',e.data_quality,
      'confidence',e.confidence,
      'truth','observed_runtime_signal'
    ),
    e.occurred_at
  )
  on conflict (tenant_id,idempotency_key) do nothing;
end
$$;

revoke execute on function public.powerhouse_open_cycle_from_runtime_signal_v1(uuid) from public, anon, authenticated;
grant execute on function public.powerhouse_open_cycle_from_runtime_signal_v1(uuid) to service_role;

create or replace function public.powerhouse_runtime_signal_cycle_trigger_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  perform public.powerhouse_open_cycle_from_runtime_signal_v1(new.event_id);
  return new;
end
$$;

revoke execute on function public.powerhouse_runtime_signal_cycle_trigger_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_runtime_signal_cycle_trigger_v1() to service_role;

drop trigger if exists powerhouse_runtime_signal_cycle_materializer_v1 on public.powerhouse_runtime_events;
create trigger powerhouse_runtime_signal_cycle_materializer_v1
after insert on public.powerhouse_runtime_events
for each row
when (new.event_type = 'scan_submitted' and new.source = 'website.frisse_blik')
execute function public.powerhouse_runtime_signal_cycle_trigger_v1();

select public.powerhouse_open_cycle_from_runtime_signal_v1(event_id)
from public.powerhouse_runtime_events
where event_type='scan_submitted'
  and source='website.frisse_blik'
order by occurred_at,event_id;

create or replace view public.powerhouse_completion_readiness_v1
with (security_invoker=true) as
with source_state as (
  select s.source_key,s.source_class,s.required,s.max_age,
         max(o.observed_at) last_observed_at,
         case
           when max(o.observed_at) is null then 'MISSING'
           when now()-max(o.observed_at) > s.max_age then 'STALE'
           else 'FRESH'
         end freshness
  from public.powerhouse_evidence_sources s
  left join public.powerhouse_evidence_source_observations o using(source_key)
  group by s.source_key,s.source_class,s.required,s.max_age
),
forecast as (
  select
    count(*) filter(where status in ('active','claimed')) active_forecasts,
    count(*) filter(where status in ('materialized','expired')) terminal_forecasts,
    (select count(*) from public.powerhouse_forecast_calibration) calibrations,
    (select count(*) from public.revenue_learning_obligations where type='FORECAST_CALIBRATION' and status='OPEN') open_calibration_obligations
  from public.powerhouse_forecasts
),
learning as (
  select
    (select count(*) from public.powerhouse_human_feedback_events) human_feedback_events,
    (select count(*) from public.powerhouse_realized_values) realized_values,
    (select count(*) from public.powerhouse_action_economics) action_economics,
    (select count(*) from public.powerhouse_decision_cycles) decision_cycles,
    (select count(*) from public.powerhouse_cycle_events) cycle_events,
    (select count(*) from public.powerhouse_predictive_signals) predictive_signals,
    (select count(*) from public.powerhouse_sales_actions where status='done' and executed_at is not null) executed_done_actions,
    (
      select count(*)
      from public.powerhouse_sales_actions a
      where a.status='done' and a.executed_at is not null
        and not exists(select 1 from public.powerhouse_action_economics e where e.action_id=a.action_id)
    ) executed_actions_missing_observed_economics,
    (
      select count(*)
      from public.powerhouse_sales_actions a
      where a.executed_at is not null
        and not exists(select 1 from public.powerhouse_human_feedback_events f where f.action_id=a.action_id)
    ) executed_actions_without_explicit_human_feedback
),
customer_connectors as (
  select
    (select count(*) from public.connector_definitions) definitions,
    (select count(*) from public.connector_executions) executions,
    (select count(*) from public.connector_reviews where status='pending') pending_reviews
),
platform_sources as (
  select
    count(*) total_sources,
    count(*) filter(where required) required_sources,
    count(*) filter(where freshness='FRESH') fresh_sources,
    count(*) filter(where required and freshness<>'FRESH') unhealthy_required_sources
  from source_state
),
tenant_review as (
  select
    count(*) unresolved_records,
    count(*) filter(where candidate_count=0) no_match_records,
    count(*) filter(where candidate_count>1) ambiguous_records
  from public.powerhouse_tenant_identity_review_v1
)
select jsonb_build_object(
  'contract','powerhouse-completion-layer-v2',
  'observed_at',now(),
  'evidence_sources',coalesce((select jsonb_agg(to_jsonb(source_state) order by required desc,source_key) from source_state),'[]'::jsonb),
  'required_sources_unhealthy',(select count(*) from source_state where required and freshness<>'FRESH'),
  'tenant_identity',coalesce((select jsonb_agg(to_jsonb(t) order by surface) from public.powerhouse_tenant_identity_readiness_v1 t),'[]'::jsonb),
  'tenant_identity_review',to_jsonb(tenant_review),
  'forecast',to_jsonb(forecast),
  'learning',to_jsonb(learning),
  'connectors',to_jsonb(customer_connectors),
  'customer_connectors',to_jsonb(customer_connectors),
  'platform_sources',to_jsonb(platform_sources)
) as snapshot
from forecast,learning,customer_connectors,platform_sources,tenant_review;

revoke all on public.powerhouse_completion_readiness_v1 from anon, authenticated;
grant select on public.powerhouse_completion_readiness_v1 to service_role;

comment on view public.powerhouse_tenant_identity_review_v1 is
'Live unresolved-identity review surface. Does not create a parallel queue; derives only from scan/offerte authority.';
comment on function public.powerhouse_open_cycle_from_runtime_signal_v1(uuid) is
'Idempotently opens a canonical decision cycle only from an observed website.frisse_blik scan_submitted runtime signal. Does not infer downstream analysis, prediction, decision, feedback, economics, outcomes or realized value.';
