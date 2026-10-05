-- Powerhouse Persuasion Revenue Optimizer v1
-- Revenue-safe persuasion selection and give/get optimization on top of canonical Growth Swarm.

create table if not exists public.powerhouse_persuasion_play_catalog_v1 (
  strategy_key text primary key,
  name text not null,
  principle text not null,
  best_for_roles text[] not null default '{}'::text[],
  best_for_stages text[] not null default '{}'::text[],
  default_asset text,
  default_cta text,
  guardrails jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.powerhouse_persuasion_play_catalog_v1 enable row level security;
revoke all on public.powerhouse_persuasion_play_catalog_v1 from public, anon, authenticated;
grant select,insert,update,delete on public.powerhouse_persuasion_play_catalog_v1 to service_role;

insert into public.powerhouse_persuasion_play_catalog_v1(strategy_key,name,principle,best_for_roles,best_for_stages,default_asset,default_cta,guardrails) values
('reciprocity_value_first','Value First','reciprocity',array['ceo','owner','director','manager'],array['cold','warm','consideration'],'three_levers','send_two_observations','{"value_before_ask":true,"no_fake_gift":true}'::jsonb),
('authority_evidence','Evidence-led Authority','authority',array['cio','cto','data','it','technology'],array['cold','consideration'],'evidence_teardown','send_short_dossier','{"claims_require_evidence":true}'::jsonb),
('social_proof_peer','Relevant Peer Proof','social_proof',array['ceo','cfo','coo','owner'],array['consideration'],'peer_benchmark','show_relevant_pattern','{"no_fake_customer_claims":true,"aggregate_only":true}'::jsonb),
('loss_aversion','Cost of Inaction','loss_aversion',array['cfo','finance','coo','operations','hr'],array['consideration','decision'],'lost_knowledge_or_friction_case','quantify_one_risk','{"estimate_labels_required":true,"no_fearmongering":true}'::jsonb),
('commitment_microstep','Small Next Step','commitment_consistency',array['ceo','owner','manager'],array['warm','consideration'],'mini_benchmark','answer_one_question','{"low_friction_only":true}'::jsonb),
('contrast_before_after','Contrast the Operating Model','contrast',array['ceo','coo','director'],array['consideration','decision'],'board_one_pager','compare_current_vs_possible','{"no_exaggerated_before_after":true}'::jsonb),
('curiosity_gap','Evidence-backed Curiosity','curiosity',array['ceo','owner','director'],array['cold','warm'],'two_observations','offer_missing_third_observation','{"must_hold_real_evidence":true,"no_clickbait":true}'::jsonb),
('reverse_sell','Not Yet / Not For Everyone','reactance_reduction',array['ceo','owner','cfo'],array['low_fit','objection'],'internal_actions','say_when_not_to_buy','{"truth_first":true,"no_manipulated_scarcity":true}'::jsonb)
on conflict(strategy_key) do update set
  name=excluded.name, principle=excluded.principle, best_for_roles=excluded.best_for_roles,
  best_for_stages=excluded.best_for_stages, default_asset=excluded.default_asset,
  default_cta=excluded.default_cta, guardrails=excluded.guardrails, updated_at=now();

create or replace view public.powerhouse_persuasion_strategy_performance_v1
with (security_invoker=true) as
select
  coalesce(nullif(a.evidence->>'persuasion_strategy',''),'unclassified') persuasion_strategy,
  a.channel,
  count(*) filter(where a.status='done')::int executed_actions,
  count(o.outcome_id)::int observed_outcomes,
  count(o.outcome_id) filter(where lower(coalesce(o.outcome_type,'')) in
    ('reply','positive_reply','meeting','scan','proposal','won','paid_order'))::int positive_outcomes,
  coalesce(sum(o.revenue_eur),0)::numeric realized_revenue_eur,
  case when count(*) filter(where a.status='done')>0 then round(
    count(o.outcome_id) filter(where lower(coalesce(o.outcome_type,'')) in
      ('reply','positive_reply','meeting','scan','proposal','won','paid_order'))::numeric
    / count(*) filter(where a.status='done'),4) else 0 end positive_outcome_rate
from public.powerhouse_sales_actions a
left join public.powerhouse_sales_outcomes o on o.action_id=a.action_id
group by 1,2;
revoke all on public.powerhouse_persuasion_strategy_performance_v1 from public,anon,authenticated;
grant select on public.powerhouse_persuasion_strategy_performance_v1 to service_role;

create or replace view public.powerhouse_persuasion_next_best_action_v1
with (security_invoker=true) as
select
  g.company_key,g.company_name,g.best_person_key,g.best_person_name,g.best_person_role,
  g.swarm_score,g.relationship_score,g.trigger_score,g.dark_funnel_score,g.friction_score,
  g.knowledge_risk_score,g.expected_value_eur,g.expected_revenue_eur,
  case
    when g.swarm_score < .30 then 'reverse_sell'
    when lower(coalesce(g.best_person_role,'')) ~ '(cfo|finance|financial|controller|coo|operations|hr|people)'
      and greatest(g.friction_score,g.knowledge_risk_score)>=.40 then 'loss_aversion'
    when lower(coalesce(g.best_person_role,'')) ~ '(cio|cto|data|technology|it|digital)' then 'authority_evidence'
    when g.relationship_score>=.65 then 'commitment_microstep'
    when g.dark_funnel_score>=.45 then 'curiosity_gap'
    when g.expected_revenue_eur>=10000 or g.expected_value_eur>=5000 then 'contrast_before_after'
    else 'reciprocity_value_first'
  end persuasion_strategy,
  case
    when g.swarm_score < .30 then 'internal_actions'
    when lower(coalesce(g.best_person_role,'')) ~ '(cfo|finance|financial|controller|coo|operations|hr|people)'
      and g.knowledge_risk_score>=g.friction_score then 'lost_knowledge_case'
    when lower(coalesce(g.best_person_role,'')) ~ '(cfo|finance|financial|controller|coo|operations)' then 'friction_business_case'
    when lower(coalesce(g.best_person_role,'')) ~ '(cio|cto|data|technology|it|digital)' then 'evidence_teardown'
    when g.relationship_score>=.65 then 'mini_benchmark'
    when g.dark_funnel_score>=.45 then 'two_observations'
    when g.expected_revenue_eur>=10000 or g.expected_value_eur>=5000 then 'board_one_pager'
    else 'three_levers'
  end give_asset,
  case
    when g.swarm_score < .30 then 'no_external_ask'
    when g.relationship_score>=.65 then 'answer_one_question'
    when g.dark_funnel_score>=.45 then 'offer_two_observations'
    else 'offer_useful_one_pager'
  end get_ask,
  case
    when g.next_best_channel in ('linkedin_or_email','email','partner_or_email') then 'email'
    else g.next_best_channel
  end preferred_channel,
  g.play_keys,g.evidence
from public.powerhouse_growth_swarm_accounts_v1 g;
revoke all on public.powerhouse_persuasion_next_best_action_v1 from public,anon,authenticated;
grant select on public.powerhouse_persuasion_next_best_action_v1 to service_role;

create or replace function public.powerhouse_optimize_prepared_outreach_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz:=now();
  v_email integer:=0;
  v_linkedin integer:=0;
begin
  update public.powerhouse_sales_actions a
  set evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'persuasion_contract','powerhouse-persuasion-revenue-optimizer-v1',
        'persuasion_strategy',p.persuasion_strategy,'give_asset',p.give_asset,'get_ask',p.get_ask,
        'optimization_rule','value_before_ask_and_measure_against_outcome',
        'truth_boundary','Persuasion selects framing, never fabricates evidence, urgency, scarcity, social proof or financial impact.'
      ),
      message_draft=
        'Hoi '||coalesce(nullif(split_part(trim(a.person_name),' ',1),''),'daar')||','||chr(10)||chr(10)||
        case p.persuasion_strategy
          when 'loss_aversion' then 'Ik zag een ontwikkeling bij '||coalesce(nullif(a.company_name,''),'jullie organisatie')||' die mogelijk raakt aan kennisverlies, frictie of stuurinformatie. Ik kan eerst één risico en de aannames erachter concreet voor je uitwerken.'
          when 'authority_evidence' then 'Ik heb de publieke signalen rond '||coalesce(nullif(a.company_name,''),'jullie organisatie')||' naast onze patronen voor data, processen en AI gelegd. Er springen twee punten uit die ik met bron en redenering kan onderbouwen.'
          when 'commitment_microstep' then 'Omdat we elkaar al kennen wil ik het klein houden. Ik kan '||coalesce(nullif(a.company_name,''),'jullie organisatie')||' eerst langs één korte benchmark leggen; je hoeft daarvoor alleen één vraag te beantwoorden.'
          when 'curiosity_gap' then 'Ik heb twee concrete observaties over '||coalesce(nullif(a.company_name,''),'jullie organisatie')||' die samen een opvallend patroon geven. Ik stuur ze liever eerst op dan meteen om tijd in de agenda te vragen.'
          when 'contrast_before_after' then 'Ik heb een korte voor/na-schets gemaakt van wat er bestuurlijk verandert als kennis, processen en stuurinformatie beter samenkomen. Voor '||coalesce(nullif(a.company_name,''),'jullie organisatie')||' kan ik dat in één MT-pagina zetten.'
          when 'reverse_sell' then 'Op basis van wat ik nu zie zou ik nog niets kopen. Ik kan je wel de twee interne acties sturen die ik eerst zou doen; daarna kun je beter bepalen of externe hulp überhaupt nodig is.'
          else 'Ik zag dat er bij '||coalesce(nullif(a.company_name,''),'jullie organisatie')||' iets speelt rond '||replace(coalesce(a.evidence->>'trigger_type','een relevante ontwikkeling'),'_',' ')||'. Ik kan je eerst drie concrete hefbomen sturen die je zelf kunt beoordelen, zonder afspraak of verkooppraat.'
        end||chr(10)||chr(10)||
        case p.get_ask
          when 'answer_one_question' then 'Als je wilt, stuur ik die ene vraag hier direct terug.'
          when 'offer_two_observations' then 'Zal ik die twee observaties sturen?'
          when 'no_external_ask' then 'Als dit later relevant wordt, weet je me te vinden.'
          else 'Zal ik die korte 1-pager sturen?'
        end||chr(10)||chr(10)||'Groet,'||chr(10)||'Arthur'||chr(10)||'Bedrijfsgeheugen.nl'||chr(10)||chr(10)||
        'PS Als dit nu niet relevant is, laat het gerust weten; dan stuur ik je hierover niet opnieuw.',
      updated_at=v_now
  from public.powerhouse_persuasion_next_best_action_v1 p
  where a.person_key=p.best_person_key and a.action_type='autonomous_email' and a.channel='email'
    and a.status='prepared' and a.due_at<=v_now and a.created_at>=v_now-interval '24 hours';
  get diagnostics v_email=row_count;

  update public.powerhouse_sales_actions a
  set evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'persuasion_contract','powerhouse-persuasion-revenue-optimizer-v1',
        'persuasion_strategy','reciprocity_value_first','give_asset','useful_public_comment','get_ask','none',
        'optimization_rule','add_real_value_publicly_before_any_private_ask',
        'truth_boundary','No sales pitch, fake praise, fabricated fact or appointment CTA in public comments.'
      ),updated_at=v_now
  where a.action_type='reply_post' and a.channel='linkedin_personal'
    and a.status in ('prepared','suggested') and a.created_at>=v_now-interval '24 hours';
  get diagnostics v_linkedin=row_count;

  return jsonb_build_object(
    'contract','powerhouse-persuasion-revenue-optimizer-v1','run_date',p_run_date,
    'email_actions_optimized',v_email,'linkedin_actions_tagged',v_linkedin,
    'strategy_performance_rows',(select count(*) from public.powerhouse_persuasion_strategy_performance_v1),
    'catalog_strategies',(select count(*) from public.powerhouse_persuasion_play_catalog_v1),'executed_at',v_now
  );
end;
$$;
revoke execute on function public.powerhouse_optimize_prepared_outreach_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_optimize_prepared_outreach_v1(date) to service_role;



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
