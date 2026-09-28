-- Powerhouse relationship-to-revenue engine v1
-- Canonical self-first revenue intelligence over the existing relationship graph.
-- No parallel CRM, no vendor dependency, no duplicate scheduler.

create or replace view public.powerhouse_relationship_revenue_intelligence_v1
with (security_invoker=true) as
with open_opp as (
  select person_key,company_key,
    count(*) filter(where coalesce(status,'') not in ('closed','won','lost'))::int open_opportunities,
    max(coalesce(expected_value_eur,0)) max_expected_value_eur,
    max(coalesce(expected_revenue_value,0)) max_expected_revenue_value,
    max(last_evidence_at) last_opportunity_evidence_at
  from public.powerhouse_opportunities
  group by person_key,company_key
), base as (
  select p.person_key,p.person_name,p.company_name,p.company_key_normalized company_key,p.role,p.linkedin_url,p.email,
    p.available_channels,p.relationship_status,p.prioriteit,p.aanleiding,p.relationship_warmth,p.decision_influence,
    p.events_30d,p.actions_30d,p.actions_90d,p.positive_outcomes,p.meetings,p.proposals,p.won_outcomes,p.realized_revenue_eur,
    p.last_relevant_at,coalesce(c.company_intent_score,0) company_intent_score,
    coalesce(c.predictive_signals_30d,0) predictive_signals_30d,coalesce(c.external_signal_score,0) external_signal_score,
    c.signal_topics,coalesce(o.open_opportunities,0) open_opportunities,coalesce(o.max_expected_value_eur,0) max_expected_value_eur,
    coalesce(o.max_expected_revenue_value,0) max_expected_revenue_value,o.last_opportunity_evidence_at,
    case when p.last_relevant_at>=now()-interval '90 days' then 1 else 0 end recent_relationship_evidence,
    case when cardinality(coalesce(p.available_channels,array[]::text[]))>0 then 1 else 0 end channel_ready
  from public.powerhouse_person_intelligence_v1 p
  left join public.powerhouse_company_intelligence_v1 c on c.company_key=p.company_key_normalized
  left join open_opp o on o.person_key=p.person_key or (o.person_key is null and o.company_key=p.company_key_normalized)
), scored as (
  select b.*,
    least(1::numeric,greatest(0::numeric,
      .35*coalesce(b.relationship_warmth,0)+.25*coalesce(b.decision_influence,0)+.15*coalesce(b.company_intent_score,0)
      +.10*coalesce(b.external_signal_score,0)+.08*b.recent_relationship_evidence+.07*b.channel_ready
    )) relationship_revenue_score_raw,
    least(1::numeric,greatest(0::numeric,
      .30*(case when b.linkedin_url is not null then 1 else 0 end)
      +.15*(case when b.email is not null then 1 else 0 end)
      +.20*(case when nullif(b.company_key,'') is not null then 1 else 0 end)
      +.15*(case when nullif(b.role,'') is not null then 1 else 0 end)
      +.10*(case when b.last_relevant_at is not null then 1 else 0 end)
      +.10*(case when b.predictive_signals_30d>0 or b.events_30d>0 then 1 else 0 end)
    )) first_party_evidence_score_raw
  from base b
)
select s.*,
  round(s.relationship_revenue_score_raw,4) relationship_revenue_score,
  round(s.first_party_evidence_score_raw,4) first_party_evidence_score,
  case
    when s.actions_30d>=3 then 'fatigue_hold'
    when nullif(s.company_key,'') is null then 'company_identity_research'
    when coalesce(s.decision_influence,0)<.60 then 'decision_role_research'
    when s.last_relevant_at is null or s.last_relevant_at<now()-interval '120 days' then 'freshness_research'
    when s.predictive_signals_30d=0 and s.events_30d=0 and s.open_opportunities=0 then 'public_web_signal_research'
    else 'powerhouse_self_sufficient'
  end research_need,
  case when s.first_party_evidence_score_raw>=.75 and (s.predictive_signals_30d>0 or s.events_30d>0 or s.open_opportunities>0)
    then 'POWERHOUSE_FIRST_PARTY' else 'POWERHOUSE_PLUS_PUBLIC_WEB' end enrichment_mode,
  false apollo_required,
  true vendor_enrichment_optional,
  (s.max_expected_value_eur>0 and s.open_opportunities>0 and s.relationship_revenue_score_raw>=.55) activation_review_ready,
  jsonb_build_object(
    'contract','powerhouse-relationship-revenue-engine-v1',
    'source_priority',jsonb_build_array('powerhouse_first_party','public_web','optional_vendor_fallback'),
    'vendor_policy','Apollo/Lusha/ZoomInfo/other vendors are optional fallback only; never canonical truth or required dependency.',
    'truth_boundary','relationship strength is not a buying trigger; external outreach remains human-authorized unless a separately approved consent-based workflow applies',
    'score_components',jsonb_build_object(
      'relationship_warmth',s.relationship_warmth,'decision_influence',s.decision_influence,
      'company_intent_score',s.company_intent_score,'external_signal_score',s.external_signal_score,
      'recent_relationship_evidence',s.recent_relationship_evidence,'channel_ready',s.channel_ready
    )
  ) revenue_intelligence
from scored s;

revoke all on public.powerhouse_relationship_revenue_intelligence_v1 from public,anon,authenticated;
grant select on public.powerhouse_relationship_revenue_intelligence_v1 to service_role;

create or replace function public.powerhouse_refresh_relationship_revenue_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz:=now();
  v_research integer:=0;
  v_activation integer:=0;
  v_result jsonb;
begin
  with ranked as (
    select r.*,row_number() over(order by r.relationship_revenue_score desc,r.first_party_evidence_score desc,r.last_relevant_at desc nulls last,r.person_key) rn
    from public.powerhouse_relationship_revenue_intelligence_v1 r
    where r.relationship_revenue_score>=.50 and r.actions_30d<3
      and r.research_need not in ('powerhouse_self_sufficient','fatigue_hold')
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,message_draft,source_url,status,due_at,
    expected_value_eur,person_name,company_name,role
  )
  select 'relationship-research:'||md5(r.person_key)||':'||r.research_need,'relationship:'||r.person_key,
    r.person_key,r.company_key,'research_enrichment','internal',round((100*r.relationship_revenue_score)::numeric,2),
    'Enrich this high-value existing relationship from Powerhouse first-party evidence and bounded public-web sources before deciding on outreach.',
    coalesce(r.revenue_intelligence,'{}'::jsonb)||jsonb_build_object(
      'research_need',r.research_need,'enrichment_mode',r.enrichment_mode,
      'research_targets',jsonb_build_array(
        'recent public LinkedIn/company posts where lawfully accessible','company website/newsroom','vacancies and hiring signals',
        'public press/news','public company/sector developments','existing Powerhouse runtime/predictive evidence'
      ),
      'execution_gate',jsonb_build_object(
        'external_side_effect_allowed',false,'unsolicited_outreach_requires_human_authorization',true,
        'no_scraping_or_platform_bypass',true,'vendor_dependency',false
      )
    ),
    '',coalesce(r.linkedin_url,''),'suggested',v_now,0,r.person_name,r.company_name,r.role
  from ranked r where r.rn<=50
  on conflict(dedupe_key) do update set priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,
    source_url=excluded.source_url,due_at=excluded.due_at,updated_at=v_now;
  get diagnostics v_research=row_count;

  with ranked as (
    select r.*,row_number() over(order by r.max_expected_revenue_value desc,r.relationship_revenue_score desc,r.first_party_evidence_score desc,r.person_key) rn
    from public.powerhouse_relationship_revenue_intelligence_v1 r
    where r.activation_review_ready and r.actions_30d<3
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,message_draft,source_url,status,due_at,
    expected_value_eur,person_name,company_name,role
  )
  select 'relationship-activation-review:'||md5(r.person_key),'relationship:'||r.person_key,
    r.person_key,r.company_key,'commercial_outreach_review','internal',round((100*r.relationship_revenue_score)::numeric,2),
    'Existing relationship plus observed opportunity/value evidence merits a human-authorized activation decision.',
    coalesce(r.revenue_intelligence,'{}'::jsonb)||jsonb_build_object(
      'activation_review_ready',true,'open_opportunities',r.open_opportunities,
      'max_expected_value_eur',r.max_expected_value_eur,'max_expected_revenue_value',r.max_expected_revenue_value,
      'execution_gate',jsonb_build_object(
        'external_side_effect_allowed',false,'human_authorization_required',true,'identity_and_destination_verification_required',true
      )
    ),
    case when nullif(trim(r.aanleiding),'') is not null
      then 'Persoonlijke opvolging voorbereiden op basis van de bestaande relatie en deze concrete aanleiding: '||left(r.aanleiding,220)
      else 'Persoonlijke opvolging voorbereiden op basis van bestaande relatie plus actuele opportunity-evidence; geen generieke pitch.' end,
    coalesce(r.linkedin_url,''),'prepared',v_now,r.max_expected_value_eur,r.person_name,r.company_name,r.role
  from ranked r where r.rn<=20
  on conflict(dedupe_key) do update set priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,
    message_draft=excluded.message_draft,source_url=excluded.source_url,expected_value_eur=excluded.expected_value_eur,updated_at=v_now;
  get diagnostics v_activation=row_count;

  v_result:=jsonb_build_object(
    'contract','powerhouse-relationship-revenue-engine-v1','run_date',p_run_date,'executed_at',v_now,
    'ranked_relationships',(select count(*) from public.powerhouse_relationship_revenue_intelligence_v1 where relationship_revenue_score>=.50),
    'research_actions_touched',v_research,'activation_reviews_touched',v_activation,'apollo_required',false,
    'source_priority',jsonb_build_array('powerhouse_first_party','public_web','optional_vendor_fallback'),
    'external_outreach_executed',false
  );

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values (
    'relationship-revenue:'||p_run_date::text,'relationship_revenue_cycle','powerhouse-relationship-revenue-engine-v1',
    'growth-revenue-os',v_now,v_result,
    jsonb_build_object('reuse_first',true,'no_parallel_crm',true,'vendor_dependency',false,'external_side_effects',false),
    'actioned','VERIFIED',1
  )
  on conflict(dedupe_key) do update set occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
    state=excluded.state,updated_at=v_now;
  return v_result;
exception when others then
  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values (
    'relationship-revenue-error:'||to_char(now() at time zone 'UTC','YYYYMMDDHH24MI'),
    'relationship_revenue_cycle_failed','powerhouse-relationship-revenue-engine-v1','growth-revenue-os',now(),
    jsonb_build_object('error',sqlerrm,'sqlstate',sqlstate),jsonb_build_object('fail_closed',true,'vendor_dependency',false),
    'error','VERIFIED',1
  ) on conflict(dedupe_key) do nothing;
  return jsonb_build_object('contract','powerhouse-relationship-revenue-engine-v1','healthy',false,'error',sqlerrm,'sqlstate',sqlstate);
end;
$$;

revoke execute on function public.powerhouse_refresh_relationship_revenue_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_relationship_revenue_v1(date) to service_role;

create or replace function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_relationship jsonb;
  v_trigger jsonb;
  v_learning jsonb;
begin
  v_relationship:=public.powerhouse_refresh_relationship_revenue_v1(p_run_date);
  v_trigger:=public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(p_run_date);
  v_learning:=public.powerhouse_commercial_learning_cycle_v1(p_run_date);
  return jsonb_build_object(
    'contract','powerhouse-trigger-based-mkb-acquisition-cycle-v1',
    'relationship_revenue',v_relationship,'trigger_acquisition',v_trigger,'commercial_learning',v_learning,
    'run_date',p_run_date,'executed_at',now()
  );
end;
$$;

comment on view public.powerhouse_relationship_revenue_intelligence_v1 is
'Ranks existing relationships for revenue research using canonical first-party person/company intelligence. Powerhouse-first, public-web second, vendor enrichment optional only. Relationship strength is never treated as a buying trigger.';

comment on function public.powerhouse_refresh_relationship_revenue_v1(date) is
'Creates bounded internal research and human-authorized activation-review actions from the existing relationship graph. No external outreach is executed.';

insert into public.brain_failure_registry(
  fingerprint,maturity,root_cause,proven_fix,prevention_rule,regression_ref,occurrence_count,version,first_seen_at,last_seen_at,evidence
) values (
  'relationship-network-value-not-activated-v1','OBSERVED',
  'Powerhouse already held a large relationship graph plus person/company intelligence, but commercial trigger materialization required explicit company triggers; high-value existing relationships could therefore remain commercially idle.',
  'Add a self-first relationship-to-revenue projection that ranks existing contacts, creates bounded public-research work, prepares activation review only when real opportunity/value evidence exists, and reuses the canonical daily commercial cycle.',
  'Never make Apollo or another vendor the canonical sales brain. Use Powerhouse first-party evidence first, bounded public-web enrichment second, and optional vendor fallback only for unresolved evidence gaps. Relationship warmth is not a buying trigger and unsolicited outreach remains human-authorized.',
  'tests/supabase-powerhouse-relationship-revenue-engine-v1.test.mjs|powerhouse-relationship-revenue-engine-v1',
  1,1,now(),now(),jsonb_build_object('no_parallel_crm',true,'apollo_required',false,'reuse_existing_scheduler',true,'external_outreach_executed',false)
) on conflict(fingerprint) do update set
  root_cause=excluded.root_cause,proven_fix=excluded.proven_fix,prevention_rule=excluded.prevention_rule,
  regression_ref=excluded.regression_ref,occurrence_count=public.brain_failure_registry.occurrence_count+1,
  version=greatest(public.brain_failure_registry.version,excluded.version),last_seen_at=now(),
  evidence=coalesce(public.brain_failure_registry.evidence,'{}'::jsonb)||excluded.evidence;
