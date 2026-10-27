-- Powerhouse relationship external intelligence v1
-- Projects external/public updates onto canonical person -> company -> customer -> opportunity/NBA intelligence.

create or replace function public.powerhouse_refresh_relationship_external_intelligence_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_company_signals integer:=0;
  v_person_signals integer:=0;
begin
  insert into public.powerhouse_predictive_signals(
    signal_key,observed_at,source_type,source_ref,entity_scope,entity_key,topic_key,
    signal_type,direction,strength,novelty,lead_time_days,evidence
  )
  select
    'relationship-external-company:'||md5(coalesce(e.dedupe_key,e.event_id::text)),
    e.occurred_at,
    'external_relationship_evidence',
    coalesce(e.evidence->>'source_url',e.source),
    'company',
    lower(regexp_replace(trim(e.company_key),'\s+',' ','g')),
    coalesce(nullif(e.topic_key,''),nullif(e.evidence->>'trigger_type',''),'external_update'),
    'relationship_external_intelligence',
    'emerging',
    least(1::numeric,greatest(0::numeric,coalesce(e.confidence,.60))),
    case when e.occurred_at>=now()-interval '14 days' then .90 else .55 end,
    30,
    jsonb_build_object(
      'contract','powerhouse-relationship-external-intelligence-v1',
      'event_id',e.event_id,'person_key',e.person_key,'company_key',e.company_key,
      'channel',e.channel,'source',e.source,'event_type',e.event_type,
      'customer_linkage','resolved_by_normalized_company_name',
      'source_evidence',coalesce(e.evidence,'{}'::jsonb)
    )
  from public.powerhouse_runtime_events e
  where e.company_key is not null
    and nullif(trim(e.company_key),'') is not null
    and e.occurred_at>=now()-interval '90 days'
    and e.event_type in (
      'relationship_public_research_evidence',
      'linkedin_post_observed','linkedin_company_update','linkedin_engagement_observed',
      'external_signal_observed','company_news_observed'
    )
  on conflict(signal_key) do update set
    observed_at=excluded.observed_at,source_ref=excluded.source_ref,topic_key=excluded.topic_key,
    strength=excluded.strength,novelty=excluded.novelty,evidence=excluded.evidence;
  get diagnostics v_company_signals=row_count;

  insert into public.powerhouse_predictive_signals(
    signal_key,observed_at,source_type,source_ref,entity_scope,entity_key,topic_key,
    signal_type,direction,strength,novelty,lead_time_days,evidence
  )
  select
    'relationship-external-person:'||md5(coalesce(e.dedupe_key,e.event_id::text)),
    e.occurred_at,
    'external_relationship_evidence',
    coalesce(e.evidence->>'source_url',e.source),
    'person',
    e.person_key,
    coalesce(nullif(e.topic_key,''),nullif(e.evidence->>'trigger_type',''),'external_update'),
    'relationship_external_intelligence',
    'emerging',
    least(1::numeric,greatest(0::numeric,coalesce(e.confidence,.60))),
    case when e.occurred_at>=now()-interval '14 days' then .90 else .55 end,
    30,
    jsonb_build_object(
      'contract','powerhouse-relationship-external-intelligence-v1',
      'event_id',e.event_id,'person_key',e.person_key,'company_key',e.company_key,
      'channel',e.channel,'source',e.source,'event_type',e.event_type,
      'source_evidence',coalesce(e.evidence,'{}'::jsonb)
    )
  from public.powerhouse_runtime_events e
  where e.person_key is not null
    and nullif(trim(e.person_key),'') is not null
    and e.occurred_at>=now()-interval '90 days'
    and e.event_type in (
      'relationship_public_research_evidence',
      'linkedin_post_observed','linkedin_company_update','linkedin_engagement_observed',
      'external_signal_observed','company_news_observed'
    )
  on conflict(signal_key) do update set
    observed_at=excluded.observed_at,source_ref=excluded.source_ref,topic_key=excluded.topic_key,
    strength=excluded.strength,novelty=excluded.novelty,evidence=excluded.evidence;
  get diagnostics v_person_signals=row_count;

  return jsonb_build_object(
    'contract','powerhouse-relationship-external-intelligence-v1',
    'run_date',p_run_date,
    'company_signals_touched',v_company_signals,
    'person_signals_touched',v_person_signals,
    'canonical_path','person->company->customer->opportunity/NBA',
    'sensitive_inference_allowed',false,
    'executed_at',now()
  );
end;
$$;

revoke execute on function public.powerhouse_refresh_relationship_external_intelligence_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_relationship_external_intelligence_v1(date) to service_role;

create or replace view public.powerhouse_relationship_context_enriched_v1
with (security_invoker=true) as
select
  p.person_key,p.person_name,p.linkedin_url,p.role,p.relationship_status,p.company_name,
  p.company_key_normalized as company_key,
  (k.id is not null) as is_customer,k.id as customer_id,k.organisatie_id,
  p.relationship_warmth,p.decision_influence,p.available_channels,p.last_relevant_at as person_last_relevant_at,
  c.company_intent_score,c.external_signal_score,c.predictive_signals_30d,c.signal_topics,
  c.open_opportunities,c.weighted_pipeline_eur,c.realized_revenue_eur,c.last_relevant_at as company_last_relevant_at,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'observed_at',s.observed_at,'source_type',s.source_type,'source_ref',s.source_ref,
      'topic_key',s.topic_key,'signal_type',s.signal_type,'strength',s.strength,
      'evidence',s.evidence
    ) order by s.observed_at desc)
    from (
      select *
      from public.powerhouse_predictive_signals ps
      where ps.entity_scope='company'
        and lower(regexp_replace(trim(ps.entity_key),'\s+',' ','g'))=p.company_key_normalized
        and ps.signal_type='relationship_external_intelligence'
        and ps.observed_at>=now()-interval '90 days'
      order by ps.observed_at desc
      limit 10
    ) s
  ),'[]'::jsonb) as recent_external_updates,
  jsonb_build_object(
    'contract','powerhouse-relationship-external-intelligence-v1',
    'path','person->company->customer->opportunity/NBA',
    'customer',k.id is not null,
    'external_signals_are_evidence_not_truth',true,
    'sensitive_inference_allowed',false
  ) as intelligence_context
from public.powerhouse_person_intelligence_v1 p
left join public.powerhouse_company_intelligence_v1 c
  on c.company_key=p.company_key_normalized
left join public.klanten k
  on lower(regexp_replace(trim(k.naam),'\s+',' ','g'))=p.company_key_normalized;

revoke all on public.powerhouse_relationship_context_enriched_v1 from public,anon,authenticated;
grant select on public.powerhouse_relationship_context_enriched_v1 to service_role;

comment on view public.powerhouse_relationship_context_enriched_v1 is
'Canonical relationship context enriched with verified public/LinkedIn/external updates and customer/opportunity lineage. External signals are evidence features, not facts about intent on their own.';

-- Insert external-intelligence projection before relationship scoring in the existing commercial cycle.
create or replace function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_external_intelligence jsonb;
  v_relationship jsonb;
  v_existing_research jsonb;
  v_public_research_dispatch jsonb;
  v_trigger jsonb;
  v_growth_swarm jsonb;
  v_growth_activation jsonb;
  v_all_plays jsonb;
  v_linkedin_sales_dispatch jsonb;
  v_outreach_prepare jsonb;
  v_growth_email_promotion jsonb;
  v_persuasion jsonb;
  v_outreach_dispatch jsonb;
  v_learning jsonb;
begin
  v_external_intelligence:=public.powerhouse_refresh_relationship_external_intelligence_v1(p_run_date);
  v_relationship:=public.powerhouse_refresh_relationship_revenue_v1(p_run_date);
  v_existing_research:=public.powerhouse_execute_relationship_research_v1(p_run_date);
  v_public_research_dispatch:=public.powerhouse_dispatch_relationship_public_research_v1(p_run_date);
  v_trigger:=public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(p_run_date);
  v_growth_swarm:=public.powerhouse_refresh_growth_swarm_v1(p_run_date);
  v_growth_activation:=public.powerhouse_materialize_growth_swarm_v1(p_run_date);
  v_all_plays:=public.powerhouse_activate_remaining_growth_plays_v3(p_run_date);
  v_linkedin_sales_dispatch:=public.powerhouse_dispatch_linkedin_sales_machine_v1(p_run_date);
  v_outreach_prepare:=public.powerhouse_prepare_autonomous_outreach_v1(p_run_date);
  v_growth_email_promotion:=public.powerhouse_promote_growth_play_emails_v1(p_run_date);
  v_persuasion:=public.powerhouse_optimize_prepared_outreach_v1(p_run_date);
  v_outreach_dispatch:=public.powerhouse_dispatch_autonomous_outreach_v1(p_run_date);
  v_learning:=public.powerhouse_commercial_learning_cycle_v1(p_run_date);
  return jsonb_build_object(
    'contract','powerhouse-trigger-based-mkb-acquisition-cycle-v1',
    'relationship_external_intelligence',v_external_intelligence,
    'relationship_revenue',v_relationship,'existing_evidence_research',v_existing_research,
    'public_research_dispatch',v_public_research_dispatch,'trigger_acquisition',v_trigger,
    'growth_swarm',v_growth_swarm,'growth_swarm_activation',v_growth_activation,
    'all_growth_plays',v_all_plays,'linkedin_sales_dispatch',v_linkedin_sales_dispatch,
    'autonomous_outreach_prepare',v_outreach_prepare,'growth_play_email_promotion',v_growth_email_promotion,
    'persuasion_optimizer',v_persuasion,'autonomous_outreach_dispatch',v_outreach_dispatch,
    'commercial_learning',v_learning,'run_date',p_run_date,'executed_at',now()
  );
end;
$$;
