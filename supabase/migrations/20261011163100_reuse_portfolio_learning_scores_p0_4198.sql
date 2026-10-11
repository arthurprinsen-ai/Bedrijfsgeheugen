-- P0 #4198: avoid repeat of the 24k-contact portfolio intelligence view
-- in the same canonical commercial-learning transaction. This strictly reuses
-- evidence-backed scores already written by the first original update.
-- No new execution lane, contact, scheduler, billing override or bypass.
CREATE OR REPLACE FUNCTION public.powerhouse_commercial_learning_cycle_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
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
          'source_updated_at',o.updated_at,
          'scored_at',v_now
        )
      ),
      updated_at=v_now
  from public.powerhouse_portfolio_allocator_v1 pa
  where pa.opportunity_key=o.opportunity_key;
  get diagnostics v_enriched=row_count;

  with ranked as (
    -- Reuse the portfolio calculation stored immediately above in this same
    -- transaction. Calling powerhouse_portfolio_allocator_v1 again expands
    -- 24k+ contact intelligence a second time and previously timed out.
    select
      s.opportunity_key, s.person_key, s.company_key, s.topic_key,
      (s.score_components#>>'{commercial_learning_v1,portfolio_score_eur}')::numeric as portfolio_score_eur,
      (s.score_components#>>'{commercial_learning_v1,allocation_confidence}')::numeric as allocation_confidence,
      (s.score_components#>>'{commercial_learning_v1,modeled_value_eur}')::numeric as allocatable_modeled_value_eur,
      (s.score_components#>>'{commercial_learning_v1,economic_buyers}')::bigint as economic_buyers,
      (s.score_components#>>'{commercial_learning_v1,technical_evaluators}')::bigint as technical_evaluators,
      (s.score_components#>>'{commercial_learning_v1,champions}')::bigint as champions,
      row_number() over(
        order by
          (s.score_components#>>'{commercial_learning_v1,portfolio_score_eur}')::numeric desc,
          (s.score_components#>>'{commercial_learning_v1,allocation_confidence}')::numeric desc,
          (s.score_components#>>'{commercial_learning_v1,source_updated_at}')::timestamptz desc
      ) rn
    from public.powerhouse_opportunities s
    where s.status='open'
      and (s.score_components#>>'{commercial_learning_v1,portfolio_score_eur}')::numeric>0
      and (s.score_components#>>'{commercial_learning_v1,allocation_confidence}')::numeric>=0.20
      and (s.score_components#>>'{commercial_learning_v1,scored_at}')::timestamptz=v_now
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
end $function$

REVOKE EXECUTE ON FUNCTION public.powerhouse_commercial_learning_cycle_v1(date)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_commercial_learning_cycle_v1(date) TO service_role;
