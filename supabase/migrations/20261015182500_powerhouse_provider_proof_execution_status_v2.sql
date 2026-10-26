-- P0 #4198: count only independently verified publication outcomes.
-- The old social_posts table is not the source of truth for the Composio
-- publisher; provider proof resides in the canonical channel decisions.
-- A provider-issued post URN with a 403 readback is NOT verified delivery.
-- Existing function stays SQL STABLE/INVOKER and retains its public signature.
create or replace function public.powerhouse_execution_status(
  p_run_date date default current_date
) returns jsonb
language sql
stable
set search_path to 'public', 'pg_catalog'
as $function$
with decisions as (
  select
    channel,
    decision,
    state,
    delivery_ref,
    coalesce((
      decision = 'publish'
      and state in ('published','measured','learned')
      and nullif(btrim(delivery_ref), '') is not null
      and delivery_evidence->>'provider_truth_verified' = 'true'
      and delivery_evidence->>'provider_status' = 'published'
    ), false) as independently_proven
  from public.powerhouse_channel_decisions
  where run_date = p_run_date
), d as (
  select
    count(*)::int as decision_count,
    count(*) filter (where decision='publish')::int as publish_count,
    count(*) filter (where independently_proven)::int as delivered_publish_count,
    count(*) filter (where decision='publish' and not independently_proven)::int as unresolved_publish_count,
    count(*) filter (
      where independently_proven
        and channel in ('linkedin_company','linkedin_personal','instagram_company')
    )::int as published_social_count
  from decisions
)
select jsonb_build_object(
  'run_date',p_run_date,
  'decision_count',d.decision_count,
  'publish_count',d.publish_count,
  'delivered_publish_count',d.delivered_publish_count,
  'unresolved_publish_count',d.unresolved_publish_count,
  'published_social_count',d.published_social_count,
  'all_channels_decided',d.decision_count=7,
  'execution_complete',d.decision_count=7 and d.unresolved_publish_count=0
)
from d;
$function$;
