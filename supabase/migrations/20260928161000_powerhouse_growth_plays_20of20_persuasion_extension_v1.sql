-- Powerhouse Growth Plays 20/20 + Persuasion extension v1
-- Canonical successor to the existing Growth Swarm and Persuasion Revenue Optimizer.
-- This migration activates the seven formerly ARMED/READY plays and guarantees decision -> executor.

-- Powerhouse Persuasion Revenue Optimizer + complete 20-play activation v1
-- 2026-09-28
-- Makes all Growth Swarm plays executable through canonical Powerhouse evidence, actions,
-- content recommendations, experiments and outcome learning. No sensitive psychographic profiling.

create table if not exists public.powerhouse_persuasion_principles_v1 (
  principle_key text primary key,
  name text not null,
  purpose text not null,
  allowed_when text not null,
  prohibited_when text not null,
  guardrails jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.powerhouse_persuasion_principles_v1 enable row level security;
revoke all on public.powerhouse_persuasion_principles_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.powerhouse_persuasion_principles_v1 to service_role;

insert into public.powerhouse_persuasion_principles_v1(principle_key,name,purpose,allowed_when,prohibited_when,guardrails)
values
('evidence_specificity','Evidence & specificity','Make the problem and value concrete with verifiable evidence.','Evidence exists and can be cited or traced.','Never invent numbers, intent, urgency or customer facts.','{"truth_required":true,"observed_vs_estimated_label_required":true}'::jsonb),
('reciprocity_value_first','Reciprocity through value first','Give a useful observation, benchmark or diagnostic before asking for time or money.','Useful value can be delivered without hidden conditions.','Never disguise a sales trap as a gift.','{"no_hidden_condition":true}'::jsonb),
('contrast_choice','Contrast & choice architecture','Show the difference between do nothing, self-fix and paid next step.','Alternatives can be described fairly.','Never remove a realistic no-buy option.','{"include_no_buy_option":true}'::jsonb),
('risk_reduction','Risk reduction','Reduce justified purchase uncertainty through bounded proof, pilot or conditional risk reversal.','The condition is operationally enforceable and economically supportable.','Never promise an unconditional guarantee or outcome not controlled by Powerhouse.','{"conditional_only":true,"no_false_guarantee":true}'::jsonb),
('social_proof_verified','Verified social proof','Use real aggregate benchmarks or documented outcomes to reduce uncertainty.','Sample/proof thresholds are satisfied.','Never fabricate testimonials, customer counts or benchmark claims.','{"aggregate_floor":5,"verified_only":true}'::jsonb),
('authority_verified','Verified authority','Use credentials, methods and evidence to increase trust.','Claims are documented and relevant.','Never imply endorsements, certifications or client relationships that do not exist.','{"documented_only":true}'::jsonb),
('commitment_micro_step','Low-friction commitment','Ask for the smallest useful next step: answer, benchmark, two observations, 15-minute call, scan.','The prospect has shown sufficient evidence of relevance.','Never create forced continuity or hidden commitment.','{"reversible":true,"small_next_step":true}'::jsonb),
('loss_context','Loss framing with evidence','Show the cost of delay or knowledge/friction loss when evidence supports it.','Loss is calculable or explicitly labelled estimate.','Never use fear unsupported by evidence.','{"no_fearmongering":true,"estimate_label_required":true}'::jsonb),
('timing_relevance','Timing relevance','Connect outreach to a recent real trigger.','Trigger is fresh and company-specific.','Never invent deadlines or fake scarcity.','{"fresh_evidence_required":true,"fake_scarcity_forbidden":true}'::jsonb),
('autonomy_reverse_sell','Autonomy & reverse selling','Increase trust by explicitly allowing self-fix, wait or no-buy outcomes.','Evidence or fit is weak, or a self-service route is viable.','Never pressure a low-fit prospect.','{"no_pressure":true,"no_buy_allowed":true}'::jsonb)
on conflict(principle_key) do update set
  name=excluded.name,purpose=excluded.purpose,allowed_when=excluded.allowed_when,
  prohibited_when=excluded.prohibited_when,guardrails=excluded.guardrails,updated_at=now();

create table if not exists public.powerhouse_persuasion_decisions_v1 (
  decision_id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  run_date date not null,
  subject_key text not null,
  company_key text,
  person_key text,
  play_key text not null,
  funnel_stage text not null,
  channel text not null,
  principles text[] not null default '{}'::text[],
  primary_message_strategy text not null,
  micro_cta text,
  do_not_use text[] not null default '{}'::text[],
  evidence jsonb not null default '{}'::jsonb,
  confidence numeric not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.powerhouse_persuasion_decisions_v1 enable row level security;
revoke all on public.powerhouse_persuasion_decisions_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.powerhouse_persuasion_decisions_v1 to service_role;

create or replace function public.powerhouse_persuasion_revenue_optimizer_v1(
  p_company_key text,
  p_play_key text,
  p_channel text,
  p_funnel_stage text default 'consideration'
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  g public.powerhouse_growth_swarm_accounts_v1%rowtype;
  v_principles text[]:=array['evidence_specificity','reciprocity_value_first','contrast_choice'];
  v_micro_cta text:='Mag ik twee concrete observaties sturen?';
  v_strategy text:='Lead with one verifiable observation, explain why it matters, give a useful next step before asking for commitment.';
  v_do_not_use text[]:=array['fake scarcity','fabricated social proof','unsupported fear','sensitive-trait targeting','hidden commitment','generic pressure'];
  v_social_ok boolean:=false;
  v_conf numeric:=.55;
begin
  select * into g from public.powerhouse_growth_swarm_accounts_v1 where company_key=p_company_key;

  if found then
    v_conf:=least(1::numeric,.45+.25*coalesce(g.trigger_score,0)+.15*coalesce(g.relationship_score,0)+.15*coalesce(g.dark_funnel_score,0));

    if coalesce(g.trigger_score,0)>=.60 then
      v_principles:=array_append(v_principles,'timing_relevance');
      v_strategy:='Open with the fresh verified trigger, connect it to one business consequence, then offer a concrete useful observation.';
    end if;

    if coalesce(g.knowledge_risk_score,0)>=.45 or coalesce(g.friction_score,0)>=.45 then
      v_principles:=array_append(v_principles,'loss_context');
    end if;

    if coalesce(g.expected_value_eur,0)>0 or coalesce(g.expected_revenue_eur,0)>0 then
      v_principles:=array_append(v_principles,'risk_reduction');
      v_strategy:=v_strategy||' Frame value as an explicit hypothesis and reduce risk with a bounded next step.';
    end if;

    if coalesce(g.dark_funnel_score,0)>=.45 or coalesce(g.relationship_score,0)>=.60 then
      v_principles:=array_append(v_principles,'commitment_micro_step');
      v_micro_cta:=case
        when p_channel like 'linkedin%' then 'Zal ik de twee observaties hier kort delen?'
        when p_channel='email' then 'Zal ik de twee observaties terugmailen, of is 15 minuten handiger?'
        else 'Bekijk eerst de benchmark of scan; daarna beslis je zelf of een gesprek zin heeft.'
      end;
    end if;

    if coalesce(g.swarm_score,0)<.40 then
      v_principles:=array_append(v_principles,'autonomy_reverse_sell');
      v_strategy:='Lead with useful evidence and explicitly allow a wait/self-fix/no-buy outcome.';
      v_micro_cta:='Wil je dat ik alleen de observaties stuur, zonder vervolgafspraak?';
    end if;

    select exists(
      select 1 from public.powerhouse_friction_index_v1 f
      where f.sample_size>=5
      limit 1
    ) into v_social_ok;
    if v_social_ok then
      v_principles:=array_append(v_principles,'social_proof_verified');
    end if;
  else
    v_principles:=array_append(v_principles,'autonomy_reverse_sell');
    v_strategy:='No account evidence is available: use general educational value only and do not imply company-specific intent.';
    v_conf:=.30;
  end if;

  if p_play_key in ('reverse-selling','anti-consultancy-challenge') then
    v_principles:=array_append(v_principles,'autonomy_reverse_sell');
  end if;
  if p_play_key='risk-reversal' then
    v_principles:=array_append(v_principles,'risk_reduction');
  end if;
  if p_play_key in ('ma-knowledge-risk','lost-knowledge-calculator','mkb-friction-index','competitor-benchmark') then
    v_principles:=array_append(v_principles,'authority_verified');
  end if;

  return jsonb_build_object(
    'contract','powerhouse-persuasion-revenue-optimizer-v1',
    'company_key',p_company_key,
    'play_key',p_play_key,
    'funnel_stage',p_funnel_stage,
    'channel',p_channel,
    'principles',(select jsonb_agg(distinct x) from unnest(v_principles) x),
    'primary_message_strategy',v_strategy,
    'micro_cta',v_micro_cta,
    'do_not_use',to_jsonb(v_do_not_use),
    'confidence',round(v_conf,3),
    'personalization_boundary','Use company/relationship/business evidence only. No sensitive-trait or psychological personality profiling.',
    'truth_boundary','Scarcity, social proof, authority, loss and value claims require explicit evidence.'
  );
end;
$$;

revoke execute on function public.powerhouse_persuasion_revenue_optimizer_v1(text,text,text,text) from public,anon,authenticated;
grant execute on function public.powerhouse_persuasion_revenue_optimizer_v1(text,text,text,text) to service_role;

create or replace function public.powerhouse_activate_all_growth_plays_v2(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_now timestamptz:=now();
  v_content int:=0;
  v_actions int:=0;
  v_decisions int:=0;
  v_rows int:=0;
begin
  -- 1) MKB Friction Index: when the privacy floor is met, automatically create content demand.
  insert into public.powerhouse_content_recommendations(
    dedupe_key,run_date,topic_key,target_channel,recommendation_type,priority,reason,evidence,status
  )
  select
    'growth-play:mkb-friction-index:'||p_run_date::text||':'||md5(f.branche),
    p_run_date,'mkb-friction-index:'||f.branche,'linkedin_company','mkb_friction_index',98,
    'Publish the strongest privacy-safe sector friction insight and invite the reader to compare through the Frisse Blik.',
    jsonb_build_object(
      'contract','powerhouse-growth-plays-v2','play_key','mkb-friction-index','branche',f.branche,
      'sample_size',f.sample_size,'friction_index',f.friction_index,'maturity_score',f.maturity_score,
      'persuasion',jsonb_build_object('principles',jsonb_build_array('evidence_specificity','social_proof_verified','reciprocity_value_first')),
      'privacy_floor_passed',f.sample_size>=5
    ),'suggested'
  from public.powerhouse_friction_index_v1 f
  where f.sample_size>=5
  order by f.friction_index desc,f.sample_size desc
  limit 3
  on conflict(dedupe_key) do update set priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,updated_at=v_now;
  get diagnostics v_content=row_count;

  -- 2) Positive public teardown: only use public evidence and keep the public copy constructive.
  insert into public.powerhouse_content_recommendations(
    dedupe_key,run_date,topic_key,target_channel,recommendation_type,priority,reason,evidence,status
  )
  select
    'growth-play:positive-teardown:'||p_run_date::text||':'||md5(g.company_key),
    p_run_date,'positive-teardown:'||g.company_key,'linkedin_company','positive_public_teardown',
    round(82+15*g.swarm_score,2),
    'Create a constructive public teardown from verifiable public evidence: what is smart, what is observable, and one generalizable lesson. No private inference and no humiliation.',
    jsonb_build_object(
      'contract','powerhouse-growth-plays-v2','play_key','positive-public-teardown',
      'company_key',g.company_key,'company_name',g.company_name,
      'public_evidence_ref',g.evidence#>>'{trigger,evidence_ref}',
      'swarm_score',g.swarm_score,
      'persuasion',public.powerhouse_persuasion_revenue_optimizer_v1(g.company_key,'positive-public-teardown','linkedin_company','awareness'),
      'guardrails',jsonb_build_object('public_evidence_only',true,'constructive_only',true,'private_inference_forbidden',true)
    ),'suggested'
  from public.powerhouse_growth_swarm_accounts_v1 g
  where g.swarm_score>=.45
    and nullif(g.evidence#>>'{trigger,evidence_ref}','') is not null
  order by g.swarm_score desc
  limit 2
  on conflict(dedupe_key) do update set priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,updated_at=v_now;
  get diagnostics v_rows=row_count;
  v_actions:=v_actions+v_rows;

  -- 3) Anti-consultancy challenge: a concrete conversion action on qualified scan/website interest.
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,
    message_draft,status,due_at,expected_value_eur,person_name,company_name,role
  )
  select
    'growth-play:anti-consultancy:'||md5(g.company_key)||':'||p_run_date::text,
    'company:'||g.company_key,g.best_person_key,g.company_key,'anti_consultancy_challenge','email',
    round(80+15*g.swarm_score,2),
    'Evidence-first challenge: prove three useful observations before asking the prospect to buy anything.',
    g.evidence||jsonb_build_object(
      'contract','powerhouse-growth-plays-v2','play_key','anti-consultancy-challenge',
      'persuasion',public.powerhouse_persuasion_revenue_optimizer_v1(g.company_key,'anti-consultancy-challenge','email','consideration'),
      'offer_contract',jsonb_build_object('three_observations_first',true,'no_buy_outcome_allowed',true,'no_false_guarantee',true)
    ),
    'Ik stuur je liever eerst drie concrete observaties dan een verkoopverhaal. Als daar geen serieuze hefboom uit komt, is mijn advies juist om nu niets te kopen. Zal ik die drie observaties sturen?',
    'suggested',v_now,greatest(g.expected_value_eur,2900),g.best_person_name,g.company_name,g.best_person_role
  from public.powerhouse_growth_swarm_accounts_v1 g
  where g.best_person_key is not null
    and g.swarm_score>=.45
    and not exists(
      select 1 from public.powerhouse_sales_actions a
      where a.company_key=g.company_key and a.action_type='anti_consultancy_challenge'
        and a.created_at>=v_now-interval '30 days'
    )
  order by g.swarm_score desc
  limit 5
  on conflict(dedupe_key) do nothing;
  get diagnostics v_rows=row_count;
  v_actions:=v_actions+v_rows;

  -- 4) Boardroom blindness: use aggregate recurring management/execution evidence.
  insert into public.powerhouse_content_recommendations(
    dedupe_key,run_date,topic_key,target_channel,recommendation_type,priority,reason,evidence,status
  )
  select
    'growth-play:boardroom-blindness:'||p_run_date::text,
    p_run_date,'boardroom-blindness','linkedin_company','boardroom_blindness',97,
    'Publish five concrete questions a CEO/MT should be able to answer today, derived from recurring friction, knowledge and management-information evidence.',
    jsonb_build_object(
      'contract','powerhouse-growth-plays-v2','play_key','boardroom-fear-of-blindness',
      'aggregate',jsonb_build_object(
        'accounts_considered',count(*),
        'avg_friction',round(avg(friction_score),3),
        'avg_knowledge_risk',round(avg(knowledge_risk_score),3),
        'avg_dark_funnel',round(avg(dark_funnel_score),3)
      ),
      'persuasion',jsonb_build_object('principles',jsonb_build_array('evidence_specificity','loss_context','commitment_micro_step')),
      'prospect_names_forbidden',true
    ),'suggested'
  from public.powerhouse_growth_swarm_accounts_v1
  where swarm_score>=.35
  having count(*)>=5
  on conflict(dedupe_key) do update set priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,updated_at=v_now;
  get diagnostics v_rows=row_count;
  v_content:=v_content+v_rows;

  -- 5) Competitor/problem switch pages: generate canonical SEO work items from repeated trigger types.
  with patterns as (
    select evidence#>>'{trigger,trigger_type}' trigger_type,count(*) n,avg(trigger_score) avg_score
    from public.powerhouse_growth_swarm_accounts_v1
    where nullif(evidence#>>'{trigger,trigger_type}','') is not null
      and trigger_score>=.45
    group by evidence#>>'{trigger,trigger_type}'
    having count(*)>=3
    order by count(*) desc,avg(trigger_score) desc
    limit 5
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,action_type,channel,priority,reason,evidence,message_draft,status,due_at
  )
  select
    'growth-play:seo-switch:'||p_run_date::text||':'||md5(p.trigger_type),
    'seo-problem:'||p.trigger_type,'seo_problem_switch_page','seo',
    92,
    'Create or improve one canonical problem-led SEO page only after existing-owner/cannibalization inspection.',
    jsonb_build_object(
      'contract','powerhouse-growth-plays-v2','play_key','competitor-switch-pages',
      'trigger_type',p.trigger_type,'account_pattern_count',p.n,'avg_trigger_score',round(p.avg_score,3),
      'required_chain',jsonb_build_array('existing_owner_check','search_intent_check','problem_language','comparison_truth_check','cta_to_scan','publish','organic_outcome_learning'),
      'guardrails',jsonb_build_object('no_fake_comparison',true,'existing_owner_first',true,'competitor_claims_public_evidence_only',true),
      'persuasion',jsonb_build_object('principles',jsonb_build_array('contrast_choice','evidence_specificity','reciprocity_value_first'))
    ),
    'Bouw of verbeter de bestaande canonieke pagina rond dit concrete probleem. Vergelijk alternatieven eerlijk: zelf oplossen, bestaande tooling verbeteren, overstappen of Frisse Blik gebruiken. Geen verzonnen concurrentieclaims.',
    'suggested',v_now
  from patterns p
  on conflict(dedupe_key) do update set priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,message_draft=excluded.message_draft,updated_at=v_now;
  get diagnostics v_rows=row_count;
  v_actions:=v_actions+v_rows;

  -- 6) Data contribution flywheel: only after explicit consent recorded in scan payload.
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,company_key,action_type,channel,priority,reason,evidence,message_draft,status,due_at
  )
  select
    'growth-play:data-contribution:'||s.submission_key,
    'scan:'||s.submission_key,s.company_key,'benchmark_data_contribution_unlock','portal',86,
    'Explicit consent allows this scan to improve anonymized benchmark depth and unlock a richer comparison.',
    jsonb_build_object(
      'contract','powerhouse-growth-plays-v2','play_key','data-contribution-flywheel',
      'submission_key',s.submission_key,'branche',s.branche,
      'consent',true,'aggregate_only',true,'minimum_public_group_size',5,
      'persuasion',jsonb_build_object('principles',jsonb_build_array('reciprocity_value_first','social_proof_verified','commitment_micro_step'))
    ),
    'Bedankt. Jouw geanonimiseerde bijdrage helpt de benchmark beter te maken. Zodra de groep groot genoeg is, krijg je toegang tot de diepere vergelijking.',
    'suggested',v_now
  from public.scan_inzendingen s
  where s.submission_key is not null
    and lower(coalesce(s.payload->>'benchmark_consent','')) in ('true','1','yes','ja')
  on conflict(dedupe_key) do nothing;
  get diagnostics v_rows=row_count;
  v_actions:=v_actions+v_rows;

  -- 7) Risk reversal: only for high-fit evidence-backed opportunities; bounded, conditional, never a blanket guarantee.
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,
    message_draft,status,due_at,expected_value_eur,person_name,company_name,role
  )
  select
    'growth-play:risk-reversal:'||md5(g.company_key)||':'||p_run_date::text,
    'company:'||g.company_key,g.best_person_key,g.company_key,'conditional_risk_reversal','email',
    round(82+16*g.swarm_score,2),
    'High-fit opportunity: reduce decision risk with a bounded evidence condition, never an unconditional guarantee.',
    g.evidence||jsonb_build_object(
      'contract','powerhouse-growth-plays-v2','play_key','risk-reversal',
      'persuasion',public.powerhouse_persuasion_revenue_optimizer_v1(g.company_key,'risk-reversal','email','decision'),
      'risk_reversal_contract',jsonb_build_object(
        'conditional',true,
        'condition','The paid scan must surface at least three concrete evidence-backed improvement levers or explicitly conclude that no paid follow-on is justified.',
        'unconditional_money_back_claim',false,
        'manual_contract_review_required_before_financial_guarantee',true
      )
    ),
    'Ik wil het aankooprisico klein houden. Daarom spreken we vooraf af wat de scan minimaal moet opleveren: drie concrete, evidence-backed hefbomen óf de expliciete conclusie dat een vervolgtraject niet gerechtvaardigd is. Daarna beslis jij zelf.',
    'suggested',v_now,greatest(g.expected_value_eur,2900),g.best_person_name,g.company_name,g.best_person_role
  from public.powerhouse_growth_swarm_accounts_v1 g
  where g.best_person_key is not null
    and g.swarm_score>=.60
    and (g.expected_value_eur>=2900 or g.expected_revenue_eur>=2900)
    and not exists(
      select 1 from public.powerhouse_sales_actions a
      where a.company_key=g.company_key and a.action_type='conditional_risk_reversal'
        and a.created_at>=v_now-interval '45 days'
    )
  order by g.swarm_score desc,g.expected_revenue_eur desc
  limit 5
  on conflict(dedupe_key) do nothing;
  get diagnostics v_rows=row_count;
  v_actions:=v_actions+v_rows;

  -- Persist persuasion decision for every current top-ranked account/action path.
  insert into public.powerhouse_persuasion_decisions_v1(
    dedupe_key,run_date,subject_key,company_key,person_key,play_key,funnel_stage,channel,
    principles,primary_message_strategy,micro_cta,do_not_use,evidence,confidence,status
  )
  select
    'persuasion:'||p_run_date::text||':'||md5(g.company_key)||':'||md5(coalesce(g.next_best_action,'research')),
    p_run_date,'company:'||g.company_key,g.company_key,g.best_person_key,
    case
      when g.next_best_action='ma_knowledge_execution_risk_brief' then 'ma-knowledge-risk'
      when g.next_best_action='prebuilt_prospect_dossier_and_direct_followup' then 'prebuilt-prospect-dossier'
      when g.next_best_action='dark_funnel_context_followup' then 'dark-funnel'
      when g.next_best_action='benchmark_friction_teardown' then 'mkb-friction-index'
      when g.next_best_action='lost_knowledge_value_hypothesis' then 'lost-knowledge-calculator'
      when g.next_best_action='relationship_nurture' then 'reverse-selling'
      else 'revenue-swarm'
    end,
    case when g.swarm_score>=.60 then 'decision' when g.swarm_score>=.45 then 'consideration' else 'awareness' end,
    coalesce(nullif(g.next_best_channel,''),'internal'),
    array(select jsonb_array_elements_text(public.powerhouse_persuasion_revenue_optimizer_v1(
      g.company_key,
      case
        when g.next_best_action='ma_knowledge_execution_risk_brief' then 'ma-knowledge-risk'
        when g.next_best_action='prebuilt_prospect_dossier_and_direct_followup' then 'prebuilt-prospect-dossier'
        when g.next_best_action='dark_funnel_context_followup' then 'dark-funnel'
        else 'revenue-swarm'
      end,
      coalesce(nullif(g.next_best_channel,''),'internal'),
      case when g.swarm_score>=.60 then 'decision' when g.swarm_score>=.45 then 'consideration' else 'awareness' end
    )->'principles')),
    public.powerhouse_persuasion_revenue_optimizer_v1(g.company_key,'revenue-swarm',coalesce(nullif(g.next_best_channel,''),'internal'),'consideration')->>'primary_message_strategy',
    public.powerhouse_persuasion_revenue_optimizer_v1(g.company_key,'revenue-swarm',coalesce(nullif(g.next_best_channel,''),'internal'),'consideration')->>'micro_cta',
    array(select jsonb_array_elements_text(public.powerhouse_persuasion_revenue_optimizer_v1(g.company_key,'revenue-swarm',coalesce(nullif(g.next_best_channel,''),'internal'),'consideration')->'do_not_use')),
    jsonb_build_object('swarm_score',g.swarm_score,'expected_value_eur',g.expected_value_eur,'expected_revenue_eur',g.expected_revenue_eur,'next_best_action',g.next_best_action),
    coalesce((public.powerhouse_persuasion_revenue_optimizer_v1(g.company_key,'revenue-swarm',coalesce(nullif(g.next_best_channel,''),'internal'),'consideration')->>'confidence')::numeric,.5),
    'active'
  from public.powerhouse_growth_swarm_accounts_v1 g
  where g.swarm_score>=.35
  on conflict(dedupe_key) do update set
    principles=excluded.principles,primary_message_strategy=excluded.primary_message_strategy,
    micro_cta=excluded.micro_cta,do_not_use=excluded.do_not_use,evidence=excluded.evidence,
    confidence=excluded.confidence,updated_at=v_now;
  get diagnostics v_decisions=row_count;

  -- Capability readiness: all twenty plays now have a canonical trigger -> action/surface -> metric path.
  update public.powerhouse_growth_play_catalog_v1
  set readiness='ACTIVE',
      evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object(
        'activation_contract','powerhouse-growth-plays-v2',
        'persuasion_optimizer','powerhouse-persuasion-revenue-optimizer-v1',
        'activated_at',v_now,
        'capability_active',true,
        'execution_truth','ACTIVE means executable when evidence gates pass; it does not mean eligible evidence exists today.'
      ),
      updated_at=v_now
  where play_key in (
    'mkb-friction-index','positive-public-teardown','anti-consultancy-challenge',
    'boardroom-fear-of-blindness','competitor-switch-pages','data-contribution-flywheel','risk-reversal'
  );

  -- Experiment policy: persuasion is measured, not assumed.
  insert into public.powerhouse_experiment_policies(
    experiment_key,experiment_class,policy_version,status,treatment_pct,measurement_horizon_hours,
    min_matured_per_arm,primary_metric,segmentation,guardrails,evidence,effective_from
  ) values (
    'persuasion-revenue-optimizer-v1',
    'revenue_message_strategy','v1','active',50,336,20,'realized_revenue',
    '{"segments":["play_key","channel","funnel_stage"]}'::jsonb,
    '{"no_sensitive_profiling":true,"no_fake_scarcity":true,"no_fake_social_proof":true,"no_deceptive_dark_patterns":true,"winner_requires_measurement_floor":true}'::jsonb,
    '{"contract":"powerhouse-persuasion-revenue-optimizer-v1","secondary_metrics":["reply","meeting","scan","paid_order"]}'::jsonb,
    v_now
  )
  on conflict(experiment_key) do update set
    status='active',policy_version='v1',primary_metric='realized_revenue',
    segmentation=excluded.segmentation,guardrails=excluded.guardrails,evidence=excluded.evidence,
    updated_at=v_now;

  return jsonb_build_object(
    'contract','powerhouse-growth-plays-v2',
    'content_recommendations_touched',v_content,
    'sales_actions_touched',v_actions,
    'persuasion_decisions_touched',v_decisions,
    'active_plays',(select count(*) from public.powerhouse_growth_play_catalog_v1 where readiness='ACTIVE'),
    'catalog_plays',(select count(*) from public.powerhouse_growth_play_catalog_v1),
    'persuasion_principles',(select count(*) from public.powerhouse_persuasion_principles_v1),
    'executed_at',v_now
  );
end;
$$;

revoke execute on function public.powerhouse_activate_all_growth_plays_v2(date) from public,anon,authenticated;
grant execute on function public.powerhouse_activate_all_growth_plays_v2(date) to service_role;

-- Wire the optimizer into the one canonical commercial cycle.
create or replace function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_relationship jsonb;
  v_existing_research jsonb;
  v_public_research_dispatch jsonb;
  v_trigger jsonb;
  v_growth_swarm jsonb;
  v_growth_activation jsonb;
  v_growth_plays_v2 jsonb;
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
  v_growth_plays_v2:=public.powerhouse_activate_all_growth_plays_v2(p_run_date);
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
    'growth_plays_v2',v_growth_plays_v2,
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

comment on function public.powerhouse_persuasion_revenue_optimizer_v1(text,text,text,text) is
'Revenue-message optimizer based on business-stage evidence, not sensitive psychographic profiling. Outputs ethical persuasion principles and truth guardrails.';
comment on function public.powerhouse_activate_all_growth_plays_v2(date) is
'Completes the seven formerly ARMED/READY Growth Swarm plays and persists persuasion decision guidance into the canonical commercial cycle.';


-- Powerhouse Growth Play Action Executor v1
-- Converts persuasion decisions and Growth Swarm play actions into existing canonical executors.

create or replace function public.powerhouse_execute_growth_play_actions_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_now timestamptz:=now();
  v_email int:=0;
  v_content int:=0;
  v_referral int:=0;
begin
  -- Convert qualified commercial play actions into the already-proven autonomous-email executor.
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,
    message_draft,source_url,status,due_at,expected_value_eur,person_name,company_name,role
  )
  select
    'growth-executor-email:'||a.action_id::text,
    a.subject_key,a.person_key,a.company_key,'autonomous_email','email',a.priority,
    'Growth play executor routed an evidence-backed play through the canonical autonomous email transport.',
    coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
      'contract','powerhouse-growth-play-action-executor-v1',
      'source_action_id',a.action_id,
      'source_action_type',a.action_type,
      'recipient_email',r.email,
      'email_subject',
        case a.action_type
          when 'anti_consultancy_challenge' then coalesce(nullif(a.company_name,''),'Even sparren')||': eerst drie observaties'
          when 'conditional_risk_reversal' then coalesce(nullif(a.company_name,''),'Frisse Blik')||': eerst de uitkomstcriteria scherp'
          when 'referral_activation' then 'Mag ik je één specifieke vraag stellen?'
          else coalesce(nullif(a.company_name,''),'Bedrijfsgeheugen')||': een concrete observatie'
        end,
      'authorization','user_authorized_autonomous_growth_execution_2026-09-28',
      'persuasion_optimizer',coalesce(a.evidence->'persuasion','{}'::jsonb),
      'guardrails',jsonb_build_object(
        'canonical_email_executor',true,
        'suppression_required',true,
        'cooldown_required',true,
        'provider_ack_required',true,
        'duplicate_send_forbidden',true
      )
    ),
    a.message_draft,a.source_url,'prepared',v_now,a.expected_value_eur,
    a.person_name,a.company_name,a.role
  from public.powerhouse_sales_actions a
  join public.powerhouse_relationship_revenue_intelligence_v1 r on r.person_key=a.person_key
  where a.status='suggested'
    and a.channel in ('email','internal')
    and a.action_type in ('anti_consultancy_challenge','conditional_risk_reversal','referral_activation')
    and nullif(trim(r.email),'') is not null
    and r.relationship_status in ('in_gesprek','aangeboden','rust')
    and not exists(
      select 1 from public.powerhouse_sales_outcomes o
      where o.person_key=a.person_key
        and lower(coalesce(o.outcome_type,'')) in ('unsubscribe','opt_out','do_not_contact','complaint','negative_reply')
    )
    and not exists(
      select 1 from public.powerhouse_sales_actions sent
      where sent.person_key=a.person_key and sent.channel='email' and sent.status='done'
        and sent.executed_at>=v_now-interval '30 days'
    )
  on conflict(dedupe_key) do nothing;
  get diagnostics v_email=row_count;

  -- A routed source action becomes waiting: the canonical outbound action is now its executor owner.
  update public.powerhouse_sales_actions a
  set status='waiting',
      evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'executor_owner','autonomous_email',
        'executor_routed_at',v_now
      ),
      updated_at=v_now
  where a.status='suggested'
    and a.action_type in ('anti_consultancy_challenge','conditional_risk_reversal','referral_activation')
    and exists(
      select 1 from public.powerhouse_sales_actions e
      where e.dedupe_key='growth-executor-email:'||a.action_id::text
    );

  -- Route problem/switch-page work into the existing content/SEO publication intelligence.
  insert into public.powerhouse_content_recommendations(
    dedupe_key,run_date,topic_key,target_channel,recommendation_type,priority,reason,evidence,status
  )
  select
    'growth-executor-seo:'||a.action_id::text,
    p_run_date,
    coalesce(nullif(a.subject_key,''),'growth-seo'),
    'blog',
    'seo_problem_switch_page',
    a.priority,
    'Create a canonical problem-led search landing article/page from the Growth Swarm SEO action. Existing URL ownership and cannibalization must be checked before publishing.',
    coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
      'contract','powerhouse-growth-play-action-executor-v1',
      'source_action_id',a.action_id,
      'execution_target','content_orchestrator_then_blog_publication',
      'persuasion',jsonb_build_object(
        'principles',jsonb_build_array('evidence_specificity','contrast_choice','reciprocity_value_first','autonomy_reverse_sell'),
        'must_show_options',jsonb_build_array('self_fix','improve_existing','switch','frisse_blik'),
        'fake_competitor_claims_forbidden',true
      )
    ),
    'suggested'
  from public.powerhouse_sales_actions a
  where a.status='suggested'
    and a.action_type='seo_problem_switch_page'
  on conflict(dedupe_key) do update set
    priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,updated_at=v_now;
  get diagnostics v_content=row_count;

  update public.powerhouse_sales_actions a
  set status='waiting',
      evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'executor_owner','powerhouse-content-orchestrator',
        'executor_routed_at',v_now
      ),
      updated_at=v_now
  where a.status='suggested'
    and a.action_type='seo_problem_switch_page'
    and exists(
      select 1 from public.powerhouse_content_recommendations c
      where c.dedupe_key='growth-executor-seo:'||a.action_id::text
    );

  -- Referral actions receive an explicit micro-message when enough context exists.
  update public.powerhouse_sales_actions a
  set message_draft=
      'Hoi '||coalesce(nullif(split_part(trim(a.person_name),' ',1),''),'daar')||','||chr(10)||chr(10)
      ||'Fijn dat dit je iets heeft opgeleverd. Eén gerichte vraag: welke ondernemer of directie in jouw netwerk loopt volgens jou tegen precies hetzelfde probleem aan?'||chr(10)||chr(10)
      ||'Als iemand meteen in je opkomt, maak ik een kort bericht dat je één-op-één kunt doorsturen. Geen referralprogramma en geen gedoe.'||chr(10)||chr(10)
      ||'Groet,'||chr(10)||'Arthur',
      evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'persuasion',jsonb_build_object(
          'principles',jsonb_build_array('reciprocity_value_first','commitment_micro_step','autonomy_reverse_sell'),
          'generic_referral_program',false
        )
      ),
      updated_at=v_now
  where a.action_type='referral_activation'
    and a.status='suggested'
    and nullif(trim(a.message_draft),'') is null;
  get diagnostics v_referral=row_count;

  return jsonb_build_object(
    'contract','powerhouse-growth-play-action-executor-v1',
    'email_actions_routed',v_email,
    'content_actions_routed',v_content,
    'referral_messages_completed',v_referral,
    'executed_at',v_now
  );
end;
$$;

revoke execute on function public.powerhouse_execute_growth_play_actions_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_execute_growth_play_actions_v1(date) to service_role;

create or replace function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_relationship jsonb;
  v_existing_research jsonb;
  v_public_research_dispatch jsonb;
  v_trigger jsonb;
  v_growth_swarm jsonb;
  v_growth_activation jsonb;
  v_growth_plays_v2 jsonb;
  v_growth_executor jsonb;
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
  v_growth_plays_v2:=public.powerhouse_activate_all_growth_plays_v2(p_run_date);
  v_growth_executor:=public.powerhouse_execute_growth_play_actions_v1(p_run_date);
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
    'growth_plays_v2',v_growth_plays_v2,
    'growth_play_executor',v_growth_executor,
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




-- Final canonical cycle repair: preserve the existing Persuasion Revenue Optimizer from main
-- and insert 20/20 Growth Play activation + executor before provider execution.
create or replace function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_relationship jsonb;
  v_existing_research jsonb;
  v_public_research_dispatch jsonb;
  v_trigger jsonb;
  v_growth_swarm jsonb;
  v_growth_activation jsonb;
  v_growth_plays_v2 jsonb;
  v_growth_executor jsonb;
  v_linkedin_sales_dispatch jsonb;
  v_outreach_prepare jsonb;
  v_persuasion jsonb;
  v_outreach_dispatch jsonb;
  v_learning jsonb;
begin
  v_relationship:=public.powerhouse_refresh_relationship_revenue_v1(p_run_date);
  v_existing_research:=public.powerhouse_execute_relationship_research_v1(p_run_date);
  v_public_research_dispatch:=public.powerhouse_dispatch_relationship_public_research_v1(p_run_date);
  v_trigger:=public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(p_run_date);
  v_growth_swarm:=public.powerhouse_refresh_growth_swarm_v1(p_run_date);
  v_growth_activation:=public.powerhouse_materialize_growth_swarm_v1(p_run_date);
  v_growth_plays_v2:=public.powerhouse_activate_all_growth_plays_v2(p_run_date);
  v_growth_executor:=public.powerhouse_execute_growth_play_actions_v1(p_run_date);
  v_linkedin_sales_dispatch:=public.powerhouse_dispatch_linkedin_sales_machine_v1(p_run_date);
  v_outreach_prepare:=public.powerhouse_prepare_autonomous_outreach_v1(p_run_date);
  v_persuasion:=public.powerhouse_optimize_prepared_outreach_v1(p_run_date);
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
    'growth_plays_v2',v_growth_plays_v2,
    'growth_play_executor',v_growth_executor,
    'linkedin_sales_dispatch',v_linkedin_sales_dispatch,
    'autonomous_outreach_prepare',v_outreach_prepare,
    'persuasion_optimizer',v_persuasion,
    'autonomous_outreach_dispatch',v_outreach_dispatch,
    'commercial_learning',v_learning,
    'run_date',p_run_date,
    'executed_at',now()
  );
end;
$$;

revoke execute on function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date) to service_role;

