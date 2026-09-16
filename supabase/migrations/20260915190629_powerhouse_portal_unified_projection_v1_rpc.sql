create or replace function public.powerhouse_portal_unified_state_v1(p_tenant_id text)
returns jsonb
language sql
stable
set search_path = 'public'
as $function$
with tenant as (
  select nullif(btrim(p_tenant_id),'') as tenant_id
), layers as (
  select coalesce(jsonb_object_agg(s.layer,s.payload),'{}'::jsonb) as payload
  from public.portal_state_layers s, tenant t
  where t.tenant_id is not null and s.tenant_id=t.tenant_id
), scans as (
  select coalesce(jsonb_agg(to_jsonb(x) order by x.aangemaakt desc),'[]'::jsonb) as payload
  from (
    select h.*
    from public.powerhouse_scan_history_v1 h, tenant t
    where (t.tenant_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' and h.organisatie_id::text=t.tenant_id)
       or (t.tenant_id='demo' and h.tenant_identity_status='demo' and h.klant_slug='demo')
    order by h.aangemaakt desc
    limit 25
  ) x
), resource as (
  select coalesce(to_jsonb(r),'{}'::jsonb) as payload
  from tenant t
  left join public.powerhouse_portal_resource_summary_v1 r on r.tenant_id=t.tenant_id
), forecasts as (
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) as payload
  from (
    select f.forecast_id,f.forecast_key,f.created_at,f.horizon_start,f.horizon_end,f.scope,f.scope_key,
           f.topic_key,f.predicted_event,f.probability,f.confidence,f.first_mover_score,f.strategic_fit,
           f.revenue_potential,f.status,f.expected_by,f.prediction_mode,f.last_scored_at
    from public.powerhouse_forecasts f, tenant t
    where f.scope_key=t.tenant_id or f.evidence->>'tenant_id'=t.tenant_id or f.evidence->>'company_key'=t.tenant_id
    order by f.created_at desc
    limit 25
  ) x
), opportunities as (
  select coalesce(jsonb_agg(to_jsonb(x) order by x.updated_at desc),'[]'::jsonb) as payload
  from (
    select o.opportunity_id,o.opportunity_key,o.company_key,o.topic_key,o.campaign_key,o.stage,
           o.expected_value_eur,o.probability,o.confidence,o.expected_revenue_value,o.last_evidence_at,
           o.last_action_at,o.next_action_at,o.status,o.updated_at
    from public.powerhouse_opportunities o, tenant t
    where o.company_key=t.tenant_id or o.evidence->>'tenant_id'=t.tenant_id
    order by o.updated_at desc
    limit 25
  ) x
), feedback as (
  select jsonb_build_object(
    'events',count(*),
    'edits',count(*) filter(where h.feedback_type='edit'),
    'skips',count(*) filter(where h.feedback_type='skip'),
    'overrides',count(*) filter(where h.feedback_type='override'),
    'alternative_actions',count(*) filter(where h.feedback_type='alternative_action'),
    'cancels',count(*) filter(where h.feedback_type='cancel'),
    'approvals',count(*) filter(where h.feedback_type='approve'),
    'latest_observed_at',max(h.observed_at)
  ) as payload
  from public.powerhouse_human_feedback_events h, tenant t
  where h.subject_key=t.tenant_id
     or h.opportunity_key in (select opportunity_key from public.powerhouse_opportunities where company_key=t.tenant_id)
), maturity as (
  select coalesce((select to_jsonb(m) from public.powerhouse_market_evidence_maturity_v1 m limit 1),'{}'::jsonb) as payload
)
select case when t.tenant_id is null then null else jsonb_build_object(
  'contract','powerhouse-portal-unified-state-v1',
  'generated_at',now(),
  'tenant_id',t.tenant_id,
  'authority',jsonb_build_object(
    'portal_state','portal_state_layers',
    'scans','powerhouse_scan_history_v1',
    'resource_impact','powerhouse_resource_impact_v1',
    'forecasts','powerhouse_forecasts',
    'commercial','powerhouse_opportunities',
    'human_feedback','powerhouse_human_feedback_events',
    'evidence_maturity','powerhouse_market_evidence_maturity_v1'
  ),
  'portal_layers',l.payload,
  'scan_history',s.payload,
  'resource_impact',r.payload,
  'forecasts',f.payload,
  'opportunities',o.payload,
  'human_feedback',h.payload,
  'market_evidence_maturity',m.payload
) end
from tenant t cross join layers l cross join scans s cross join resource r cross join forecasts f cross join opportunities o cross join feedback h cross join maturity m;
$function$;