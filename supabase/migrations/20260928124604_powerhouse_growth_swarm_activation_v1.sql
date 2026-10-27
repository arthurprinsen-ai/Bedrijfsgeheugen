-- Powerhouse Growth Swarm activation catalog v1

create table if not exists public.powerhouse_growth_play_catalog_v1 (
  play_key text primary key,
  name text not null,
  funnel_stage text not null,
  trigger_rule text not null,
  primary_action text not null,
  primary_metric text not null,
  readiness text not null,
  dependencies text[] not null default '{}'::text[],
  channels text[] not null default '{}'::text[],
  guardrails jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.powerhouse_growth_play_catalog_v1 enable row level security;
revoke all on public.powerhouse_growth_play_catalog_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.powerhouse_growth_play_catalog_v1 to service_role;

insert into public.powerhouse_growth_play_catalog_v1(
  play_key,name,funnel_stage,trigger_rule,primary_action,primary_metric,readiness,dependencies,channels,guardrails,evidence
) values
('mkb-friction-index','MKB Friction Index','demand_creation','aggregate scan/benchmark evidence reaches privacy floor','publish anonymized sector friction benchmark','qualified_scan_started','ARMED',array['scan_inzendingen','powerhouse_friction_index_v1'],array['public_tool','linkedin_company','blog'],'{"min_group_size":5,"no_fabricated_benchmarks":true}'::jsonb,'{"contract":"powerhouse-growth-swarm-v1"}'),
('prebuilt-prospect-dossier','Pre-built Prospect Dossier','outbound','swarm_score >= 0.35 and known decision relationship','build evidence dossier before contact','reply_or_meeting','ACTIVE',array['powerhouse_growth_swarm_accounts_v1','relationship_intelligence','trigger_intelligence'],array['internal','linkedin','email'],'{"public_or_first_party_evidence_only":true}'::jsonb,'{"contract":"powerhouse-growth-swarm-v1"}'),
('positive-public-teardown','Positive Public Teardown','demand_creation','strong verifiable public company evidence','publish useful positive teardown without confidential inference','inbound_lead','ARMED',array['public_research','content_recommendations'],array['linkedin_company','blog'],'{"no_private_inference":true,"no_humiliation":true}'::jsonb,'{"contract":"powerhouse-growth-swarm-v1"}'),
('anti-consultancy-challenge','Anti-consultancy Challenge','conversion','scan/landing-page visitor with measurable problem context','challenge prospect to surface concrete improvements before purchase','scan_completion','READY_FOR_SURFACE',array['scan','benchmark'],array['website','scan'],'{"no_false_guarantee":true}'::jsonb,'{"contract":"powerhouse-growth-swarm-v1"}'),
('reverse-selling','Reverse Selling','conversion','low current need or weak evidence despite engagement','recommend not buying yet and give internal next steps','later_conversion_or_trust','ACTIVE',array['scan','swarm_score','problem_evidence'],array['scan_report','email'],'{"no_pressure_when_low_fit":true}'::jsonb,'{"contract":"powerhouse-growth-swarm-v1"}'),
('trigger-hijacking','Trigger Hijacking','outbound','fresh evidence-backed company trigger','contextual engagement followed by bounded private follow-up','reply_or_meeting','ACTIVE',array['public_research','linkedin_sales_machine','autonomous_outreach'],array['linkedin','email'],'{"fresh_evidence_required":true}'::jsonb,'{"contract":"powerhouse-growth-swarm-v1"}'),
('boardroom-fear-of-blindness','Boardroom Blindness','demand_creation','management-information or execution blind spot','publish five-unknowns executive diagnostic','executive_scan_started','ARMED',array['problem_radar','management_accounting','scan'],array['linkedin_company','blog','scan'],'{"evidence_backed":true}'::jsonb,'{"contract":"powerhouse-growth-swarm-v1"}'),
('lost-knowledge-calculator','Lost Knowledge Calculator','lead_magnet','people/knowledge-risk interest','calculate scenario estimate and invite evidence validation','lead_or_scan','ACTIVE',array['powerhouse_lost_knowledge_value_v1'],array['public_tool','pdf','portal'],'{"estimate_label_required":true}'::jsonb,'{"contract":"powerhouse-growth-tools-v1"}'),
('value-before-demo','Value Before Demo','conversion','qualified opportunity with enough evidence','show economic hypothesis before demo','meeting_to_scan','ACTIVE',array['growth_swarm','opportunities'],array['dossier','email'],'{"hypothesis_not_observed_fact":true}'::jsonb,'{"contract":"powerhouse-growth-swarm-v1"}'),
('prospect-generated-content-loop','Prospect Generated Content Loop','flywheel','repeated trigger/problem pattern across accounts','turn anonymized pattern into content recommendation','content_assisted_pipeline','ACTIVE',array['triggers','content_recommendations','outcomes'],array['linkedin_company','blog','seo'],'{"no_prospect_names":true}'::jsonb,'{"contract":"powerhouse-growth-swarm-v1"}'),
('competitor-switch-pages','Problem / Competitor Switch Pages','seo','high-intent problem query with existing owner/cannibalization clearance','publish or improve problem-led SEO owner page','organic_lead','ARMED',array['seo_order_engine','problem_radar'],array['website','seo'],'{"existing_owner_first":true,"no_fake_comparisons":true}'::jsonb,'{"contract":"powerhouse-growth-swarm-v1"}'),
('ma-knowledge-risk','M&A Knowledge & Execution Risk','partner_sales','M&A/investor/post-merger trigger or partner due-diligence request','produce risk score plus due-diligence questions','partner_or_portfolio_meeting','ACTIVE',array['powerhouse_ma_knowledge_execution_risk_v1','growth_swarm'],array['public_tool','partner_email','scan'],'{"risk_not_valuation":true}'::jsonb,'{"contract":"powerhouse-growth-tools-v1"}'),
('competitor-benchmark','Public Competitor Benchmark','lead_magnet','benchmark interest with aggregate evidence','show privacy-safe relative benchmark','benchmark_to_scan','ACTIVE',array['powerhouse_friction_index_v1'],array['public_tool','scan'],'{"aggregate_only":true,"min_group_size":5}'::jsonb,'{"contract":"powerhouse-growth-tools-v1"}'),
('data-contribution-flywheel','Benchmark Unlock by Data Contribution','flywheel','user asks for deeper benchmark and consents to scan contribution','unlock deeper anonymized benchmark after contribution','contribution_then_retention','ARMED',array['scan_inzendingen','benchmark'],array['scan','portal'],'{"consent_required":true,"aggregate_only":true}'::jsonb,'{"contract":"powerhouse-growth-swarm-v1"}'),
('warm-referral','Referral Without Referral Program','referral','recent positive outcome and warm relationship','ask for one specific peer with the same problem','warm_intro','ACTIVE',array['sales_outcomes','relationship_intelligence'],array['internal','email'],'{"context_validation_before_external_ask":true}'::jsonb,'{"contract":"powerhouse-growth-swarm-v1"}'),
('risk-reversal','Scan Risk Reversal','conversion','high-fit prospect has price/risk objection','offer bounded conditional risk reversal only when economics support it','paid_scan','READY_FOR_SURFACE',array['scan','value_hypothesis'],array['website','email'],'{"no_unconditional_guarantee":true}'::jsonb,'{"contract":"powerhouse-growth-swarm-v1"}'),
('workshop-leaderboard','Live Workshop Benchmark Leaderboard','event_conversion','workshop reaches >=5 scored participants','show anonymous percentile and handoff to personal portal','portal_activation_or_scan','ACTIVE',array['powerhouse_workshop_leaderboard_v1','workshop_portal_intakes'],array['workshop','pdf','portal'],'{"no_participant_identity_exposure":true,"min_group_size":5}'::jsonb,'{"contract":"powerhouse-growth-tools-v1"}'),
('dark-funnel','Dark Funnel Account Intent','intent','multiple weak signals converge at company level','raise account intent score and next-best-action priority','intent_to_reply','ACTIVE',array['powerhouse_dark_funnel_intent_v1','growth_events','linkedin_engagement_events','scan_inzendingen'],array['revenue_swarm'],'{"single_weak_signal_never_equals_buying_intent":true}'::jsonb,'{"contract":"powerhouse-growth-swarm-v1"}'),
('we-disagree-content','Contrarian We-Disagree Content','demand_creation','dominant evidence-backed problem pattern','publish contrarian evidence-led point of view','qualified_engagement','ACTIVE',array['trigger_clusters','content_recommendations'],array['linkedin_company','blog'],'{"claim_must_be_supportable":true}'::jsonb,'{"contract":"powerhouse-growth-swarm-v1"}'),
('revenue-swarm','Revenue Swarm','orchestration','daily commercial cycle','rank accounts, select play/channel, execute or wait, learn','realized_revenue','ACTIVE',array['all_growth_signals','relationships','opportunities','content','outcomes'],array['revenue_command_center','sales_actions','content_recommendations'],'{"evidence_identity_dedupe_fatigue_suppression_provider_ack_required":true}'::jsonb,'{"contract":"powerhouse-growth-swarm-v1"}')
on conflict(play_key) do update set
  name=excluded.name,funnel_stage=excluded.funnel_stage,trigger_rule=excluded.trigger_rule,
  primary_action=excluded.primary_action,primary_metric=excluded.primary_metric,readiness=excluded.readiness,
  dependencies=excluded.dependencies,channels=excluded.channels,guardrails=excluded.guardrails,
  evidence=excluded.evidence,updated_at=now();

create or replace function public.powerhouse_materialize_growth_swarm_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz:=now();
  v_dossiers integer:=0;
  v_play_events integer:=0;
begin
  with ranked as (
    select g.*,row_number() over(order by swarm_score desc,expected_revenue_eur desc,expected_value_eur desc,company_key) rn
    from public.powerhouse_growth_swarm_accounts_v1 g
    where swarm_score>=.35
      and best_person_key is not null
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,
    message_draft,source_url,status,due_at,expected_value_eur,person_name,company_name,role
  )
  select
    'growth-swarm-dossier:'||md5(r.company_key)||':'||p_run_date::text,
    'company:'||r.company_key,r.best_person_key,r.company_key,
    'growth_swarm_dossier','internal',round(100*r.swarm_score,2),
    'Pre-build the commercial case before outreach: connect evidence, benchmark, value hypothesis, buying trigger and best next action.',
    r.evidence||jsonb_build_object(
      'contract','powerhouse-growth-swarm-materialization-v1',
      'swarm_score',r.swarm_score,
      'relationship_score',r.relationship_score,
      'trigger_score',r.trigger_score,
      'dark_funnel_score',r.dark_funnel_score,
      'friction_score',r.friction_score,
      'knowledge_risk_score',r.knowledge_risk_score,
      'ma_risk_score',r.ma_risk_score,
      'next_best_action',r.next_best_action,
      'next_best_channel',r.next_best_channel,
      'play_keys',r.play_keys,
      'expected_value_eur',r.expected_value_eur,
      'expected_revenue_eur',r.expected_revenue_eur,
      'dossier_contract',jsonb_build_object(
        'opening_observation',true,
        'three_evidence_points',true,
        'two_value_levers',true,
        'one_economic_hypothesis',true,
        'one_recommended_offer',true,
        'one_next_best_channel',true
      )
    ),
    '', '', 'suggested',v_now,r.expected_value_eur,r.best_person_name,r.company_name,r.best_person_role
  from ranked r
  where rn<=20
  on conflict(dedupe_key) do update set
    priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,due_at=excluded.due_at,
    expected_value_eur=excluded.expected_value_eur,updated_at=v_now;
  get diagnostics v_dossiers=row_count;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,company_key,occurred_at,evidence,context,state,data_quality,confidence
  )
  select
    'growth-swarm-play:'||md5(g.company_key)||':'||p_run_date::text,
    'growth_swarm_account_ranked',
    'powerhouse-growth-swarm-v1',
    'company:'||g.company_key,g.company_key,v_now,
    jsonb_build_object(
      'swarm_score',g.swarm_score,
      'next_best_action',g.next_best_action,
      'next_best_channel',g.next_best_channel,
      'play_keys',g.play_keys,
      'expected_value_eur',g.expected_value_eur,
      'expected_revenue_eur',g.expected_revenue_eur
    ),
    jsonb_build_object('company_name',g.company_name,'best_person_key',g.best_person_key),
    'observed','VERIFIED',g.swarm_score
  from public.powerhouse_growth_swarm_accounts_v1 g
  where g.swarm_score>=.35
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
    state=excluded.state,data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=v_now;
  get diagnostics v_play_events=row_count;

  return jsonb_build_object(
    'contract','powerhouse-growth-swarm-materialization-v1',
    'run_date',p_run_date,
    'dossiers_touched',v_dossiers,
    'ranked_play_events_touched',v_play_events,
    'active_catalog_plays',(select count(*) from public.powerhouse_growth_play_catalog_v1 where readiness='ACTIVE'),
    'catalog_plays',(select count(*) from public.powerhouse_growth_play_catalog_v1),
    'executed_at',v_now
  );
end;
$$;

revoke execute on function public.powerhouse_materialize_growth_swarm_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_materialize_growth_swarm_v1(date) to service_role;

create or replace function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_relationship jsonb;
  v_existing_research jsonb;
  v_public_research_dispatch jsonb;
  v_trigger jsonb;
  v_growth_swarm jsonb;
  v_growth_activation jsonb;
  v_linkedin_sales_dispatch jsonb;
  v_outreach_prepare jsonb;
  v_outreach_dispatch jsonb;
  v_learning jsonb;
begin
  v_relationship:=public.powerhouse_refresh_relationship_revenue_v1(p_run_date);
  v_existing_research:=public.powerhouse_execute_relationship_research_v1(p_run_date);
  v_public_research_dispatch:=public.powerhouse_dispatch_relationship_public_research_v1(p_run_date);
  v_trigger:=public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(p_run_date);
  v_growth_swarm:=public.powerhouse_refresh_growth_swarm_v1(p_run_date);
  v_growth_activation:=public.powerhouse_materialize_growth_swarm_v1(p_run_date);
  v_linkedin_sales_dispatch:=public.powerhouse_dispatch_linkedin_sales_machine_v1(p_run_date);
  v_outreach_prepare:=public.powerhouse_prepare_autonomous_outreach_v1(p_run_date);
  v_outreach_dispatch:=public.powerhouse_dispatch_autonomous_outreach_v1(p_run_date);
  v_learning:=public.powerhouse_commercial_learning_cycle_v1(p_run_date);

  return jsonb_build_object(
    'contract','powerhouse-trigger-based-mkb-acquisition-cycle-v1',
    'relationship_revenue',v_relationship,
    'existing_evidence_research',v_existing_research,
    'public_research_dispatch',v_public_research_dispatch,
    'trigger_acquisition',v_trigger,
    'growth_swarm',v_growth_swarm,
    'growth_swarm_activation',v_growth_activation,
    'linkedin_sales_dispatch',v_linkedin_sales_dispatch,
    'autonomous_outreach_prepare',v_outreach_prepare,
    'autonomous_outreach_dispatch',v_outreach_dispatch,
    'commercial_learning',v_learning,
    'run_date',p_run_date,
    'executed_at',now()
  );
end;
$$;

revoke execute on function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date) to service_role;
