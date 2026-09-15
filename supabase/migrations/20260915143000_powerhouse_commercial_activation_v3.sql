-- Powerhouse Commercial Activation v3
-- Closes remaining learning/economics/experiment gaps on top of powerhouse-commercial-closed-loop-v2.
-- No parallel CRM, brain, queue, scheduler, analytics store or learning store.
-- Truth boundary: modeled priors are not realized revenue; observed provider/outcome evidence remains authoritative.

create or replace function public.powerhouse_refresh_opportunity_economics_v2(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date)
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_pricing_sample integer := 0;
  v_prior_win_rate numeric := 0;
  v_prior_ticket_eur numeric := 0;
  v_scored integer := 0;
  v_positive integer := 0;
begin
  select
    coalesce(sum(p.offers_observed),0)::integer,
    case when coalesce(sum(p.offers_observed),0)>0
      then sum(coalesce(p.observed_win_rate,0)*p.offers_observed)::numeric / sum(p.offers_observed)::numeric
      else 0 end,
    case when coalesce(sum(p.offers_observed),0)>0
      then sum(coalesce(nullif(p.avg_won_offer_eur,0),p.avg_offer_eur,0)*p.offers_observed)::numeric / sum(p.offers_observed)::numeric
      else 0 end
  into v_pricing_sample,v_prior_win_rate,v_prior_ticket_eur
  from public.powerhouse_offer_pricing_learning_v1 p;

  with scored as (
    select
      o.opportunity_id,
      least(1,greatest(0,coalesce(o.probability,0))) as opportunity_probability,
      least(1,greatest(0,coalesce(o.confidence,0))) as opportunity_confidence,
      least(1,greatest(0,coalesce(
        nullif(o.score_components#>>'{buying_window_v2,score}','')::numeric,
        nullif(o.score_components#>>'{buying_window,score}','')::numeric,
        0
      ))) as buying_window_score,
      case
        when v_pricing_sample>0 and v_prior_ticket_eur>0 then round((
          v_prior_ticket_eur
          * least(1,greatest(0,coalesce(o.probability,0)))
          * least(1,greatest(0,coalesce(o.confidence,0)))
          * least(1,greatest(0,v_prior_win_rate))
          * (0.25 + 0.75*least(1,greatest(0,coalesce(
              nullif(o.score_components#>>'{buying_window_v2,score}','')::numeric,
              nullif(o.score_components#>>'{buying_window,score}','')::numeric,
              0
            ))))
          * least(1, ln(1+v_pricing_sample::numeric)/ln(11::numeric))
        )::numeric,2)
        else 0::numeric
      end as modeled_expected_revenue_eur
    from public.powerhouse_opportunities o
    where o.status='open'
  )
  update public.powerhouse_opportunities o
  set expected_revenue_value = case
        when coalesce(o.expected_value_eur,0)>0
          then greatest(coalesce(o.expected_revenue_value,0),round(o.expected_value_eur*s.opportunity_probability*s.opportunity_confidence,2))
        else s.modeled_expected_revenue_eur
      end,
      score_components = coalesce(o.score_components,'{}'::jsonb) || jsonb_build_object(
        'commercial_economics_v2',jsonb_build_object(
          'contract','powerhouse-commercial-activation-v3',
          'modeled_prior',(coalesce(o.expected_value_eur,0)=0 and v_pricing_sample>0 and v_prior_ticket_eur>0),
          'pricing_evidence','powerhouse_offer_pricing_learning_v1',
          'pricing_sample_size',v_pricing_sample,
          'prior_win_rate',round(v_prior_win_rate,4),
          'prior_ticket_eur',round(v_prior_ticket_eur,2),
          'opportunity_probability',s.opportunity_probability,
          'opportunity_confidence',s.opportunity_confidence,
          'buying_window_score',s.buying_window_score,
          'modeled_expected_revenue_eur',s.modeled_expected_revenue_eur,
          'truth_boundary','modeled_prior is decision support only; expected_value_eur is not overwritten and modeled economics is not observed realized revenue',
          'scored_at',v_now
        )
      ),
      updated_at=v_now
  from scored s
  where o.opportunity_id=s.opportunity_id;
  get diagnostics v_scored = row_count;

  select count(*)::integer into v_positive
  from public.powerhouse_opportunities o
  where o.status='open'
    and coalesce(o.expected_revenue_value,0)>0
    and coalesce((o.score_components#>>'{commercial_economics_v2,modeled_prior}')::boolean,false);

  return jsonb_build_object(
    'contract','powerhouse-commercial-activation-v3',
    'run_date',p_run_date,
    'opportunities_scored',v_scored,
    'opportunities_with_modeled_value',v_positive,
    'pricing_sample_size',v_pricing_sample,
    'prior_win_rate',round(v_prior_win_rate,4),
    'prior_ticket_eur',round(v_prior_ticket_eur,2),
    'truth_boundary','modeled_prior is not realized revenue and does not overwrite expected_value_eur'
  );
end;
$$;

revoke all on function public.powerhouse_refresh_opportunity_economics_v2(date) from public, anon, authenticated;
grant execute on function public.powerhouse_refresh_opportunity_economics_v2(date) to service_role;

create or replace function public.powerhouse_reconcile_commercial_outcomes_v2(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date)
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_normalized integer := 0;
  v_linked integer := 0;
  v_completed integer := 0;
  v_observed_outcomes integer := 0;
  v_observed_revenue numeric := 0;
begin
  update public.powerhouse_sales_outcomes o
  set evidence = coalesce(o.evidence,'{}'::jsonb) || jsonb_build_object(
        'normalized_outcome_class',case
          when lower(coalesce(o.outcome_type,'')) ~ '(lost|rejected|declined)' then 'lost_order'
          when lower(coalesce(o.outcome_type,'')) ~ '(won|order|deal)' and coalesce(o.revenue_eur,0)>0 then 'realized_revenue'
          when lower(coalesce(o.outcome_type,'')) ~ '(won|order|deal)' then 'won_order'
          when lower(coalesce(o.outcome_type,'')) ~ '(offer|proposal|quote)' then 'offer'
          when lower(coalesce(o.outcome_type,'')) ~ '(qualified|qualification)' then 'qualified_lead'
          when lower(coalesce(o.outcome_type,'')) ~ '(meeting|appointment|call booked)' then 'meeting'
          when lower(coalesce(o.outcome_type,'')) ~ '(positive reply|positive response|interested)' then 'positive_response'
          when lower(coalesce(o.outcome_type,'')) ~ '(reply|response)' then 'response'
          when lower(coalesce(o.outcome_type,'')) ~ '(delivered|sent)' then 'delivered'
          when lower(coalesce(o.outcome_type,'')) ~ '(no response|no_response|ignored)' then 'no_response'
          when lower(coalesce(o.outcome_type,'')) ~ '(bounce|blocked|failure|failed|error)' then 'failure'
          when coalesce(o.revenue_eur,0)>0 then 'realized_revenue'
          else 'other'
        end,
        'normalization_contract','powerhouse-commercial-activation-v3',
        'normalized_at',v_now
      )
  where not (coalesce(o.evidence,'{}'::jsonb) ? 'normalized_outcome_class');
  get diagnostics v_normalized = row_count;

  update public.powerhouse_sales_actions a
  set outcome_id=o.outcome_id,
      evidence=coalesce(a.evidence,'{}'::jsonb) || jsonb_build_object(
        'outcome_reconciliation',jsonb_build_object(
          'contract','powerhouse-commercial-activation-v3',
          'outcome_id',o.outcome_id,
          'normalized_outcome_class',o.evidence->>'normalized_outcome_class',
          'linked_at',v_now,
          'provider_readback_required_for_completion',true
        )
      ),
      updated_at=v_now
  from public.powerhouse_sales_outcomes o
  where o.action_id=a.action_id
    and a.outcome_id is distinct from o.outcome_id;
  get diagnostics v_linked = row_count;

  update public.powerhouse_sales_actions a
  set status='done',
      executed_at=coalesce(a.executed_at,o.occurred_at,v_now),
      outcome_id=o.outcome_id,
      evidence=coalesce(a.evidence,'{}'::jsonb) || jsonb_build_object(
        'completion_proof',jsonb_build_object(
          'contract','powerhouse-commercial-activation-v3',
          'provider_readback',true,
          'outcome_id',o.outcome_id,
          'completed_at',v_now
        )
      ),
      updated_at=v_now
  from public.powerhouse_sales_outcomes o
  where o.action_id=a.action_id
    and a.status <> 'done'
    and (
      lower(coalesce(o.evidence->>'provider_readback','')) not in ('','false','0','null')
      or nullif(trim(coalesce(o.evidence->>'provider_message_id','')),'') is not null
      or nullif(trim(coalesce(o.evidence->>'provider_delivery_id','')),'') is not null
      or nullif(trim(coalesce(o.evidence->>'live_url','')),'') is not null
      or coalesce((o.evidence->>'observed_external_event')::boolean,false)
    );
  get diagnostics v_completed = row_count;

  update public.powerhouse_sales_actions a
  set evidence=coalesce(a.evidence,'{}'::jsonb) || jsonb_build_object(
        'outcome_reconciliation',coalesce(a.evidence->'outcome_reconciliation','{}'::jsonb) || jsonb_build_object(
          'fail_closed',true,
          'provider_readback_required',true,
          'checked_at',v_now
        )
      ),
      updated_at=v_now
  from public.powerhouse_sales_outcomes o
  where o.action_id=a.action_id
    and a.status <> 'done'
    and not (
      lower(coalesce(o.evidence->>'provider_readback','')) not in ('','false','0','null')
      or nullif(trim(coalesce(o.evidence->>'provider_message_id','')),'') is not null
      or nullif(trim(coalesce(o.evidence->>'provider_delivery_id','')),'') is not null
      or nullif(trim(coalesce(o.evidence->>'live_url','')),'') is not null
      or coalesce((o.evidence->>'observed_external_event')::boolean,false)
    );

  select count(*)::integer,coalesce(sum(o.revenue_eur),0)
    into v_observed_outcomes,v_observed_revenue
  from public.powerhouse_sales_outcomes o;

  return jsonb_build_object(
    'contract','powerhouse-commercial-activation-v3',
    'run_date',p_run_date,
    'outcomes_normalized',v_normalized,
    'observed_outcomes',v_observed_outcomes,
    'actions_linked',v_linked,
    'actions_completed_with_provider_readback',v_completed,
    'observed_realized_revenue_eur',v_observed_revenue,
    'truth_boundary','action completion requires provider_readback; realized revenue is only observed powerhouse_sales_outcomes.revenue_eur'
  );
end;
$$;

revoke all on function public.powerhouse_reconcile_commercial_outcomes_v2(date) from public, anon, authenticated;
grant execute on function public.powerhouse_reconcile_commercial_outcomes_v2(date) to service_role;

create or replace function public.powerhouse_calibrate_due_forecasts_v2(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date)
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_inserted integer := 0;
  v_obligations_closed integer := 0;
  v_avg_brier numeric := null;
  v_latest timestamptz := null;
begin
  with due as (
    select f.*
    from public.powerhouse_forecasts f
    where f.expected_by < p_run_date
      and f.status in ('active','claimed')
      and not exists(
        select 1 from public.powerhouse_forecast_calibration c where c.forecast_id=f.forecast_id
      )
  ), measured as (
    select d.*,
      exists(
        select 1
        from public.powerhouse_sales_outcomes o
        where o.occurred_at >= d.created_at
          and o.occurred_at < ((d.horizon_end+1)::timestamp at time zone 'Europe/Amsterdam')
          and (
            (nullif(d.evidence->>'opportunity_key','') is not null and o.opportunity_key=d.evidence->>'opportunity_key')
            or (d.topic_key is not null and o.topic_key=d.topic_key)
            or (d.scope='person' and o.person_key=d.scope_key)
            or (d.scope='company' and o.company_key=d.scope_key)
          )
          and lower(coalesce(o.outcome_type,'')) ~ '(reply|response|meeting|appointment|qualified|offer|proposal|won|order|revenue|deal)'
      ) as occurred,
      (
        select min(o.occurred_at)
        from public.powerhouse_sales_outcomes o
        where o.occurred_at >= d.created_at
          and o.occurred_at < ((d.horizon_end+1)::timestamp at time zone 'Europe/Amsterdam')
          and (
            (nullif(d.evidence->>'opportunity_key','') is not null and o.opportunity_key=d.evidence->>'opportunity_key')
            or (d.topic_key is not null and o.topic_key=d.topic_key)
            or (d.scope='person' and o.person_key=d.scope_key)
            or (d.scope='company' and o.company_key=d.scope_key)
          )
          and lower(coalesce(o.outcome_type,'')) ~ '(reply|response|meeting|appointment|qualified|offer|proposal|won|order|revenue|deal)'
      ) as actual_event_at,
      coalesce((
        select sum(o.revenue_eur)
        from public.powerhouse_sales_outcomes o
        where o.occurred_at >= d.created_at
          and o.occurred_at < ((d.horizon_end+1)::timestamp at time zone 'Europe/Amsterdam')
          and (
            (nullif(d.evidence->>'opportunity_key','') is not null and o.opportunity_key=d.evidence->>'opportunity_key')
            or (d.topic_key is not null and o.topic_key=d.topic_key)
            or (d.scope='person' and o.person_key=d.scope_key)
            or (d.scope='company' and o.company_key=d.scope_key)
          )
      ),0) as observed_revenue_eur
    from due d
  ), inserted as (
    insert into public.powerhouse_forecast_calibration(
      forecast_id,measured_at,actual_event_occurred,actual_event_at,timing_error_days,probability_error,
      first_mover_advantage_score,content_lift,revenue_influence,evidence,outcome_value,brier_component,
      actual_lead_days,attribution_confidence,revenue_eur,content_ids
    )
    select
      m.forecast_id,v_now,m.occurred,m.actual_event_at,
      case when m.actual_event_at is null then null
        else round((extract(epoch from(m.actual_event_at-m.created_at))/86400.0-coalesce(m.expected_lead_days,0))::numeric,2) end,
      public.powerhouse_forecast_brier(m.probability,case when m.occurred then 1 else 0 end),
      case when m.occurred then m.first_mover_score else 0 end,
      null,
      m.observed_revenue_eur,
      jsonb_build_object(
        'contract','powerhouse-commercial-activation-v3',
        'measurement','post-prediction observed commercial outcome',
        'observation_window_start',m.created_at,
        'observation_window_end',m.horizon_end,
        'forecast_class',m.evidence->>'forecast_class',
        'opportunity_key',m.evidence->>'opportunity_key',
        'truth_boundary','only outcomes with occurred_at >= forecast created_at and inside the forecast horizon are eligible'
      ),
      case when m.occurred then 1 else 0 end,
      public.powerhouse_forecast_brier(m.probability,case when m.occurred then 1 else 0 end),
      case when m.actual_event_at is null then null else round((extract(epoch from(m.actual_event_at-m.created_at))/86400.0)::numeric,2) end,
      1.0,
      m.observed_revenue_eur,
      array[]::text[]
    from measured m
    returning forecast_id,brier_component,measured_at
  )
  select count(*)::integer,avg(brier_component),max(measured_at)
    into v_inserted,v_avg_brier,v_latest
  from inserted;

  update public.powerhouse_forecasts f
  set status=case when c.actual_event_occurred then 'materialized' else 'expired' end,
      materialized_at=case when c.actual_event_occurred then c.actual_event_at else null end,
      outcome=jsonb_build_object(
        'contract','powerhouse-commercial-activation-v3',
        'actual_event_occurred',c.actual_event_occurred,
        'brier_component',c.brier_component,
        'revenue_eur',c.revenue_eur,
        'measured_at',c.measured_at
      ),
      updated_at=v_now
  from public.powerhouse_forecast_calibration c
  where c.forecast_id=f.forecast_id and c.measured_at=v_now;

  update public.revenue_learning_obligations r
  set status='CLOSED',
      payload=coalesce(r.payload,'{}'::jsonb) || jsonb_build_object(
        'completion_contract','powerhouse-commercial-activation-v3',
        'closed_at',v_now,
        'calibration_proven',true
      ),
      updated_at=v_now
  where r.tenant_id='canonical'
    and r.type='FORECAST_CALIBRATION'
    and r.status='OPEN'
    and r.due_at <= v_now
    and exists(
      select 1 from public.powerhouse_forecast_calibration c
      where c.forecast_id=(r.payload->>'forecast_id')::uuid
    );
  get diagnostics v_obligations_closed = row_count;

  return jsonb_build_object(
    'contract','powerhouse-commercial-activation-v3',
    'run_date',p_run_date,
    'forecasts_calibrated',v_inserted,
    'calibration_obligations_closed',v_obligations_closed,
    'average_brier_score',v_avg_brier,
    'latest_calibration_at',v_latest,
    'truth_boundary','forecast calibration uses only post-prediction outcomes inside the elapsed observation horizon'
  );
exception when check_violation then
  return jsonb_build_object(
    'contract','powerhouse-commercial-activation-v3',
    'run_date',p_run_date,
    'forecasts_calibrated',v_inserted,
    'calibration_obligations_closed',0,
    'average_brier_score',v_avg_brier,
    'latest_calibration_at',v_latest,
    'obligation_status_hold','existing revenue_learning_obligations status contract rejected CLOSED; no constraint was weakened',
    'truth_boundary','forecast calibration remains recorded; obligation row is left fail-closed'
  );
end;
$$;

revoke all on function public.powerhouse_calibrate_due_forecasts_v2(date) from public, anon, authenticated;
grant execute on function public.powerhouse_calibrate_due_forecasts_v2(date) to service_role;

create or replace function public.powerhouse_decide_mature_experiments_v2(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date)
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_promoted integer := 0;
  v_held integer := 0;
  v_measuring integer := 0;
  v_learning_sample integer := 0;
begin
  with observed as (
    select
      e.tenant_id,e.experiment_id,
      greatest(1,coalesce(e.min_steekproef,1)) as min_sample,
      coalesce(e.beslisdatum,e.calendar_date+coalesce(e.looptijd_dagen,0),(e.started_at at time zone 'Europe/Amsterdam')::date+coalesce(e.looptijd_dagen,0)) as decision_date,
      count(distinct k.post_key)::integer as observed_posts,
      count(o.outcome_id)::integer as commercial_outcomes,
      coalesce(sum(o.revenue_eur),0) as observed_revenue_eur
    from public.social_experiments e
    left join public.bg_post_kenmerken k on k.experiment_id=e.experiment_id
    left join public.powerhouse_sales_outcomes o on o.content_key=k.post_key
    where e.tenant_id='canonical'
      and e.status in ('ACTIVE','PLANNED','INSUFFICIENT_EVIDENCE')
    group by e.tenant_id,e.experiment_id,e.min_steekproef,e.beslisdatum,e.calendar_date,e.looptijd_dagen,e.started_at
  ), decisions as (
    select *,case
      when decision_date is null or decision_date>p_run_date or observed_posts<min_sample then 'CONTINUE_MEASURING'
      when commercial_outcomes>0 or observed_revenue_eur>0 then 'PROMOTE_COMMERCIAL_EVIDENCE'
      else 'HOLD_NO_COMMERCIAL_EVIDENCE'
    end as decision
    from observed
  )
  update public.social_experiments e
  set resultaat=coalesce(e.resultaat,'{}'::jsonb) || jsonb_build_object(
        'commercial_activation_v3',jsonb_build_object(
          'observed_posts',d.observed_posts,
          'minimum_sample',d.min_sample,
          'commercial_outcomes',d.commercial_outcomes,
          'observed_realized_revenue_eur',d.observed_revenue_eur,
          'decision_date',d.decision_date,
          'decision',d.decision,
          'evaluated_at',v_now,
          'causality_class',case when d.decision='PROMOTE_COMMERCIAL_EVIDENCE' then 'observed_association' else 'unresolved_causality' end,
          'truth_boundary','commercial evidence can justify promotion for review; experimentally supported lift requires a valid baseline/comparison and is never inferred from association alone'
        )
      ),
      advies=d.decision,
      besluit=case when d.decision in ('PROMOTE_COMMERCIAL_EVIDENCE','HOLD_NO_COMMERCIAL_EVIDENCE') then d.decision else e.besluit end,
      besloten_op=case when d.decision in ('PROMOTE_COMMERCIAL_EVIDENCE','HOLD_NO_COMMERCIAL_EVIDENCE') then coalesce(e.besloten_op,v_now) else e.besloten_op end,
      status=case
        when d.decision='PROMOTE_COMMERCIAL_EVIDENCE' then 'COMPLETE'
        when d.decision='HOLD_NO_COMMERCIAL_EVIDENCE' then 'COMPLETE'
        when d.decision='CONTINUE_MEASURING' and d.decision_date is not null and d.decision_date<=p_run_date then 'INSUFFICIENT_EVIDENCE'
        else e.status
      end,
      updated_at=v_now
  from decisions d
  where e.tenant_id=d.tenant_id and e.experiment_id=d.experiment_id;

  select
    count(*) filter(where e.besluit='PROMOTE_COMMERCIAL_EVIDENCE')::integer,
    count(*) filter(where e.besluit='HOLD_NO_COMMERCIAL_EVIDENCE')::integer,
    count(*) filter(where e.advies='CONTINUE_MEASURING')::integer
  into v_promoted,v_held,v_measuring
  from public.social_experiments e
  where e.tenant_id='canonical';

  v_learning_sample := v_promoted+v_held;
  insert into public.powerhouse_sales_learnings(
    fingerprint,subject_key,scope,hypothesis,evidence,effect,confidence,status,sample_size,expires_at,updated_at
  ) values(
    'commercial-experiment-decisions-v3','powerhouse','commercial_experiments',
    'Experiment decisions improve when minimum sample, observed commercial outcomes and causal truth boundaries are explicit.',
    jsonb_build_object(
      'contract','powerhouse-commercial-activation-v3',
      'promoted_for_commercial_evidence',v_promoted,
      'held_no_commercial_evidence',v_held,
      'continue_measuring',v_measuring,
      'causality_rule','observed association is not experimentally supported lift without a valid comparison/baseline'
    ),
    jsonb_build_object(
      'decision_policy','PROMOTE_COMMERCIAL_EVIDENCE only after min sample and observed commercial evidence; otherwise HOLD or CONTINUE_MEASURING',
      'experimentally_supported_lift',false
    ),
    case when v_learning_sample>=5 then 0.70 else 0.35 end,
    case when v_learning_sample>=5 then 'active' else 'observed' end,
    greatest(1,v_learning_sample),
    v_now+interval '30 days',v_now
  )
  on conflict(fingerprint) do update set
    evidence=excluded.evidence,effect=excluded.effect,confidence=excluded.confidence,status=excluded.status,
    sample_size=excluded.sample_size,expires_at=excluded.expires_at,updated_at=v_now;

  return jsonb_build_object(
    'contract','powerhouse-commercial-activation-v3',
    'run_date',p_run_date,
    'promoted_for_commercial_evidence',v_promoted,
    'held_no_commercial_evidence',v_held,
    'continue_measuring',v_measuring,
    'truth_boundary','no fake winner; experimentally supported lift requires a valid baseline/comparison and sufficient observed evidence'
  );
end;
$$;

revoke all on function public.powerhouse_decide_mature_experiments_v2(date) from public, anon, authenticated;
grant execute on function public.powerhouse_decide_mature_experiments_v2(date) to service_role;

create or replace function public.powerhouse_commercial_activation_v3(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date)
)
returns jsonb
language plpgsql
set search_path = public, pg_temp, cron
as $$
declare
  v_before jsonb;
  v_economics jsonb;
  v_outcomes jsonb;
  v_calibration jsonb;
  v_experiments jsonb;
  v_after jsonb;
  v_predictive jsonb;
  v_execution jsonb;
  v_healthy boolean := false;
  v_payload jsonb;
begin
  v_before := public.powerhouse_commercial_closed_loop_v2(p_run_date);
  v_economics := public.powerhouse_refresh_opportunity_economics_v2(p_run_date);
  v_outcomes := public.powerhouse_reconcile_commercial_outcomes_v2(p_run_date);
  v_calibration := public.powerhouse_calibrate_due_forecasts_v2(p_run_date);
  v_experiments := public.powerhouse_decide_mature_experiments_v2(p_run_date);
  v_after := public.powerhouse_commercial_closed_loop_v2(p_run_date);
  v_predictive := public.powerhouse_predictive_health(p_run_date);
  v_execution := public.powerhouse_execution_status(p_run_date);

  v_healthy := coalesce((v_after->>'required_sources_bad')::integer,999)=0
    and coalesce((v_predictive->>'healthy')::boolean,false)
    and coalesce((v_execution->>'execution_complete')::boolean,false)
    and not (v_economics ? 'error')
    and not (v_outcomes ? 'error')
    and not (v_calibration ? 'error')
    and not (v_experiments ? 'error');

  v_payload := jsonb_build_object(
    'contract','powerhouse-commercial-activation-v3',
    'run_date',p_run_date,
    'healthy',v_healthy,
    'closed_loop_before',v_before,
    'opportunity_economics',v_economics,
    'outcome_reconciliation',v_outcomes,
    'forecast_calibration',v_calibration,
    'experiment_decisions',v_experiments,
    'closed_loop_after',v_after,
    'predictive_health',v_predictive,
    'execution_status',v_execution,
    'truth_boundary','modeled priors are decision support only; action completion requires provider_readback; observed realized revenue remains authoritative',
    'executed_at',now()
  );

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values(
    'powerhouse-commercial-activation-v3:'||p_run_date::text,
    'commercial_activation','powerhouse-commercial-activation-v3','growth-revenue-os',now(),v_payload,
    jsonb_build_object(
      'existing_state_first',true,'reuse_first',true,'no_parallel_system',true,
      'prevention_rule','predict -> act -> provider readback -> observed outcome -> calibrate -> experiment decision -> next better decision'
    ),
    case when v_healthy then 'closed' else 'error' end,
    'OBSERVED',1,now()
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
    state=excluded.state,data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=now();

  insert into public.powerhouse_sales_learnings(
    fingerprint,subject_key,scope,hypothesis,evidence,effect,confidence,status,sample_size,expires_at,updated_at
  ) values(
    'powerhouse-commercial-activation-v3','growth-revenue-os','system',
    'The commercial machine improves when observed pricing supports conservative economics, provider-proven actions feed observed outcomes, due forecasts calibrate, and experiments decide without fake winners.',
    v_payload,
    jsonb_build_object(
      'prevention_rule','No revenue/model/action/experiment maturity is promoted without its corresponding observed evidence and truth boundary.',
      'closed_loop','predict -> act -> readback -> outcome -> calibrate -> decide -> adapt'
    ),
    case when v_healthy then 0.95 else 0.45 end,
    case when v_healthy then 'proven' else 'active' end,
    greatest(1,coalesce((v_outcomes->>'observed_outcomes')::integer,0)+coalesce((v_calibration->>'forecasts_calibrated')::integer,0)),
    now()+interval '30 days',now()
  )
  on conflict(fingerprint) do update set
    evidence=excluded.evidence,effect=excluded.effect,confidence=excluded.confidence,status=excluded.status,
    sample_size=excluded.sample_size,expires_at=excluded.expires_at,updated_at=now();

  return v_payload;
exception when others then
  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values(
    'powerhouse-commercial-activation-v3-error:'||to_char(now() at time zone 'UTC','YYYYMMDDHH24MI'),
    'commercial_activation_failed','powerhouse-commercial-activation-v3','growth-revenue-os',now(),
    jsonb_build_object('error',sqlerrm,'sqlstate',sqlstate,'run_date',p_run_date),
    jsonb_build_object('fail_closed',true),'error','OBSERVED',1,now()
  ) on conflict(dedupe_key) do nothing;
  return jsonb_build_object('contract','powerhouse-commercial-activation-v3','healthy',false,'error',sqlerrm,'sqlstate',sqlstate,'run_date',p_run_date);
end;
$$;

revoke all on function public.powerhouse_commercial_activation_v3(date) from public, anon, authenticated;
grant execute on function public.powerhouse_commercial_activation_v3(date) to service_role;

-- Retarget the existing single scheduler authority. Do not create another scheduler.
do $$
declare v_job_id bigint;
begin
  select jobid into v_job_id from cron.job where jobname='powerhouse-execution-guard-hourly' limit 1;
  if v_job_id is null then
    raise exception 'Required existing cron job powerhouse-execution-guard-hourly not found';
  end if;
  perform cron.alter_job(v_job_id, command := 'select public.powerhouse_commercial_activation_v3();');
end $$;
