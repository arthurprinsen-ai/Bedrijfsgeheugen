-- Powerhouse Commercial Learning & Revenue Optimization v1
-- Reuse-first: no parallel CRM, outcome, experiment, forecast, content or learning store.

create or replace view public.powerhouse_buying_committee_v1
with (security_invoker=true) as
select
  p.company_key_normalized as company_key,
  p.person_key,
  p.person_name,
  p.role,
  p.relationship_status,
  p.relationship_warmth,
  p.decision_influence,
  p.available_channels,
  p.last_relevant_at,
  case
    when lower(coalesce(p.role,'')) ~ '(ceo|chief executive|directeur|owner|eigenaar|managing director|algemeen directeur)' then 'economic_buyer'
    when lower(coalesce(p.role,'')) ~ '(cfo|finance|financieel|procurement|inkoop)' then 'economic_buyer_or_blocker'
    when lower(coalesce(p.role,'')) ~ '(cto|cio|it director|technology|architect|data|digital)' then 'technical_evaluator'
    when lower(coalesce(p.role,'')) ~ '(manager|head|lead|product owner|transformation)' then 'champion_or_influencer'
    else 'influencer_or_unknown'
  end as inferred_buying_role,
  least(1,greatest(0,0.55*coalesce(p.decision_influence,0)+0.45*coalesce(p.relationship_warmth,0))) as committee_priority
from public.powerhouse_person_intelligence_v1 p
where p.company_key_normalized is not null;

revoke all on public.powerhouse_buying_committee_v1 from public, anon, authenticated;
grant select on public.powerhouse_buying_committee_v1 to service_role;

create or replace view public.powerhouse_portfolio_allocator_v1
with (security_invoker=true) as
with forecast_value as (
  select o.opportunity_key,
         max(coalesce(f.revenue_potential,0)*coalesce(f.probability,0)*coalesce(f.confidence,0)) as forecast_modeled_value,
         max(coalesce(f.confidence,0)) as forecast_confidence
  from public.powerhouse_opportunities o
  left join public.powerhouse_forecasts f
    on f.status in ('active','claimed')
   and ((o.company_key is not null and f.scope_key=o.company_key)
     or (o.topic_key is not null and f.topic_key=o.topic_key))
  where o.status='open'
  group by o.opportunity_key
), committee as (
  select company_key,
         max(committee_priority) as committee_strength,
         count(*) filter (where inferred_buying_role in ('economic_buyer','economic_buyer_or_blocker')) as economic_buyers,
         count(*) filter (where inferred_buying_role='technical_evaluator') as technical_evaluators,
         count(*) filter (where inferred_buying_role='champion_or_influencer') as champions
  from public.powerhouse_buying_committee_v1
  group by company_key
)
select
  o.opportunity_key,o.company_key,o.person_key,o.topic_key,o.stage,
  o.expected_value_eur as observed_or_declared_value_eur,
  coalesce(o.expected_revenue_value,0) as current_modeled_value_eur,
  coalesce(fv.forecast_modeled_value,0) as forecast_modeled_value_eur,
  greatest(coalesce(o.expected_revenue_value,0),coalesce(fv.forecast_modeled_value,0)) as allocatable_modeled_value_eur,
  o.probability,o.confidence,
  coalesce(ci.company_intent_score,0) as company_intent_score,
  coalesce(c.committee_strength,0) as committee_strength,
  coalesce(c.economic_buyers,0) as economic_buyers,
  coalesce(c.technical_evaluators,0) as technical_evaluators,
  coalesce(c.champions,0) as champions,
  least(1,greatest(0,
    0.30*coalesce(o.probability,0)+
    0.20*coalesce(o.confidence,0)+
    0.20*coalesce(ci.company_intent_score,0)+
    0.15*coalesce(c.committee_strength,0)+
    0.15*coalesce(fv.forecast_confidence,0)
  )) as allocation_confidence,
  greatest(coalesce(o.expected_revenue_value,0),coalesce(fv.forecast_modeled_value,0)) *
    least(1,greatest(0,
      0.30*coalesce(o.probability,0)+0.20*coalesce(o.confidence,0)+
      0.20*coalesce(ci.company_intent_score,0)+0.15*coalesce(c.committee_strength,0)+
      0.15*coalesce(fv.forecast_confidence,0)
    )) as portfolio_score_eur,
  o.last_evidence_at,o.updated_at
from public.powerhouse_opportunities o
left join forecast_value fv on fv.opportunity_key=o.opportunity_key
left join public.powerhouse_company_intelligence_v1 ci on ci.company_key=o.company_key
left join committee c on c.company_key=o.company_key
where o.status='open';

revoke all on public.powerhouse_portfolio_allocator_v1 from public, anon, authenticated;
grant select on public.powerhouse_portfolio_allocator_v1 to service_role;

create or replace view public.powerhouse_offer_pricing_learning_v1
with (security_invoker=true) as
with offers as (
  select lower(trim(coalesce(titel,'unknown'))) as offer_key,
         totaal::numeric as amount_eur,
         getekend as won,
         aangemaakt as observed_at,
         'offerte_inzendingen'::text as source
  from public.offerte_inzendingen
  union all
  select lower(trim(coalesce(titel,'unknown'))) as offer_key,
         bedrag::numeric as amount_eur,
         (akkoord_op is not null or lower(coalesce(status,'')) in ('akkoord','accepted','won','getekend')) as won,
         aangemaakt_op as observed_at,
         'offertes'::text as source
  from public.offertes
)
select offer_key,
       count(*) as offers_observed,
       count(*) filter(where won) as offers_won,
       round(avg(amount_eur),2) as avg_offer_eur,
       round(avg(amount_eur) filter(where won),2) as avg_won_offer_eur,
       round((count(*) filter(where won))::numeric/nullif(count(*),0),4) as observed_win_rate,
       max(observed_at) as last_observed_at,
       jsonb_agg(jsonb_build_object('source',source,'amount_eur',amount_eur,'won',won,'observed_at',observed_at) order by observed_at desc) as evidence
from offers
group by offer_key;

revoke all on public.powerhouse_offer_pricing_learning_v1 from public, anon, authenticated;
grant select on public.powerhouse_offer_pricing_learning_v1 to service_role;

create or replace view public.powerhouse_creative_commercial_learning_v1
with (security_invoker=true) as
select
  k.hook_type,k.format,k.narrative_type,k.emotion,k.cta_type,k.persona,k.pain_trigger,
  k.fomo_trigger,k.comedy_device,k.proof_type,k.offer_type,k.awareness_stage,k.behavioral_lever,
  count(distinct k.post_key) as posts,
  count(o.outcome_id) as commercial_outcomes,
  coalesce(sum(o.revenue_eur),0) as realized_revenue_eur,
  count(o.outcome_id) filter(where lower(coalesce(o.outcome_type,'')) in ('meeting','proposal','won','order','sale','revenue')) as high_intent_outcomes,
  max(o.occurred_at) as last_commercial_outcome_at
from public.bg_post_kenmerken k
left join public.powerhouse_sales_outcomes o on o.content_key=k.post_key
group by k.hook_type,k.format,k.narrative_type,k.emotion,k.cta_type,k.persona,k.pain_trigger,
  k.fomo_trigger,k.comedy_device,k.proof_type,k.offer_type,k.awareness_stage,k.behavioral_lever;

revoke all on public.powerhouse_creative_commercial_learning_v1 from public, anon, authenticated;
grant select on public.powerhouse_creative_commercial_learning_v1 to service_role;

create or replace view public.powerhouse_champion_challenger_v1
with (security_invoker=true) as
with ranked as (
 select l.*,
   coalesce(l.confidence,0)*ln(2+greatest(coalesce(l.sample_size,0),0)) as evidence_score,
   row_number() over(partition by coalesce(l.scope,''),coalesce(l.topic_key,''),coalesce(l.channel,'')
                     order by coalesce(l.confidence,0)*ln(2+greatest(coalesce(l.sample_size,0),0)) desc,l.updated_at desc) as rn
 from public.powerhouse_sales_learnings l
 where l.status in ('active','proven')
)
select scope,topic_key,channel,
       max(fingerprint) filter(where rn=1) as champion_fingerprint,
       max(confidence) filter(where rn=1) as champion_confidence,
       max(sample_size) filter(where rn=1) as champion_sample_size,
       max(fingerprint) filter(where rn=2) as challenger_fingerprint,
       max(confidence) filter(where rn=2) as challenger_confidence,
       max(sample_size) filter(where rn=2) as challenger_sample_size
from ranked where rn<=2
group by scope,topic_key,channel;

revoke all on public.powerhouse_champion_challenger_v1 from public, anon, authenticated;
grant select on public.powerhouse_champion_challenger_v1 to service_role;

create or replace view public.powerhouse_commercial_maturity_v1
with (security_invoker=true) as
select
 now() as measured_at,
 (select count(*) from public.powerhouse_sales_outcomes) as outcome_count,
 (select count(*) from public.powerhouse_sales_outcomes where revenue_eur>0) as revenue_outcome_count,
 (select coalesce(sum(revenue_eur),0) from public.powerhouse_sales_outcomes) as realized_revenue_eur,
 (select count(*) from public.powerhouse_forecasts where status in ('active','claimed')) as active_forecasts,
 (select count(*) from public.powerhouse_forecast_calibration) as calibrations,
 (select count(*) from public.social_experiments where tenant_id='canonical' and status in ('ACTIVE','PLANNED')) as active_experiments,
 (select count(*) from public.social_experiments where tenant_id='canonical' and besluit is not null) as experiments_with_decision,
 (select count(*) from public.powerhouse_opportunities where status='open') as open_opportunities,
 (select count(*) from public.powerhouse_opportunities where status='open' and coalesce(expected_value_eur,0)>0) as opportunities_with_declared_economic_value,
 (select count(*) from public.powerhouse_portfolio_allocator_v1 where allocatable_modeled_value_eur>0) as opportunities_with_modeled_economic_value,
 (select count(distinct company_key) from public.powerhouse_buying_committee_v1 where inferred_buying_role in ('economic_buyer','economic_buyer_or_blocker')) as companies_with_economic_buyer,
 (select count(*) from public.powerhouse_offer_pricing_learning_v1) as offer_classes_with_pricing_evidence,
 (select count(*) from public.powerhouse_creative_commercial_learning_v1 where commercial_outcomes>0) as creative_patterns_with_commercial_evidence,
 (select count(*) from public.powerhouse_sales_learnings where status='proven') as proven_learnings;

revoke all on public.powerhouse_commercial_maturity_v1 from public, anon, authenticated;
grant select on public.powerhouse_commercial_maturity_v1 to service_role;

create or replace function public.powerhouse_commercial_learning_cycle_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_now timestamptz := now();
  v_gap jsonb;
  v_enriched int := 0;
  v_actions int := 0;
  v_exp_evaluated int := 0;
  v_maturity jsonb;
  v_result jsonb;
begin
  v_gap := public.powerhouse_autonomous_gap_closer_v1(p_run_date);

  update public.powerhouse_opportunities o
  set expected_revenue_value = greatest(
        coalesce(o.expected_revenue_value,0),
        coalesce(pa.forecast_modeled_value_eur,0)
      ),
      score_components = coalesce(o.score_components,'{}'::jsonb) || jsonb_build_object(
        'commercial_learning_v1',jsonb_build_object(
          'modeled_value_eur',pa.allocatable_modeled_value_eur,
          'portfolio_score_eur',pa.portfolio_score_eur,
          'allocation_confidence',pa.allocation_confidence,
          'economic_buyers',pa.economic_buyers,
          'technical_evaluators',pa.technical_evaluators,
          'champions',pa.champions,
          'truth_boundary','modeled expected value is not realized revenue and does not overwrite declared/observed expected_value_eur',
          'scored_at',v_now
        )
      ),
      updated_at=v_now
  from public.powerhouse_portfolio_allocator_v1 pa
  where pa.opportunity_key=o.opportunity_key;
  get diagnostics v_enriched=row_count;

  with ranked as (
    select pa.*, row_number() over(order by pa.portfolio_score_eur desc,pa.allocation_confidence desc,pa.updated_at desc) rn
    from public.powerhouse_portfolio_allocator_v1 pa
    where pa.portfolio_score_eur>0 and pa.allocation_confidence>=0.20
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,message_draft,status,due_at,
    topic_key,opportunity_key,expected_value_eur
  )
  select
    'commercial-learning:'||p_run_date::text||':'||r.opportunity_key,
    r.opportunity_key,r.person_key,r.company_key,
    coalesce(o.score_components#>>'{next_best_action,action}','research_enrichment'),
    coalesce(o.score_components#>>'{next_best_action,channel}','internal'),
    least(100,greatest(0,round(100*r.allocation_confidence,2))),
    'Portfolio-selected next-best-action from evidence-backed modeled economics, buying committee and company intent.',
    jsonb_build_object(
      'contract','powerhouse-commercial-learning-v1',
      'portfolio_score_eur',r.portfolio_score_eur,
      'modeled_value_eur',r.allocatable_modeled_value_eur,
      'allocation_confidence',r.allocation_confidence,
      'buying_committee',jsonb_build_object('economic_buyers',r.economic_buyers,'technical_evaluators',r.technical_evaluators,'champions',r.champions),
      'truth_boundary','existing execution eligibility, destination, identity, consent, dedupe, contact-pressure and provider-readback gates remain mandatory'
    ),'', 'suggested',v_now,r.topic_key,r.opportunity_key,r.allocatable_modeled_value_eur
  from ranked r
  join public.powerhouse_opportunities o on o.opportunity_key=r.opportunity_key
  where r.rn<=5
  on conflict(dedupe_key) do update
    set priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,expected_value_eur=excluded.expected_value_eur,updated_at=v_now;
  get diagnostics v_actions=row_count;

  with observed as (
    select e.experiment_id,
      count(distinct k.post_key) as observed_posts,
      count(o.outcome_id) as commercial_outcomes,
      coalesce(sum(o.revenue_eur),0) as revenue_eur
    from public.social_experiments e
    left join public.bg_post_kenmerken k on k.experiment_id=e.experiment_id
    left join public.powerhouse_sales_outcomes o on o.content_key=k.post_key
    where e.tenant_id='canonical'
    group by e.experiment_id
  )
  update public.social_experiments e
  set resultaat=coalesce(e.resultaat,'{}'::jsonb) || jsonb_build_object(
        'commercial_learning_v1',jsonb_build_object(
          'observed_posts',ob.observed_posts,
          'commercial_outcomes',ob.commercial_outcomes,
          'realized_revenue_eur',ob.revenue_eur,
          'evaluated_at',v_now,
          'truth_boundary','no promotion decision without minimum observed sample and commercial evidence'
        )
      ),
      advies=case
        when coalesce(ob.observed_posts,0) < greatest(1,coalesce(e.min_steekproef,1)) then 'CONTINUE_MEASURING'
        when ob.commercial_outcomes>0 or ob.revenue_eur>0 then 'COMMERCIAL_EVIDENCE_PRESENT_REVIEW_FOR_PROMOTION'
        else 'HOLD_NO_COMMERCIAL_EVIDENCE_YET'
      end,
      updated_at=v_now
  from observed ob
  where ob.experiment_id=e.experiment_id and e.status in ('ACTIVE','PLANNED');
  get diagnostics v_exp_evaluated=row_count;

  select to_jsonb(m) into v_maturity from public.powerhouse_commercial_maturity_v1 m;

  v_result := jsonb_build_object(
    'contract','powerhouse-commercial-learning-v1',
    'run_date',p_run_date,
    'executed_at',v_now,
    'healthy',coalesce((v_gap->>'healthy')::boolean,false),
    'opportunities_enriched',v_enriched,
    'portfolio_actions_touched',v_actions,
    'experiments_evaluated',v_exp_evaluated,
    'maturity',v_maturity,
    'capabilities',jsonb_build_array(
      'revenue_attribution','opportunity_economics','outcome_funnel','forecast_calibration','experiment_to_revenue',
      'champion_challenger','portfolio_allocation','buying_committee','delivery_sales_learning','pricing_offer_learning',
      'creative_commercial_learning','freshness_degradation'
    ),
    'truth_boundary','realized revenue only from observed outcomes; modeled economic value is explicitly labeled and never promoted to realized revenue'
  );

  insert into public.powerhouse_sales_learnings(
    fingerprint,subject_key,scope,hypothesis,evidence,effect,confidence,status,sample_size,expires_at
  ) values(
    'powerhouse-commercial-learning-v1','powerhouse','growth_revenue_os',
    'Commercial decisions improve when outcome, modeled economics, forecast calibration, experiments, buying committee, pricing and creative evidence are evaluated in one canonical lineage.',
    v_result,
    jsonb_build_object('primary_effect','commercial_feedback_compounds_into_next_decision','no_parallel_system',true),
    case when coalesce((v_gap->>'healthy')::boolean,false) then 0.90 else 0.45 end,
    'active',
    greatest(1,v_enriched+v_actions+v_exp_evaluated),
    v_now+interval '30 days'
  ) on conflict(fingerprint) do update set
    evidence=excluded.evidence,effect=excluded.effect,confidence=excluded.confidence,
    sample_size=excluded.sample_size,expires_at=excluded.expires_at,updated_at=v_now;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values(
    'commercial-learning:'||to_char(v_now at time zone 'UTC','YYYYMMDDHH24'),
    'commercial_learning_cycle','powerhouse-commercial-learning-v1','powerhouse',v_now,v_result,
    jsonb_build_object('existing_state_first',true,'reuse_first',true,'closed_loop',true),
    case when coalesce((v_gap->>'healthy')::boolean,false) then 'actioned' else 'error' end,
    'verified',1,v_now
  ) on conflict(dedupe_key) do update set evidence=excluded.evidence,context=excluded.context,state=excluded.state,updated_at=v_now;

  return v_result;
exception when others then
  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values(
    'commercial-learning-error:'||to_char(now() at time zone 'UTC','YYYYMMDDHH24MI'),
    'commercial_learning_cycle_failed','powerhouse-commercial-learning-v1','powerhouse',now(),
    jsonb_build_object('error',sqlerrm,'sqlstate',sqlstate),jsonb_build_object('fail_closed',true),
    'error','verified',1,now()
  ) on conflict(dedupe_key) do nothing;
  return jsonb_build_object('contract','powerhouse-commercial-learning-v1','healthy',false,'error',sqlerrm,'sqlstate',sqlstate);
end $$;

revoke execute on function public.powerhouse_commercial_learning_cycle_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_commercial_learning_cycle_v1(date) to service_role;

select cron.unschedule(jobid) from cron.job where jobname='powerhouse-commercial-learning-v1';
select cron.schedule('powerhouse-commercial-learning-v1','27 * * * *',$$select public.powerhouse_commercial_learning_cycle_v1();$$);
