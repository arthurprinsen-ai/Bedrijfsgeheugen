-- Runtime health truth v1
-- Prevent historical/non-current evidence from masquerading as current structural failure.

do $$
declare
  v_def text;
  v_old constant text := 'where a.aangeroepen_op>now()-interval ''26 hours'' order by a.functie,a.aangeroepen_op desc';
  v_new constant text := 'where a.aangeroepen_op>now()-interval ''30 minutes'' order by a.functie,a.aangeroepen_op desc';
begin
  if to_regprocedure('public.bg_gezondheid_meten()') is null then
    -- Fresh previews may not carry the production health routine yet.
    null;
  else
    select pg_get_functiondef(to_regprocedure('public.bg_gezondheid_meten()')) into v_def;
    if position(v_new in v_def) > 0 then
      null;
    elsif position(v_old in v_def) > 0 then
      execute replace(v_def,v_old,v_new);
    else
      -- Unknown/newer baseline: never rewrite an unrecognized function body.
      -- The migration is a targeted historical correction, not a schema oracle.
      null;
    end if;
  end if;
end $;

create or replace view public.powerhouse_revenue_intelligence_health_v1 as
with active_actions as (
  select a.action_id,a.person_key,a.company_key,a.opportunity_key,a.action_type,a.status,a.created_at
  from public.powerhouse_sales_actions a
  where a.status in ('suggested','prepared','pending')
    and a.created_at >= now()-interval '30 days'
), gaps as (
  select
    count(*) filter (
      where nullif(trim(a.person_key),'') is null
        and a.action_type not in ('internal_research','research','research_enrichment')
        and (
          nullif(trim(a.opportunity_key),'') is not null
          or nullif(trim(a.company_key),'') is not null
        )
    )::int as identity_gaps,
    count(*) filter (
      where a.opportunity_key is not null
        and a.action_type not in ('internal_research','research','research_enrichment')
        and not exists (
          select 1
          from public.powerhouse_forecasts f
          where f.predicted_event='commercial_progression'
            and f.status in ('active','claimed','calibrated')
            and (
              f.evidence->>'opportunity_key'=a.opportunity_key
              or (a.person_key is not null and f.scope='person' and lower(f.scope_key)=lower(a.person_key))
            )
        )
    )::int as forecast_lineage_gaps
  from active_actions a
), ranked_runtime as (
  select e.event_type,e.source,e.subject_key,e.state,e.updated_at,
         row_number() over (
           partition by e.event_type,e.source,e.subject_key
           order by e.updated_at desc,e.occurred_at desc,e.event_id desc
         ) as rn
  from public.powerhouse_runtime_events e
  where e.updated_at>=now()-interval '24 hours'
    and not (
      e.event_type='full_cycle_production_proof'
      and e.subject_key <> (now() at time zone 'Europe/Amsterdam')::date::text
    )
    and not (
      e.event_type='source_health_evaluated'
      and e.subject_key='forecast-calibration'
      and not exists (
        select 1
        from public.revenue_learning_obligations o
        where o.type='FORECAST_CALIBRATION'
          and o.status='OPEN'
          and o.due_at<=now()
      )
    )
), errors as (
  select count(*)::int as runtime_errors
  from ranked_runtime
  where rn=1 and state='error'
), research as (
  select count(*)::int as research_queue_count
  from public.powerhouse_opportunities o
  where coalesce(o.status,'open')='open'
    and (
      nullif(trim(o.person_key),'') is null
      or nullif(trim(o.company_key),'') is null
      or coalesce(o.confidence,0)<.55
      or coalesce(o.last_evidence_at,'1970-01-01'::timestamptz)<now()-interval '30 days'
      or not exists (
        select 1
        from public.powerhouse_forecasts f
        where f.predicted_event='commercial_progression'
          and f.status in ('active','claimed','calibrated')
          and (
            f.evidence->>'opportunity_key'=o.opportunity_key
            or (o.person_key is not null and f.scope='person' and lower(f.scope_key)=lower(o.person_key))
          )
      )
    )
    and not exists (
      select 1
      from public.powerhouse_sales_actions a
      where a.opportunity_key=o.opportunity_key
        and a.executed_at is not null
        and not exists (
          select 1 from public.powerhouse_sales_outcomes so where so.action_id=a.action_id
        )
    )
), models as (
  select count(*)::int as model_health_segments,
         count(*) filter (where model_health='watch')::int as model_watch_segments,
         count(*) filter (where model_health='insufficient_evidence')::int as model_sparse_segments
  from public.powerhouse_model_health_v1
)
select
  (g.identity_gaps+g.forecast_lineage_gaps+e.runtime_errors)::int as structural_lineage_gaps,
  g.identity_gaps,g.forecast_lineage_gaps,e.runtime_errors,
  r.research_queue_count,m.model_health_segments,m.model_watch_segments,m.model_sparse_segments,
  case when (g.identity_gaps+g.forecast_lineage_gaps+e.runtime_errors)>0 then 'degraded' else 'completed' end as intelligence_state,
  now() as measured_at
from gaps g cross join errors e cross join research r cross join models m;

alter view public.powerhouse_revenue_intelligence_health_v1 set (security_invoker=true);
revoke all on public.powerhouse_revenue_intelligence_health_v1 from anon, authenticated;
grant select on public.powerhouse_revenue_intelligence_health_v1 to service_role;

comment on view public.powerhouse_revenue_intelligence_health_v1 is
'Current revenue intelligence health. Historical daily proof failures and not-yet-due forecast calibration are excluded from current structural failure counts; evidence remains preserved in source history.';
