-- Powerhouse autonomous growth & revenue cycle v1
-- Canonical integration only: reuse existing Powerhouse lineage. No parallel CRM/scheduler/store.

create or replace function public.powerhouse_autonomous_growth_revenue_cycle(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_candidates int := 0;
  v_actions int := 0;
  v_recommendations int := 0;
  v_mature_revenue_learnings int := 0;
  v_mature_social_learnings int := 0;
  v_outcomes int := 0;
  v_revenue numeric := 0;
  v_calibrations int := 0;
  v_result jsonb;
begin
  perform public.powerhouse_sync_forecast_calibration_obligation();

  select count(*) into v_mature_revenue_learnings
  from public.revenue_learnings
  where tenant_id='canonical'
    and status in ('ACTIVE','active','validated','VALIDATED')
    and sample_size >= 5 and confidence >= 0.60
    and nullif(trim(coalesce(baseline_definition,'')),'') is not null;

  select count(*) into v_mature_social_learnings
  from public.social_learnings
  where tenant_id='canonical'
    and status in ('ACTIVE','active','validated','VALIDATED')
    and sample_size >= 5 and confidence >= 0.60
    and nullif(trim(coalesce(baseline_definition,'')),'') is not null;

  select count(*), coalesce(sum(revenue_eur),0)
  into v_outcomes, v_revenue
  from public.powerhouse_sales_outcomes
  where (occurred_at at time zone 'Europe/Amsterdam')::date >= p_run_date - 90;

  select count(*) into v_calibrations
  from public.powerhouse_forecast_calibration
  where measured_at >= v_now - interval '90 days';

  with scored as (
    select
      o.opportunity_id,o.opportunity_key,o.expected_value_eur,o.probability,o.confidence,
      o.company_key,o.person_key,o.topic_key,o.content_key,o.campaign_key,o.stage,
      coalesce((select avg(least(1,greatest(0,s.strength))*(0.65+0.35*least(1,greatest(0,s.novelty))))
        from public.powerhouse_predictive_signals s
        where (o.company_key is not null and s.entity_key=o.company_key)
           or (o.topic_key is not null and s.topic_key=o.topic_key)),0) as signal_score,
      coalesce((select max(least(1,greatest(0,f.probability*f.confidence)))
        from public.powerhouse_forecasts f
        where f.status in ('active','claimed')
          and ((o.company_key is not null and f.scope_key=o.company_key)
            or (o.topic_key is not null and f.topic_key=o.topic_key))),0) as forecast_score,
      coalesce((select sum(so.revenue_eur) from public.powerhouse_sales_outcomes so
        where so.opportunity_key=o.opportunity_key
           or (o.content_key is not null and so.content_key=o.content_key)
           or (o.campaign_key is not null and so.campaign_key=o.campaign_key)
           or (o.topic_key is not null and so.topic_key=o.topic_key)),0) as attributed_revenue,
      coalesce((select count(*) from public.powerhouse_sales_outcomes so
        where so.opportunity_key=o.opportunity_key
           or (o.content_key is not null and so.content_key=o.content_key)
           or (o.campaign_key is not null and so.campaign_key=o.campaign_key)
           or (o.topic_key is not null and so.topic_key=o.topic_key)),0) as attributed_touchpoints,
      coalesce((select f.predicted_problem from public.powerhouse_forecasts f
        where f.status in ('active','claimed') and nullif(trim(coalesce(f.predicted_problem,'')),'') is not null
          and ((o.company_key is not null and f.scope_key=o.company_key) or (o.topic_key is not null and f.topic_key=o.topic_key))
        order by (f.probability*f.confidence*f.first_mover_score) desc nulls last,f.updated_at desc limit 1),'') as latent_problem,
      coalesce((select f.predicted_buying_trigger from public.powerhouse_forecasts f
        where f.status in ('active','claimed')
          and ((o.company_key is not null and f.scope_key=o.company_key) or (o.topic_key is not null and f.topic_key=o.topic_key))
        order by (f.probability*f.confidence*f.first_mover_score) desc nulls last,f.updated_at desc limit 1),'') as buying_trigger
    from public.powerhouse_opportunities o where o.status='open'
  ), enriched as (
    select *,least(1,greatest(0,0.55*signal_score+0.45*forecast_score)) as buying_window,
      greatest(0,expected_value_eur*probability*confidence*(1+0.35*signal_score+0.30*forecast_score)) as nba_value
    from scored
  )
  update public.powerhouse_opportunities o
  set expected_revenue_value=round(e.nba_value,2),
      score_components=coalesce(o.score_components,'{}'::jsonb)||jsonb_build_object(
        'autonomy_contract','powerhouse-autonomous-growth-revenue-v1',
        'next_best_action',jsonb_build_object(
          'action',case when e.buying_window>=0.72 and e.person_key is not null then 'direct_personal_outreach'
                        when e.buying_window>=0.58 then 'warm_account_activation'
                        when e.topic_key is not null then 'content_nurture' else 'research_enrichment' end,
          'channel',case when e.buying_window>=0.72 and e.person_key is not null then 'linkedin'
                         when e.buying_window>=0.58 and e.person_key is not null then 'email'
                         when e.topic_key is not null then 'content' else 'internal' end,
          'expected_value_eur',round(e.nba_value,2)),
        'buying_window',jsonb_build_object('score',round(e.buying_window,4),'trigger',e.buying_trigger),
        'latent_problem',jsonb_build_object('problem',e.latent_problem,'confidence',round(greatest(e.signal_score,e.forecast_score),4)),
        'offer_problem_match',jsonb_build_object('offer_class',case when e.buying_window>=0.72 and e.expected_value_eur>=10000 then 'diagnostic_scan' when e.buying_window>=0.45 then 'problem_discovery' else 'insight_nurture' end,'problem',e.latent_problem),
        'counterfactual',jsonb_build_object('alternative_action',case when e.buying_window>=0.58 then 'content_nurture' else 'research_enrichment' end,'alternative_value_eur',round(e.nba_value*0.72,2),'expected_regret_eur',round(e.nba_value*0.28,2)),
        'commercial_world_model',jsonb_build_object('company_key',e.company_key,'person_key',e.person_key,'topic_key',e.topic_key,'content_key',e.content_key,'campaign_key',e.campaign_key,'signal_score',round(e.signal_score,4),'forecast_score',round(e.forecast_score,4)),
        'revenue_attribution',jsonb_build_object('observed_revenue_eur',e.attributed_revenue,'touchpoints',e.attributed_touchpoints),
        'causal_learning',jsonb_build_object('mature_revenue_learnings',v_mature_revenue_learnings,'mature_social_learnings',v_mature_social_learnings,'rule','only baseline-backed learnings with sample>=5 and confidence>=0.60 influence autonomous decisions')),
      evidence=coalesce(o.evidence,'{}'::jsonb)||jsonb_build_object('autonomous_growth_revenue',jsonb_build_object('scored_at',v_now,'run_date',p_run_date)),
      updated_at=v_now
  from enriched e where o.opportunity_id=e.opportunity_id;
  get diagnostics v_candidates = row_count;

  with ranked as (
    select o.*,row_number() over(order by o.expected_revenue_value desc,o.confidence desc,o.updated_at desc) as rn
    from public.powerhouse_opportunities o where o.status='open' and o.expected_revenue_value>0
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,message_draft,status,due_at,
    content_key,topic_key,campaign_key,opportunity_key,expected_value_eur,person_name,company_name,role)
  select 'autonomy:'||p_run_date::text||':'||r.opportunity_key,
    r.subject_key,r.person_key,r.company_key,
    coalesce(r.score_components#>>'{next_best_action,action}','research_enrichment'),
    coalesce(r.score_components#>>'{next_best_action,channel}','internal'),
    least(100,greatest(0,round((r.probability*r.confidence*100)::numeric,2))),
    'Autonomous next-best-action from existing Powerhouse opportunity, predictive and revenue evidence.',
    jsonb_build_object('autonomy_contract','powerhouse-autonomous-growth-revenue-v1','next_best_action',r.score_components->'next_best_action','buying_window',r.score_components->'buying_window','offer_problem_match',r.score_components->'offer_problem_match','counterfactual',r.score_components->'counterfactual','commercial_world_model',r.score_components->'commercial_world_model','revenue_attribution',r.score_components->'revenue_attribution','execution_policy','existing eligibility + exact destination + dedupe + contact pressure + identity + truth gates stay mandatory'),
    '','suggested',v_now,r.content_key,r.topic_key,r.campaign_key,r.opportunity_key,r.expected_revenue_value,null,null,null
  from ranked r where r.rn<=5
  on conflict (dedupe_key) do update set priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,expected_value_eur=excluded.expected_value_eur,updated_at=v_now;
  get diagnostics v_actions = row_count;

  with forecast_candidates as (
    select f.*,
      least(1,greatest(0,0.28*coalesce(f.probability,0)+0.22*coalesce(f.confidence,0)+0.20*coalesce(f.first_mover_score/100.0,0)+0.18*coalesce(f.whitespace_score,0)+0.12*(1-coalesce(f.market_saturation,0)))) as memeability_score,
      row_number() over(order by (coalesce(f.revenue_potential,0)*coalesce(f.probability,0)*coalesce(f.confidence,0)*greatest(coalesce(f.first_mover_score,0),0.01)) desc,f.updated_at desc) as rn
    from public.powerhouse_forecasts f where f.status in ('active','claimed') and f.topic_key is not null
  )
  insert into public.powerhouse_content_recommendations(dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status)
  select 'autonomy:'||p_run_date::text||':forecast:'||f.forecast_id::text,p_run_date,f.topic_key,'forecast:'||f.forecast_id::text,null,'predictive_revenue_content',
    round(least(100,greatest(0,100*coalesce(f.probability,0)*coalesce(f.confidence,0)+20*coalesce(f.whitespace_score,0)+10*f.memeability_score))::numeric,2),
    'Research/strategy recommendation from an existing forecast: publish or activate only if channel gates and expected commercial value remain favorable.',
    jsonb_build_object(
      'autonomy_contract','powerhouse-autonomous-growth-revenue-v1','forecast_id',f.forecast_id,'latent_problem',f.predicted_problem,'buying_trigger',f.predicted_buying_trigger,
      'research_strategy',jsonb_build_object('predicted_event',f.predicted_event,'predicted_question',f.predicted_question,'predicted_search_intent',f.predicted_search_intent,'first_mover_score',f.first_mover_score,'whitespace_score',f.whitespace_score),
      'content_outcome_model',jsonb_build_object('p_stop_scroll',round(least(0.95,greatest(0.05,0.20+0.55*f.memeability_score))::numeric,4),'p_read',round(least(0.95,greatest(0.05,0.25+0.45*coalesce(f.confidence,0)))::numeric,4),'p_comment',round(least(0.80,greatest(0.01,0.03+0.25*f.memeability_score))::numeric,4),'p_save',round(least(0.80,greatest(0.01,0.04+0.30*coalesce(f.whitespace_score,0)))::numeric,4),'p_profile_visit',round(least(0.80,greatest(0.01,0.03+0.20*coalesce(f.probability,0)))::numeric,4),'p_site_visit',round(least(0.70,greatest(0.01,0.02+0.16*coalesce(f.probability,0)*coalesce(f.confidence,0)))::numeric,4),'p_lead',round(least(0.50,greatest(0.005,0.01+0.12*coalesce(f.probability,0)*coalesce(f.strategic_fit,0)))::numeric,4),'p_opportunity',round(least(0.40,greatest(0.002,0.005+0.09*coalesce(f.probability,0)*coalesce(f.strategic_fit,0)*coalesce(f.confidence,0)))::numeric,4),'expected_revenue_eur',round(coalesce(f.revenue_potential,0)*coalesce(f.probability,0)*coalesce(f.confidence,0),2)),
      'memeability',jsonb_build_object('score',round(f.memeability_score::numeric,4),'principle','virality is multiplied by ICP relevance, brand fit and revenue potential; reach alone is never the objective'),
      'creative_evolution',jsonb_build_object('generation',p_run_date::text,'variants',jsonb_build_array('contrarian_hook','recognition_hook','unexpected_comparison'),'mature_social_learnings',v_mature_social_learnings,'selection_rule','promote only variants with measured incremental improvement versus baseline'),
      'causal_learning',jsonb_build_object('mature_revenue_learnings',v_mature_revenue_learnings,'mature_social_learnings',v_mature_social_learnings,'minimum_sample',5,'minimum_confidence',0.60,'baseline_required',true)),
    'suggested'
  from forecast_candidates f where f.rn<=8
  on conflict (dedupe_key) do update set priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,updated_at=v_now;
  get diagnostics v_recommendations = row_count;

  insert into public.powerhouse_sales_learnings(fingerprint,subject_key,scope,hypothesis,evidence,effect,confidence,status,content_key,topic_key,channel,sample_size,expires_at)
  values('autonomous-growth-revenue-self-improvement-v1','powerhouse','growth_revenue_os',
    'Daily decisions improve when next-best-action, buying-window, content predictions, causal evidence, counterfactuals and realized revenue are evaluated in one canonical lineage.',
    jsonb_build_object('run_date',p_run_date,'evaluated_at',v_now,'opportunities_scored',v_candidates,'actions_materialized',v_actions,'content_recommendations',v_recommendations,'mature_revenue_learnings',v_mature_revenue_learnings,'mature_social_learnings',v_mature_social_learnings,'forecast_calibrations_90d',v_calibrations,'outcomes_90d',v_outcomes,'observed_revenue_eur_90d',v_revenue,'capabilities',jsonb_build_array('next_best_action','buying_window','latent_problem','offer_problem_match','content_outcome_model','memeability','creative_evolution','causal_learning','counterfactual','commercial_world_model','revenue_attribution','research_strategy','self_improvement')),
    jsonb_build_object('primary_objective','realized_revenue','secondary_objectives',jsonb_build_array('calibration_quality','qualified_opportunities','incremental_content_lift'),'anti_objectives',jsonb_build_array('activity_for_activity','vanity_reach','uncalibrated_confidence')),
    least(0.95,greatest(0.20,0.20+0.02*least(v_calibrations,20)+0.01*least(v_outcomes,20))),'active',null,null,null,greatest(1,v_calibrations+v_outcomes),v_now+interval '30 days')
  on conflict (fingerprint) do update set hypothesis=excluded.hypothesis,evidence=excluded.evidence,effect=excluded.effect,confidence=excluded.confidence,sample_size=excluded.sample_size,expires_at=excluded.expires_at,updated_at=v_now;

  insert into public.powerhouse_daily_runs(run_date,dedupe_key,state,evidence,started_at,updated_at)
  values(p_run_date,'powerhouse-daily:'||p_run_date::text,'started',jsonb_build_object('autonomy_contract','powerhouse-autonomous-growth-revenue-v1'),v_now,v_now)
  on conflict (run_date) do update set evidence=coalesce(public.powerhouse_daily_runs.evidence,'{}'::jsonb)||jsonb_build_object('autonomous_growth_revenue',jsonb_build_object('contract','powerhouse-autonomous-growth-revenue-v1','executed_at',v_now,'opportunities_scored',v_candidates,'actions_materialized',v_actions,'content_recommendations',v_recommendations,'mature_revenue_learnings',v_mature_revenue_learnings,'mature_social_learnings',v_mature_social_learnings,'observed_revenue_eur_90d',v_revenue)),updated_at=v_now;

  v_result:=jsonb_build_object('contract','powerhouse-autonomous-growth-revenue-v1','run_date',p_run_date,'healthy',true,'opportunities_scored',v_candidates,'actions_materialized',v_actions,'content_recommendations',v_recommendations,'mature_revenue_learnings',v_mature_revenue_learnings,'mature_social_learnings',v_mature_social_learnings,'forecast_calibrations_90d',v_calibrations,'outcomes_90d',v_outcomes,'observed_revenue_eur_90d',v_revenue,'objective','maximize expected and realized revenue subject to brand, identity, truth, contact-pressure, safety and delivery gates','capabilities',jsonb_build_array('next_best_action','buying_window','latent_problem','offer_problem_match','content_outcome_model','memeability','creative_evolution','causal_learning','counterfactual','commercial_world_model','revenue_attribution','research_strategy','self_improvement'));

  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(v_now,'powerhouse-autonomous-growth-revenue','daily-autonomy-cycle','ok','Canonical autonomous growth/revenue cycle executed over existing Powerhouse lineage.',v_result);
  return v_result;
exception when others then
  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(now(),'powerhouse-autonomous-growth-revenue','daily-autonomy-cycle','fout','Autonomous growth/revenue cycle failed closed: '||sqlerrm,jsonb_build_object('contract','powerhouse-autonomous-growth-revenue-v1','run_date',p_run_date,'healthy',false,'sqlstate',sqlstate));
  return jsonb_build_object('contract','powerhouse-autonomous-growth-revenue-v1','run_date',p_run_date,'healthy',false,'error',sqlerrm,'sqlstate',sqlstate);
end
$$;

create or replace function public.powerhouse_daily_execution_guard(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  autonomy jsonb; s jsonb; p jsonb; pub jsonb; r jsonb; current_state text; combined jsonb; all_ok boolean;
begin
  autonomy:=public.powerhouse_autonomous_growth_revenue_cycle(p_run_date);
  r:=public.powerhouse_reconcile_social_delivery(p_run_date);
  s:=public.powerhouse_execution_status(p_run_date);
  p:=public.powerhouse_predictive_health(p_run_date);
  pub:=public.powerhouse_publication_proof_health(p_run_date);
  all_ok:=coalesce((s->>'execution_complete')::boolean,false)
    and coalesce((p->>'healthy')::boolean,false)
    and coalesce((pub->>'healthy')::boolean,false)
    and coalesce((autonomy->>'healthy')::boolean,false);
  combined:=s||jsonb_build_object('predictive',p,'publication_proof',pub,'social_reconciliation',r,'autonomous_growth_revenue',autonomy,'execution_complete_with_predictive',all_ok,'execution_complete_with_publication_proof',all_ok,'execution_complete_with_autonomous_growth_revenue',all_ok);
  select state into current_state from public.powerhouse_daily_runs where run_date=p_run_date;
  if all_ok and current_state in ('started','degraded') then
    update public.powerhouse_daily_runs set state='completed',completed_at=coalesce(completed_at,now()),evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object('execution_contract','powerhouse-daily-execution-contract-v1','predictive_contract','predictive-first-mover-intelligence-v1','publication_contract','publication-live-proof-before-daily-green-v1','autonomy_contract','powerhouse-autonomous-growth-revenue-v1','execution_status',combined,'completion_confirmed_at',now()),updated_at=now() where run_date=p_run_date;
  elsif current_state='completed' and not all_ok then
    update public.powerhouse_daily_runs set state='degraded',completed_at=null,evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object('execution_contract','powerhouse-daily-execution-contract-v1','predictive_contract','predictive-first-mover-intelligence-v1','publication_contract','publication-live-proof-before-daily-green-v1','autonomy_contract','powerhouse-autonomous-growth-revenue-v1','execution_status',combined,'completion_reconciled_at',now()),updated_at=now() where run_date=p_run_date;
  end if;
  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(now(),'powerhouse-daily-execution-contract','execution-guard',case when all_ok then 'ok' else 'fout' end,case when all_ok then 'dagcyclus is execution-complete met predictive, autonomy en canonieke LIVE_PROVEN/publication proof' else 'dagcyclus mist delivery, predictive health, autonomy health of canonieke LIVE_PROVEN/publication proof; completed blijft fail-closed' end,combined);
  return combined;
end
$$;

insert into public.brain_failure_registry(fingerprint,maturity,root_cause,proven_fix,prevention_rule,regression_ref,occurrence_count,version,first_seen_at,last_seen_at,evidence)
values('growth-revenue-activity-without-unified-autonomous-learning-v1','OBSERVED','Growth, content, prediction and sales capabilities existed, but not every daily completion path required one unified next-best-action/revenue-learning cycle over the same canonical evidence lineage.','Wire powerhouse-autonomous-growth-revenue-v1 into powerhouse_daily_execution_guard and reuse existing signals, forecasts, opportunities, actions, outcomes, content recommendations and learning tables.','Never optimize for activity or vanity reach in isolation. Every daily Powerhouse run must execute the canonical autonomy cycle, retain existing safety/identity/contact-pressure/provider gates, persist predictions before outcomes, attribute realized revenue and feed evidence-backed learning back into subsequent decisions. No parallel datastore or scheduler.','tests/supabase-powerhouse-autonomous-growth-revenue.test.mjs|powerhouse-autonomous-growth-revenue-v1',1,1,now(),now(),jsonb_build_object('approved_on','2026-09-15','objective','autonomous Growth & Revenue Operating System that gets smarter every day','canonical_tables',jsonb_build_array('powerhouse_predictive_signals','powerhouse_forecasts','powerhouse_forecast_calibration','powerhouse_opportunities','powerhouse_sales_actions','powerhouse_sales_outcomes','powerhouse_sales_learnings','powerhouse_content_recommendations','powerhouse_daily_runs','revenue_learnings','social_learnings'),'make_dependency',false,'parallel_system',false))
on conflict (fingerprint) do update set root_cause=excluded.root_cause,proven_fix=excluded.proven_fix,prevention_rule=excluded.prevention_rule,regression_ref=excluded.regression_ref,last_seen_at=now(),evidence=coalesce(public.brain_failure_registry.evidence,'{}'::jsonb)||excluded.evidence;
