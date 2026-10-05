-- Powerhouse outcome-readback health semantics v1
-- Executed actions awaiting observed outcomes are readback obligations, not research gaps.

create or replace view public.powerhouse_revenue_intelligence_health_v1
with (security_invoker = true)
as
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
        and (nullif(trim(a.opportunity_key),'') is not null or nullif(trim(a.company_key),'') is not null)
    )::integer as identity_gaps,
    count(*) filter (
      where a.opportunity_key is not null
        and a.action_type not in ('internal_research','research','research_enrichment')
        and not exists (
          select 1 from public.powerhouse_forecasts f
          where f.predicted_event='commercial_progression'
            and f.status in ('active','claimed','calibrated')
            and ((f.evidence->>'opportunity_key')=a.opportunity_key
              or (a.person_key is not null and f.scope='person' and lower(f.scope_key)=lower(a.person_key)))
        )
    )::integer as forecast_lineage_gaps
  from active_actions a
), ranked_runtime as (
  select e.event_type,e.source,e.subject_key,e.state,e.updated_at,
         row_number() over(partition by e.event_type,e.source,e.subject_key order by e.updated_at desc,e.occurred_at desc,e.event_id desc) rn
  from public.powerhouse_runtime_events e
  where e.updated_at>=now()-interval '24 hours'
), errors as (
  select count(*)::integer runtime_errors
  from ranked_runtime where rn=1 and state='error'
), research as (
  select count(*)::integer research_queue_count
  from public.powerhouse_opportunities o
  where coalesce(o.status,'open')='open'
    and (
      nullif(trim(o.person_key),'') is null
      or nullif(trim(o.company_key),'') is null
      or coalesce(o.confidence,0)<0.55
      or coalesce(o.last_evidence_at,'1970-01-01'::timestamptz)<now()-interval '30 days'
      or not exists (
        select 1 from public.powerhouse_forecasts f
        where f.predicted_event='commercial_progression'
          and f.status in ('active','claimed','calibrated')
          and ((f.evidence->>'opportunity_key')=o.opportunity_key
            or (o.person_key is not null and f.scope='person' and lower(f.scope_key)=lower(o.person_key)))
      )
    )
    and not exists (
      select 1
      from public.powerhouse_sales_actions a
      where a.opportunity_key=o.opportunity_key
        and a.executed_at is not null
        and not exists (
          select 1 from public.powerhouse_sales_outcomes so
          where so.action_id=a.action_id
        )
    )
), models as (
  select count(*)::integer model_health_segments,
         count(*) filter(where model_health='watch')::integer model_watch_segments,
         count(*) filter(where model_health='insufficient_evidence')::integer model_sparse_segments
  from public.powerhouse_model_health_v1
)
select
  g.identity_gaps+g.forecast_lineage_gaps+e.runtime_errors as structural_lineage_gaps,
  g.identity_gaps,
  g.forecast_lineage_gaps,
  e.runtime_errors,
  r.research_queue_count,
  m.model_health_segments,
  m.model_watch_segments,
  m.model_sparse_segments,
  case when (g.identity_gaps+g.forecast_lineage_gaps+e.runtime_errors)>0 then 'degraded' else 'completed' end as intelligence_state,
  now() as measured_at
from gaps g cross join errors e cross join research r cross join models m;

alter view public.powerhouse_revenue_intelligence_health_v1 set (security_invoker = true);
revoke all on public.powerhouse_revenue_intelligence_health_v1 from anon, authenticated;
grant select on public.powerhouse_revenue_intelligence_health_v1 to service_role;

insert into public.powerhouse_sales_learnings(
  fingerprint,subject_key,scope,hypothesis,evidence,effect,confidence,status,content_key,topic_key,channel,sample_size,expires_at
) values (
  'outcome-readback-health-semantics-v1','growth-revenue-os','revenue_intelligence',
  'An executed sales action with provider readback and no observed outcome is an outcome-readback obligation, not missing research or forecast evidence.',
  jsonb_build_object(
    'observed_at',now(),
    'misclassified_opportunities',2,
    'examples',jsonb_build_array('Sam van Dillen','Freek Meulenbeld'),
    'truth_boundary','no response or no-response outcome is inferred; state remains pending until observed'
  ),
  jsonb_build_object(
    'prevention_rule','Exclude opportunities with an executed action and no observed sales outcome from research_queue_count; keep them in canonical outcome-readback obligations instead.',
    'canonical_outcome_store','powerhouse_sales_outcomes',
    'canonical_action_store','powerhouse_sales_actions'
  ),
  1.0,'proven',null,null,null,2,now()+interval '90 days'
)
on conflict(fingerprint) do update set
  evidence=excluded.evidence,effect=excluded.effect,confidence=excluded.confidence,status='proven',sample_size=greatest(public.powerhouse_sales_learnings.sample_size,excluded.sample_size),expires_at=excluded.expires_at,updated_at=now();

insert into public.powerhouse_runtime_events(
  dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence,updated_at
) values (
  'outcome-readback-health-semantics-v1:activation','revenue_intelligence_health_semantics_activated','powerhouse-revenue-intelligence-health-v1','growth-revenue-os',now(),
  jsonb_build_object('misclassified_research_items_before_fix',2,'target_state','outcome_readback_pending'),
  jsonb_build_object('existing_state_first',true,'reuse_first',true,'truth_boundary','pending remains pending until observed'),
  'actioned','verified',1,now()
)
on conflict(dedupe_key) do update set evidence=excluded.evidence,context=excluded.context,state=excluded.state,data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=now();
