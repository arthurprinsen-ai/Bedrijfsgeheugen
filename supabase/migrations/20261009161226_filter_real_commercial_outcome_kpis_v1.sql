-- P0 #4198: semantic KPI correction, versioned after actual derived-value reconciliation.
-- Preserve the existing full-cycle/Brain functions, credentials, source inputs, schedulers and audit logs.
-- Raw operational events are still counted as activities by their own tables but never as business conversions.
CREATE OR REPLACE FUNCTION public.powerhouse_full_cycle_production_proof(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_now timestamptz := now();
  v_reconciliation jsonb;
  v_guard jsonb;
  v_required_sources_healthy boolean := false;
  v_required_failures jsonb := '[]'::jsonb;
  v_buffer_last_sync timestamptz;
  v_buffer_last_metrics timestamptz;
  v_buffer_healthy boolean := false;
  v_ga4_last_sync timestamptz;
  v_ga4_last_batch timestamptz;
  v_ga4_batch_rows integer := 0;
  v_ga4_healthy boolean := false;
  v_gmail_last_readback timestamptz;
  v_gmail_healthy boolean := false;
  v_execution_healthy boolean := false;
  v_predictive_healthy boolean := false;
  v_overdue_calibrations integer := 0;
  v_outcomes_90d integer := 0;
  v_revenue_90d numeric := 0;
  v_calibrations_90d integer := 0;
  v_last_calibration timestamptz;
  v_healthy boolean := false;
  v_proof jsonb;
begin
  perform public.bg_gezondheid_meten();
  v_reconciliation := public.powerhouse_reconcile_terminal_publication_state(p_run_date);
  v_guard := public.powerhouse_daily_execution_guard(p_run_date);

  select
    coalesce(bool_and(lower(canonical_health_status) in ('ok','waarschuwing') and lower(freshness_status) in ('fresh','fresh_with_warning')), false),
    coalesce(jsonb_agg(jsonb_build_object('source_key', source_key,'health', canonical_health_status,'freshness', freshness_status,'evidence', evidence) order by source_key)
      filter (where lower(canonical_health_status) not in ('ok','waarschuwing') or lower(freshness_status) not in ('fresh','fresh_with_warning')), '[]'::jsonb)
  into v_required_sources_healthy, v_required_failures
  from public.powerhouse_source_freshness_v1
  where required_for_daily_loop = true;

  select max(uitgevoerd_op) filter (where lower(status) = 'ok') into v_buffer_last_sync from public.bg_buffer_sync;
  select max(observed_at) into v_buffer_last_metrics from public.social_metric_snapshots;
  v_buffer_healthy := v_buffer_last_sync is not null and v_buffer_last_sync >= v_now - interval '6 hours' and v_buffer_last_metrics is not null and v_buffer_last_metrics >= v_now - interval '6 hours';

  select max(uitgevoerd_op) filter (where lower(status) in ('ok','partial','imported')) into v_ga4_last_sync from public.bg_ga4_sync;
  select max(created_at), coalesce(sum(rows_total) filter (where created_at >= v_now - interval '48 hours'), 0)::integer into v_ga4_last_batch, v_ga4_batch_rows
  from public.bg_ga4_csv_batches where lower(coalesce(status,'')) in ('ok','complete','completed','partial','imported') or status is null;
  v_ga4_healthy := v_ga4_last_sync is not null and v_ga4_last_sync >= v_now - interval '48 hours' and v_ga4_last_batch is not null and v_ga4_last_batch >= v_now - interval '48 hours' and v_ga4_batch_rows > 0;

  select last_observed_at,
         (coverage_state='fresh' and not blocks_full_cycle_proof)
  into v_gmail_last_readback, v_gmail_healthy
  from public.powerhouse_evidence_source_coverage_v1
  where source_key='gmail';
  v_gmail_healthy := coalesce(v_gmail_healthy,false);

  v_execution_healthy := coalesce((v_guard ->> 'execution_complete')::boolean, false);
  v_predictive_healthy := coalesce((v_guard -> 'predictive' ->> 'healthy')::boolean, false);
  v_overdue_calibrations := coalesce((v_guard -> 'predictive' ->> 'overdue_calibrations')::integer, 0);

  select count(*) filter (where occurred_at >= v_now - interval '90 days'), coalesce(sum(revenue_eur) filter (where occurred_at >= v_now - interval '90 days'),0)
  into v_outcomes_90d,v_revenue_90d from public.powerhouse_sales_outcomes
  where coalesce(revenue_eur,0)>0 or lower(outcome_type) in ('scan_submitted','qualified_lead','appointment_booked','meeting_booked','proposal_requested','quote_requested','proposal','won_order','order_won','invoice_paid','revenue');
  select count(*) filter (where measured_at >= v_now - interval '90 days'), max(measured_at)
  into v_calibrations_90d,v_last_calibration from public.powerhouse_forecast_calibration;

  v_healthy := v_required_sources_healthy and v_ga4_healthy and v_gmail_healthy and v_execution_healthy and v_predictive_healthy and v_overdue_calibrations=0;

  v_proof := jsonb_build_object(
    'contract','powerhouse-full-cycle-production-proof-v1','run_date',p_run_date,'generated_at',v_now,'healthy',v_healthy,
    'required_sources_healthy',v_required_sources_healthy,'required_source_failures',v_required_failures,
    'buffer_required',false,'buffer_healthy',v_buffer_healthy,'buffer',jsonb_build_object('role','legacy_telemetry_only','last_sync',v_buffer_last_sync,'last_metrics',v_buffer_last_metrics),
    'ga4_healthy',v_ga4_healthy,'ga4',jsonb_build_object('provider_layer','canonical','last_sync',v_ga4_last_sync,'last_batch',v_ga4_last_batch,'batch_rows_48h',v_ga4_batch_rows),
    'gmail_healthy',v_gmail_healthy,'gmail',jsonb_build_object('source_key','gmail','last_provider_readback',v_gmail_last_readback,'authority','powerhouse_evidence_source_coverage_v1'),
    'execution_healthy',v_execution_healthy,'predictive_healthy',v_predictive_healthy,'overdue_calibrations',v_overdue_calibrations,
    'outcomes',jsonb_build_object('observed_sales_outcomes_90d',v_outcomes_90d,'observed_revenue_eur_90d',v_revenue_90d),
    'calibration',jsonb_build_object('rows_90d',v_calibrations_90d,'last_calibration',v_last_calibration),
    'publication_reconciliation',v_reconciliation,'daily_execution_guard',v_guard
  );

  insert into public.powerhouse_runtime_events (dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence,created_at,updated_at)
  values ('full-cycle-proof:'||p_run_date::text,'full_cycle_production_proof','powerhouse_full_cycle_production_proof',p_run_date::text,'system',v_now,v_proof,jsonb_build_object('contract','powerhouse-full-cycle-production-proof-v1'),case when v_healthy then 'observed' else 'error' end,case when v_healthy then 'OBSERVED' else 'DEGRADED' end,1,v_now,v_now)
  on conflict (dedupe_key) do update set occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,state=excluded.state,data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=excluded.updated_at;

  insert into public.bg_gezondheid (gemeten_op,onderdeel,soort,status,detail,gegevens)
  values (v_now,'powerhouse-full-cycle-production-proof','closed-loop-production-proof',case when v_healthy then 'ok' else 'fout' end,case when v_healthy then 'Volledige Powerhouse productiecyclus bewezen.' else 'Volledige Powerhouse productiecyclus nog niet volledig bewezen.' end,v_proof);

  update public.powerhouse_daily_runs set evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object('full_cycle_production_proof',v_proof),updated_at=v_now where run_date=p_run_date;
  return v_proof;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.powerhouse_autonomous_growth_revenue_cycle(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  perform public.powerhouse_refresh_forecast_calibration_obligations();

  select count(*) into v_mature_revenue_learnings
  from public.revenue_learnings
  where tenant_id='canonical'
    and status in ('ACTIVE','active','validated','VALIDATED')
    and sample_size >= 5
    and confidence >= 0.60
    and nullif(trim(coalesce(baseline_definition,'')),'') is not null;

  select count(*) into v_mature_social_learnings
  from public.social_learnings
  where tenant_id='canonical'
    and status in ('ACTIVE','active','validated','VALIDATED')
    and sample_size >= 5
    and confidence >= 0.60
    and nullif(trim(coalesce(baseline_definition,'')),'') is not null;

  select count(*), coalesce(sum(revenue_eur),0)
    into v_outcomes, v_revenue
  from public.powerhouse_sales_outcomes
  where (occurred_at at time zone 'Europe/Amsterdam')::date >= p_run_date - 90
    and (coalesce(revenue_eur,0)>0 or lower(outcome_type) in ('scan_submitted','qualified_lead','appointment_booked','meeting_booked','proposal_requested','quote_requested','proposal','won_order','order_won','invoice_paid','revenue'));

  select count(*) into v_calibrations
  from public.powerhouse_forecast_calibration
  where measured_at >= v_now - interval '90 days';

  with scored as (
    select
      o.opportunity_id,
      o.opportunity_key,
      o.expected_value_eur,
      o.probability,
      o.confidence,
      o.company_key,
      o.person_key,
      o.topic_key,
      o.content_key,
      o.campaign_key,
      o.stage,
      coalesce((
        select avg(least(1,greatest(0,s.strength)) * (0.65 + 0.35*least(1,greatest(0,s.novelty))))
        from public.powerhouse_predictive_signals s
        where (o.company_key is not null and s.entity_key=o.company_key)
           or (o.topic_key is not null and s.topic_key=o.topic_key)
      ),0) as signal_score,
      coalesce((
        select max(least(1,greatest(0,f.probability * f.confidence)))
        from public.powerhouse_forecasts f
        where f.status in ('active','claimed')
          and ((o.company_key is not null and f.scope_key=o.company_key)
            or (o.topic_key is not null and f.topic_key=o.topic_key))
      ),0) as forecast_score,
      coalesce((
        select sum(so.revenue_eur)
        from public.powerhouse_sales_outcomes so
        where so.opportunity_key=o.opportunity_key
           or (o.content_key is not null and so.content_key=o.content_key)
           or (o.campaign_key is not null and so.campaign_key=o.campaign_key)
           or (o.topic_key is not null and so.topic_key=o.topic_key)
      ),0) as attributed_revenue,
      coalesce((
        select count(*)
        from public.powerhouse_sales_outcomes so
        where (
             so.opportunity_key=o.opportunity_key
          or (o.content_key is not null and so.content_key=o.content_key)
          or (o.campaign_key is not null and so.campaign_key=o.campaign_key)
          or (o.topic_key is not null and so.topic_key=o.topic_key)
        ) and lower(so.outcome_type) not in ('not_executed','execution_completed','no_response','no_reply_observed')
      ),0) as attributed_touchpoints,
      coalesce((
        select f.predicted_problem
        from public.powerhouse_forecasts f
        where f.status in ('active','claimed')
          and nullif(trim(coalesce(f.predicted_problem,'')),'') is not null
          and ((o.company_key is not null and f.scope_key=o.company_key)
            or (o.topic_key is not null and f.topic_key=o.topic_key))
        order by (f.probability*f.confidence*f.first_mover_score) desc nulls last, f.updated_at desc
        limit 1
      ),'') as latent_problem,
      coalesce((
        select f.predicted_buying_trigger
        from public.powerhouse_forecasts f
        where f.status in ('active','claimed')
          and ((o.company_key is not null and f.scope_key=o.company_key)
            or (o.topic_key is not null and f.topic_key=o.topic_key))
        order by (f.probability*f.confidence*f.first_mover_score) desc nulls last, f.updated_at desc
        limit 1
      ),'') as buying_trigger
    from public.powerhouse_opportunities o
    where o.status='open'
  ), enriched as (
    select *,
      least(1,greatest(0,0.55*signal_score + 0.45*forecast_score)) as buying_window,
      greatest(0, expected_value_eur * probability * confidence *
        (1 + 0.35*signal_score + 0.30*forecast_score)) as nba_value
    from scored
  )
  update public.powerhouse_opportunities o
  set expected_revenue_value = round(e.nba_value,2),
      score_components = coalesce(o.score_components,'{}'::jsonb) || jsonb_build_object(
        'autonomy_contract','powerhouse-autonomous-growth-revenue-v1',
        'next_best_action', jsonb_build_object(
          'action',case
            when e.expected_value_eur>0 and e.buying_window>=0.72 and e.person_key is not null then 'direct_personal_outreach'
            when e.expected_value_eur>0 and e.buying_window>=0.58 then 'warm_account_activation'
            when e.topic_key is not null then 'content_nurture'
            else 'research_enrichment'
          end,
          'channel',case
            when e.expected_value_eur>0 and e.buying_window>=0.72 and e.person_key is not null then 'linkedin'
            when e.expected_value_eur>0 and e.buying_window>=0.58 and e.person_key is not null then 'email'
            when e.topic_key is not null then 'content'
            else 'internal'
          end,
          'expected_value_eur',round(e.nba_value,2)
        ),
        'buying_window',jsonb_build_object('score',round(e.buying_window,4),'trigger',e.buying_trigger),
        'latent_problem',jsonb_build_object('problem',e.latent_problem,'confidence',round(greatest(e.signal_score,e.forecast_score),4)),
        'offer_problem_match',jsonb_build_object(
          'offer_class',case
            when e.buying_window >= 0.72 and e.expected_value_eur >= 10000 then 'diagnostic_scan'
            when e.buying_window >= 0.45 then 'problem_discovery'
            else 'insight_nurture'
          end,
          'problem',e.latent_problem
        ),
        'counterfactual',jsonb_build_object(
          'alternative_action',case when e.buying_window >= 0.58 then 'content_nurture' else 'research_enrichment' end,
          'alternative_value_eur',round(e.nba_value*0.72,2),
          'expected_regret_eur',round(e.nba_value*0.28,2)
        ),
        'commercial_world_model',jsonb_build_object(
          'company_key',e.company_key,'person_key',e.person_key,'topic_key',e.topic_key,
          'content_key',e.content_key,'campaign_key',e.campaign_key,
          'signal_score',round(e.signal_score,4),'forecast_score',round(e.forecast_score,4)
        ),
        'revenue_attribution',jsonb_build_object(
          'observed_revenue_eur',e.attributed_revenue,
          'touchpoints',e.attributed_touchpoints
        ),
        'causal_learning',jsonb_build_object(
          'mature_revenue_learnings',v_mature_revenue_learnings,
          'mature_social_learnings',v_mature_social_learnings,
          'rule','only baseline-backed learnings with sample>=5 and confidence>=0.60 influence autonomous decisions'
        )
      ),
      evidence = coalesce(o.evidence,'{}'::jsonb) || jsonb_build_object(
        'autonomous_growth_revenue',jsonb_build_object('scored_at',v_now,'run_date',p_run_date)
      ),
      updated_at=v_now
  from enriched e
  where o.opportunity_id=e.opportunity_id;

  get diagnostics v_candidates = row_count;

  with ranked as (
    select o.*,
      row_number() over(order by o.expected_revenue_value desc, o.confidence desc, o.updated_at desc) as rn
    from public.powerhouse_opportunities o
    where o.status='open' and (o.expected_revenue_value>0 or (o.probability*o.confidence)>=0.20)
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,
    reason,evidence,message_draft,status,due_at,content_key,topic_key,campaign_key,
    opportunity_key,expected_value_eur,person_name,company_name,role
  )
  select
    'autonomy:'||p_run_date::text||':'||r.opportunity_key,
    r.subject_key,r.person_key,r.company_key,
    coalesce(r.score_components#>>'{next_best_action,action}','research_enrichment'),
    coalesce(r.score_components#>>'{next_best_action,channel}','internal'),
    least(100,greatest(0,round((r.probability*r.confidence*100)::numeric,2))),
    'Autonomous next-best-action from existing Powerhouse opportunity, predictive and revenue evidence.',
    jsonb_build_object(
      'autonomy_contract','powerhouse-autonomous-growth-revenue-v1',
      'next_best_action',r.score_components->'next_best_action',
      'buying_window',r.score_components->'buying_window',
      'offer_problem_match',r.score_components->'offer_problem_match',
      'counterfactual',r.score_components->'counterfactual',
      'commercial_world_model',r.score_components->'commercial_world_model',
      'revenue_attribution',r.score_components->'revenue_attribution',
      'execution_policy','existing eligibility + exact destination + dedupe + contact pressure + identity + truth gates stay mandatory'
    ),
    '',
    'suggested',
    v_now,
    r.content_key,r.topic_key,r.campaign_key,r.opportunity_key,r.expected_revenue_value,
    null,null,null
  from ranked r
  where r.rn <= 5
  on conflict (dedupe_key) do update
    set priority=excluded.priority,
        reason=excluded.reason,
        evidence=excluded.evidence,
        expected_value_eur=excluded.expected_value_eur,
        updated_at=v_now;

  get diagnostics v_actions = row_count;

  with forecast_candidates as (
    select f.*,
      least(1,greatest(0,
        0.28*coalesce(f.probability,0) +
        0.22*coalesce(f.confidence,0) +
        0.20*coalesce(f.first_mover_score/100.0,0) +
        0.18*coalesce(f.whitespace_score,0) +
        0.12*(1-coalesce(f.market_saturation,0))
      )) as memeability_score,
      row_number() over(order by
        (coalesce(f.revenue_potential,0) * coalesce(f.probability,0) * coalesce(f.confidence,0) *
         greatest(coalesce(f.first_mover_score,0),0.01)) desc,
        f.updated_at desc
      ) as rn
    from public.powerhouse_forecasts f
    where f.status in ('active','claimed')
      and f.topic_key is not null
  )
  insert into public.powerhouse_content_recommendations(
    dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,
    priority,reason,evidence,status
  )
  select
    'autonomy:'||p_run_date::text||':forecast:'||f.forecast_id::text,
    p_run_date,
    f.topic_key,
    'forecast:'||f.forecast_id::text,
    null,
    'predictive_revenue_content',
    round(least(100,greatest(0,
      100*coalesce(f.probability,0)*coalesce(f.confidence,0) +
      20*coalesce(f.whitespace_score,0) +
      10*f.memeability_score
    ))::numeric,2),
    'Research/strategy recommendation from an existing forecast: publish or activate only if channel gates and expected commercial value remain favorable.',
    jsonb_build_object(
      'autonomy_contract','powerhouse-autonomous-growth-revenue-v1',
      'forecast_id',f.forecast_id,
      'latent_problem',f.predicted_problem,
      'buying_trigger',f.predicted_buying_trigger,
      'research_strategy',jsonb_build_object(
        'predicted_event',f.predicted_event,
        'predicted_question',f.predicted_question,
        'predicted_search_intent',f.predicted_search_intent,
        'first_mover_score',f.first_mover_score,
        'whitespace_score',f.whitespace_score
      ),
      'content_outcome_model',jsonb_build_object(
        'p_stop_scroll',round(least(0.95,greatest(0.05,0.20+0.55*f.memeability_score))::numeric,4),
        'p_read',round(least(0.95,greatest(0.05,0.25+0.45*coalesce(f.confidence,0)))::numeric,4),
        'p_comment',round(least(0.80,greatest(0.01,0.03+0.25*f.memeability_score))::numeric,4),
        'p_save',round(least(0.80,greatest(0.01,0.04+0.30*coalesce(f.whitespace_score,0)))::numeric,4),
        'p_profile_visit',round(least(0.80,greatest(0.01,0.03+0.20*coalesce(f.probability,0)))::numeric,4),
        'p_site_visit',round(least(0.70,greatest(0.01,0.02+0.16*coalesce(f.probability,0)*coalesce(f.confidence,0)))::numeric,4),
        'p_lead',round(least(0.50,greatest(0.005,0.01+0.12*coalesce(f.probability,0)*coalesce(f.strategic_fit,0)))::numeric,4),
        'p_opportunity',round(least(0.40,greatest(0.002,0.005+0.09*coalesce(f.probability,0)*coalesce(f.strategic_fit,0)*coalesce(f.confidence,0)))::numeric,4),
        'expected_revenue_eur',round(coalesce(f.revenue_potential,0)*coalesce(f.probability,0)*coalesce(f.confidence,0),2)
      ),
      'memeability',jsonb_build_object(
        'score',round(f.memeability_score::numeric,4),
        'principle','virality is multiplied by ICP relevance, brand fit and revenue potential; reach alone is never the objective'
      ),
      'creative_evolution',jsonb_build_object(
        'generation',p_run_date::text,
        'variants',jsonb_build_array('contrarian_hook','recognition_hook','unexpected_comparison'),
        'mature_social_learnings',v_mature_social_learnings,
        'selection_rule','promote only variants with measured incremental improvement versus baseline'
      ),
      'causal_learning',jsonb_build_object(
        'mature_revenue_learnings',v_mature_revenue_learnings,
        'mature_social_learnings',v_mature_social_learnings,
        'minimum_sample',5,
        'minimum_confidence',0.60,
        'baseline_required',true
      )
    ),
    'suggested'
  from forecast_candidates f
  where f.rn <= 8
  on conflict (dedupe_key) do update
    set priority=excluded.priority,
        reason=excluded.reason,
        evidence=excluded.evidence,
        updated_at=v_now;

  get diagnostics v_recommendations = row_count;

  insert into public.powerhouse_sales_learnings(
    fingerprint,subject_key,scope,hypothesis,evidence,effect,confidence,status,
    content_key,topic_key,channel,sample_size,expires_at
  )
  values(
    'autonomous-growth-revenue-self-improvement-v1',
    'powerhouse',
    'growth_revenue_os',
    'Daily decisions improve when next-best-action, buying-window, content predictions, causal evidence, counterfactuals and realized revenue are evaluated in one canonical lineage.',
    jsonb_build_object(
      'run_date',p_run_date,
      'evaluated_at',v_now,
      'opportunities_scored',v_candidates,
      'actions_materialized',v_actions,
      'content_recommendations',v_recommendations,
      'mature_revenue_learnings',v_mature_revenue_learnings,
      'mature_social_learnings',v_mature_social_learnings,
      'forecast_calibrations_90d',v_calibrations,
      'outcomes_90d',v_outcomes,
      'observed_revenue_eur_90d',v_revenue,
      'capabilities',jsonb_build_array(
        'next_best_action','buying_window','latent_problem','offer_problem_match',
        'content_outcome_model','memeability','creative_evolution','causal_learning',
        'counterfactual','commercial_world_model','revenue_attribution','research_strategy','self_improvement'
      )
    ),
    jsonb_build_object(
      'primary_objective','realized_revenue',
      'secondary_objectives',jsonb_build_array('calibration_quality','qualified_opportunities','incremental_content_lift'),
      'anti_objectives',jsonb_build_array('activity_for_activity','vanity_reach','uncalibrated_confidence')
    ),
    least(0.95,greatest(0.20,0.20 + 0.02*least(v_calibrations,20) + 0.01*least(v_outcomes,20))),
    'active',
    null,null,null,
    greatest(1,v_calibrations+v_outcomes),
    v_now + interval '30 days'
  )
  on conflict (fingerprint) do update
    set hypothesis=excluded.hypothesis,
        evidence=excluded.evidence,
        effect=excluded.effect,
        confidence=excluded.confidence,
        sample_size=excluded.sample_size,
        expires_at=excluded.expires_at,
        updated_at=v_now;

  insert into public.powerhouse_daily_runs(run_date,dedupe_key,state,evidence,started_at,updated_at)
  values(
    p_run_date,
    'powerhouse-daily:'||p_run_date::text,
    'started',
    jsonb_build_object('autonomy_contract','powerhouse-autonomous-growth-revenue-v1'),
    v_now,v_now
  )
  on conflict (run_date) do update
    set evidence=coalesce(public.powerhouse_daily_runs.evidence,'{}'::jsonb) || jsonb_build_object(
      'autonomous_growth_revenue',jsonb_build_object(
        'contract','powerhouse-autonomous-growth-revenue-v1',
        'executed_at',v_now,
        'opportunities_scored',v_candidates,
        'actions_materialized',v_actions,
        'content_recommendations',v_recommendations,
        'mature_revenue_learnings',v_mature_revenue_learnings,
        'mature_social_learnings',v_mature_social_learnings,
        'observed_revenue_eur_90d',v_revenue
      )
    ),
    updated_at=v_now;

  v_result := jsonb_build_object(
    'contract','powerhouse-autonomous-growth-revenue-v1',
    'run_date',p_run_date,
    'healthy',true,
    'opportunities_scored',v_candidates,
    'actions_materialized',v_actions,
    'content_recommendations',v_recommendations,
    'mature_revenue_learnings',v_mature_revenue_learnings,
    'mature_social_learnings',v_mature_social_learnings,
    'forecast_calibrations_90d',v_calibrations,
    'outcomes_90d',v_outcomes,
    'observed_revenue_eur_90d',v_revenue,
    'objective','maximize expected and realized revenue subject to brand, identity, truth, contact-pressure, safety and delivery gates',
    'capabilities',jsonb_build_array(
      'next_best_action','buying_window','latent_problem','offer_problem_match',
      'content_outcome_model','memeability','creative_evolution','causal_learning',
      'counterfactual','commercial_world_model','revenue_attribution','research_strategy','self_improvement'
    )
  );

  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(
    v_now,
    'powerhouse-autonomous-growth-revenue',
    'daily-autonomy-cycle',
    'ok',
    'Canonical autonomous growth/revenue cycle executed over existing Powerhouse lineage.',
    v_result
  );

  return v_result;
exception when others then
  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(
    now(),
    'powerhouse-autonomous-growth-revenue',
    'daily-autonomy-cycle',
    'fout',
    'Autonomous growth/revenue cycle failed closed: '||sqlerrm,
    jsonb_build_object('contract','powerhouse-autonomous-growth-revenue-v1','run_date',p_run_date,'healthy',false,'sqlstate',sqlstate)
  );
  return jsonb_build_object(
    'contract','powerhouse-autonomous-growth-revenue-v1',
    'run_date',p_run_date,
    'healthy',false,
    'error',sqlerrm,
    'sqlstate',sqlstate
  );
end
$function$
;

-- Preserve the EXISTING production access control: only postgres and service_role
-- can execute these internal SECURITY DEFINER functions. Never expose to browsers.
REVOKE ALL ON FUNCTION public.powerhouse_full_cycle_production_proof(date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.powerhouse_autonomous_growth_revenue_cycle(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_full_cycle_production_proof(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.powerhouse_autonomous_growth_revenue_cycle(date) TO service_role;
