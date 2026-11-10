-- P0: retain a real capability-specific LinkedIn organization-read denial until
-- the SAME capability and exact original post have independently verified recovery.
-- The original provider-health view remains the only projection. No new executor,
-- scheduler, store, outbound send or provider API side effect.
-- Root cause/evidence: existing ONE BRAIN #4198; provider readback 401/403 Nov 10.
--
-- Important: generic LinkedIn traffic, cron success and Windsor's independently
-- observed company metrics do not prove restoration of the denied LinkedIn API
-- organization-read entitlement. The latter are valid separate evidence lanes.
create or replace view public.powerhouse_provider_health_v1
with (security_invoker = true)
as
with recent as (
  select
    source,
    count(*) filter (where occurred_at >= now()-interval '24 hours') as events_24h,
    count(*) filter (where occurred_at >= now()-interval '24 hours' and state='error') as errors_24h,
    max(occurred_at) as last_event_at,
    max(occurred_at) filter (where state='error') as last_error_at
  from public.powerhouse_runtime_events
  where source is not null
  group by source
),
unresolved_capability_denials as (
  select
    denied.source,
    count(*) as unresolved_denials,
    max(denied.occurred_at) as latest_denial_at
  from public.powerhouse_runtime_events denied
  where denied.event_type='provider_capability_readback_denied'
    and denied.state='error'
    and not exists (
      select 1
      from public.powerhouse_runtime_events restored
      where restored.source=denied.source
        and restored.subject_key is not distinct from denied.subject_key
        and restored.channel is not distinct from denied.channel
        and restored.event_type='provider_capability_readback_restored'
        and restored.state='closed'
        and restored.occurred_at>denied.occurred_at
        -- Only exact independent provider proof can release this permission gate.
        and restored.evidence->>'independent_readback_verified'='true'
        and restored.evidence->>'provider_http_status'='200'
        and nullif(restored.evidence->>'provider_source_event_id','') is not null
        and restored.evidence->>'organization_urn'=denied.subject_key
        and restored.evidence->>'readback_target'=denied.evidence->>'readback_target'
    )
  group by denied.source
)
select
  r.source as provider_key,
  r.events_24h,
  r.errors_24h,
  r.last_event_at,
  r.last_error_at,
  sf.freshness_status,
  sf.health_checked_at,
  case
    when coalesce(d.unresolved_denials,0)>0 then 'degraded'
    when r.errors_24h>0 then 'degraded'
    when sf.freshness_status in ('stale','missing') then 'degraded'
    when r.last_event_at<now()-interval '48 hours' then 'unknown'
    else 'healthy'
  end as provider_state,
  jsonb_build_object(
    'runtime_events_24h',r.events_24h,
    'runtime_errors_24h',r.errors_24h,
    'freshness',sf.freshness_status,
    'unresolved_capability_readback_denials',coalesce(d.unresolved_denials,0),
    'latest_capability_denial_at',d.latest_denial_at,
    'capability_denial_release_rule',
      'EXACT_SAME_SOURCE_ORG_CHANNEL_POST_AND_INDEPENDENT_PROVIDER_READBACK'
  ) as evidence
from recent r
left join public.powerhouse_source_freshness_v1 sf
  on lower(sf.source_key)=lower(r.source)
left join unresolved_capability_denials d
  on d.source=r.source;

-- Preserve the existing least-privilege view semantics; no RLS bypass.
alter view public.powerhouse_provider_health_v1
set (security_invoker = true);
