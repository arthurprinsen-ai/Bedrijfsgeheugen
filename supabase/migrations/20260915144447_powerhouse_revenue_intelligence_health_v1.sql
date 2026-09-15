create or replace view public.powerhouse_revenue_intelligence_health_v1 as
with active_actions as (
  select a.action_id,a.person_key,a.opportunity_key,a.action_type,a.status
  from public.powerhouse_sales_actions a
  where a.status in ('suggested','prepared','pending')
    and a.created_at >= now()-interval '30 days'
), gaps as (
  select
    count(*) filter (where nullif(trim(person_key),'') is null and action_type not in ('internal_research','research'))::int as identity_gaps,
    count(*) filter (
      where opportunity_key is not null
        and action_type not in ('internal_research','research')
        and not exists (
          select 1 from public.powerhouse_forecasts f
          where f.scope_key=active_actions.opportunity_key
            and f.predicted_event='commercial_progression'
        )
    )::int as forecast_lineage_gaps
  from active_actions
), errors as (
  select count(*)::int as runtime_errors
  from public.powerhouse_runtime_events
  where state='error' and updated_at>=now()-interval '24 hours'
), research as (
  select count(*)::int as research_queue_count from public.powerhouse_research_queue_v1
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
