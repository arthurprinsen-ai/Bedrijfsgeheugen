-- Powerhouse Execution & Learning Closure v1
-- Reuse existing experiment, forecast, opportunity, outcome and learning lineage.
-- No parallel stores. No fabricated commercial truth.

create or replace function public.powerhouse_execution_learning_closure_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date)
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_now timestamptz := now();
  v_lock_ok boolean := false;
  v_experiments_activated integer := 0;
  v_experiments_decided integer := 0;
  v_outcomes_closed integer := 0;
  v_opportunities_modeled integer := 0;
  v_due_calibrations integer := 0;
  v_calibrator_request bigint := null;
  v_offer_prior_eur numeric := 0;
  v_offer_sample integer := 0;
  v_offer_confidence numeric := 0;
  v_closed_loop jsonb := '{}'::jsonb;
  v_result jsonb;
begin
  -- Serialize the scheduler-owned execution path. A concurrent run must not
  -- compete for the same runtime-event dedupe rows and deadlock.
  select pg_try_advisory_xact_lock(hashtextextended('powerhouse-execution-learning-closure-v1',0))
    into v_lock_ok;

  if not v_lock_ok then
    return jsonb_build_object(
      'contract','powerhouse-execution-learning-closure-v1',
      'healthy',true,
      'status','concurrent_skip',
      'run_date',p_run_date,
      'truth_boundary','a concurrent scheduler-owned closure is already active; no competing writes were attempted'
    );
  end if;

  -- 1. Experiment executor: PLANNED becomes ACTIVE only after a genuinely
  -- published post is linked to the experiment. Merely having a plan/date is
  -- never sufficient evidence of execution.
  with activation as (
    select
      e.experiment_id,
      count(distinct p.post_id) as published_posts,
      min(p.published_at) as first_published_at,
      max(p.published_at) as last_published_at
    from public.social_experiments e
    join public.bg_post_kenmerken k
      on k.experiment_id=e.experiment_id
    join public.social_posts p
      on p.tenant_id='canonical'
     and p.post_id=k.post_key
     and p.published_at is not null
    where e.tenant_id='canonical'
      and e.status='PLANNED'
    group by e.experiment_id
  )
  update public.social_experiments e
     set status='ACTIVE',
         started_at=least(e.started_at,a.first_published_at),
         resultaat=coalesce(e.resultaat,'{}'::jsonb) || jsonb_build_object(
           'execution_learning_closure_v1',jsonb_build_object(
             'activation_evidence','published linked post observed',
             'published_posts',a.published_posts,
             'first_published_at',a.first_published_at,
             'last_published_at',a.last_published_at,
             'activated_at',v_now,
             'truth_boundary','PLANNED is not promoted without production publication evidence'
           )
         ),
         updated_at=v_now
    from activation a
   where e.tenant_id='canonical'
     and e.experiment_id=a.experiment_id
     and e.status='PLANNED';
  get diagnostics v_experiments_activated = row_count;

  -- 2. Measure experiments from the latest observed provider metrics per post
  -- plus canonical commercial outcomes. A completed measurement is a decision,
  -- not automatically a winner claim. Canonical snapshot metric keys are lowercase.
  with latest_metric as (
    select distinct on (s.post_id)
      s.post_id,s.observed_at,s.metrics
    from public.social_metric_snapshots s
    where s.tenant_id='canonical'
    order by s.post_id,s.observed_at desc
  ), measured as (
    select
      e.experiment_id,
      count(distinct p.post_id) as published_posts,
      count(distinct lm.post_id) as posts_with_metrics,
      coalesce(sum(greatest(
        coalesce(nullif(regexp_replace(coalesce(lm.metrics->>'impressions','0'),'[^0-9.]','','g'),'')::numeric,0),
        coalesce(nullif(regexp_replace(coalesce(lm.metrics->>'reach','0'),'[^0-9.]','','g'),'')::numeric,0)
      )),0) as sample_volume,
      coalesce(sum(coalesce(nullif(regexp_replace(coalesce(lm.metrics->>'reactions','0'),'[^0-9.]','','g'),'')::numeric,0)),0) as reactions,
      coalesce(sum(coalesce(nullif(regexp_replace(coalesce(lm.metrics->>'comments','0'),'[^0-9.]','','g'),'')::numeric,0)),0) as comments,
      coalesce(sum(coalesce(nullif(regexp_replace(coalesce(lm.metrics->>'shares','0'),'[^0-9.]','','g'),'')::numeric,0)),0) as shares,
      max(lm.observed_at) as metrics_observed_at,
      count(distinct o.outcome_id) as commercial_outcomes,
      coalesce(sum(o.revenue_eur),0) as realized_revenue_eur,
      greatest(1,coalesce(e.min_steekproef,1)) as minimum_sample,
      coalesce(e.beslisdatum,
        ((e.started_at at time zone 'Europe/Amsterdam')::date + greatest(1,coalesce(e.looptijd_dagen,7)))) as decision_date
    from public.social_experiments e
    left join public.bg_post_kenmerken k on k.experiment_id=e.experiment_id
    left join public.social_posts p
      on p.tenant_id='canonical' and p.post_id=k.post_key and p.published_at is not null
    left join latest_metric lm on lm.post_id=p.post_id
    left join public.powerhouse_sales_outcomes o on o.content_key=k.post_key
    where e.tenant_id='canonical' and e.status='ACTIVE'
    group by e.experiment_id,e.min_steekproef,e.beslisdatum,e.started_at,e.looptijd_dagen
  )
  update public.social_experiments e
     set resultaat=coalesce(e.resultaat,'{}'::jsonb) || jsonb_build_object(
           'execution_learning_closure_v1_measurement',jsonb_build_object(
             'published_posts',m.published_posts,
             'posts_with_metrics',m.posts_with_metrics,
             'sample_volume',m.sample_volume,
             'minimum_sample',m.minimum_sample,
             'reactions',m.reactions,
             'comments',m.comments,
             'shares',m.shares,
             'commercial_outcomes',m.commercial_outcomes,
             'realized_revenue_eur',m.realized_revenue_eur,
             'metrics_observed_at',m.metrics_observed_at,
             'decision_date',m.decision_date,
             'evaluated_at',v_now,
             'truth_boundary','never fabricate experiment winner; COMPLETE means measurement decision is evidence-backed, not that a variant won'
           )
         ),
         advies=case
           when m.metrics_observed_at is null then 'WAIT_PROVIDER_METRICS'
           when m.sample_volume < m.minimum_sample then 'CONTINUE_MEASURING'
           when m.decision_date > p_run_date then 'CONTINUE_UNTIL_DECISION_DATE'
           when m.commercial_outcomes>0 or m.realized_revenue_eur>0 then 'COMMERCIAL_SIGNAL_OBSERVED'
           else 'MEASURED_NO_COMMERCIAL_SIGNAL_YET'
         end,
         status=case
           when m.metrics_observed_at is not null
            and m.sample_volume >= m.minimum_sample
            and m.decision_date <= p_run_date
           then 'COMPLETE' else e.status end,
         ended_at=case
           when m.metrics_observed_at is not null
            and m.sample_volume >= m.minimum_sample
            and m.decision_date <= p_run_date
           then coalesce(e.ended_at,v_now) else e.ended_at end,
         besluit=case
           when m.metrics_observed_at is not null
            and m.sample_volume >= m.minimum_sample
            and m.decision_date <= p_run_date
            and (m.commercial_outcomes>0 or m.realized_revenue_eur>0)
           then 'COMMERCIAL_SIGNAL_OBSERVED_NO_WINNER_CLAIM'
           when m.metrics_observed_at is not null
            and m.sample_volume >= m.minimum_sample
            and m.decision_date <= p_run_date
           then 'MEASURED_NO_WINNER_CLAIM'
           else e.besluit end,
         besloten_op=case
           when m.metrics_observed_at is not null
            and m.sample_volume >= m.minimum_sample
            and m.decision_date <= p_run_date
           then coalesce(e.besloten_op,v_now) else e.besloten_op end,
         updated_at=v_now
    from measured m
   where e.tenant_id='canonical'
     and e.experiment_id=m.experiment_id;

  select count(*) into v_experiments_decided
  from public.social_experiments e
  where e.tenant_id='canonical'
    and e.status='COMPLETE'
    and e.besloten_op >= v_now - interval '2 minutes'
    and e.resultaat ? 'execution_learning_closure_v1_measurement';

  -- 3. Outcome sweeper: close only obligations backed by an observed canonical
  -- sales outcome. Unknown responses/conversions remain pending.
  update public.powerhouse_runtime_events r
     set state='closed',
         evidence=coalesce(r.evidence,'{}'::jsonb) || jsonb_build_object(
           'observed_outcome_id',o.outcome_id,
           'observed_outcome_type',o.outcome_type,
           'observed_revenue_eur',o.revenue_eur,
           'observed_outcome_at',o.occurred_at,
           'closed_at',v_now
         ),
         context=coalesce(r.context,'{}'::jsonb) || jsonb_build_object(
           'closed_by','powerhouse-execution-learning-closure-v1',
           'truth_boundary','outcome obligation closes only from an observed powerhouse_sales_outcomes row'
         ),
         updated_at=v_now
    from public.powerhouse_sales_outcomes o
   where r.event_type='outcome_readback_required'
     and r.state in ('decided','actioned')
     and nullif(r.evidence->>'action_id','') is not null
     and o.action_id=(r.evidence->>'action_id')::uuid;
  get diagnostics v_outcomes_closed = row_count;

  -- 4. Evidence-backed modeled economics. The pricing prior is built only from
  -- observed offer history. A matching active forecast is mandatory and supplies
  -- the company/topic-specific probability/confidence discount. This never
  -- overwrites expected_value_eur and is never presented as realized revenue.
  select
    coalesce(sum(v.avg_offer_eur*v.offers_observed*v.observed_win_rate)
      / nullif(sum(v.offers_observed),0),0),
    coalesce(sum(v.offers_observed),0)::integer
    into v_offer_prior_eur,v_offer_sample
  from public.powerhouse_offer_pricing_learning_v1 v
  where v.offers_observed>0 and v.avg_offer_eur>0;

  v_offer_confidence := least(0.85::numeric,
    0.20::numeric + least(0.65::numeric,(v_offer_sample::numeric/20.0)*0.65::numeric));

  with forecast_match as (
    select
      o.opportunity_id,
      max(coalesce(f.probability,0)*coalesce(f.confidence,0)) as forecast_score
    from public.powerhouse_opportunities o
    left join public.powerhouse_forecasts f
      on f.status in ('active','claimed')
     and ((o.company_key is not null and f.scope_key=o.company_key)
       or (o.topic_key is not null and f.topic_key=o.topic_key))
    where o.status='open'
    group by o.opportunity_id
  ), modeled as (
    select
      o.opportunity_id,
      round(greatest(0,
        v_offer_prior_eur
        * least(1,greatest(0,coalesce(o.probability,0)))
        * least(1,greatest(0,coalesce(o.confidence,0)))
        * coalesce(fm.forecast_score,0)
        * v_offer_confidence
      ),2) as modeled_value_eur,
      coalesce(fm.forecast_score,0) as forecast_score
    from public.powerhouse_opportunities o
    left join forecast_match fm on fm.opportunity_id=o.opportunity_id
    where o.status='open'
      and v_offer_prior_eur>0
      and v_offer_sample>0
      and coalesce(fm.forecast_score,0)>0
  )
  update public.powerhouse_opportunities o
     set expected_revenue_value=greatest(coalesce(o.expected_revenue_value,0),m.modeled_value_eur),
         score_components=coalesce(o.score_components,'{}'::jsonb) || jsonb_build_object(
           'execution_learning_closure_v1',jsonb_build_object(
             'modeled_value_eur',m.modeled_value_eur,
             'pricing_prior_expected_win_value_eur',round(v_offer_prior_eur,2),
             'pricing_prior_sample',v_offer_sample,
             'pricing_prior_confidence',round(v_offer_confidence,4),
             'forecast_score',round(m.forecast_score,4),
             'probability',o.probability,
             'opportunity_confidence',o.confidence,
             'truth_boundary','modeled value is not realized revenue and does not overwrite expected_value_eur'
           )
         ),
         evidence=coalesce(o.evidence,'{}'::jsonb) || jsonb_build_object(
           'execution_learning_closure_v1',jsonb_build_object(
             'modeled_at',v_now,
             'pricing_source','powerhouse_offer_pricing_learning_v1',
             'forecast_source','powerhouse_forecasts'
           )
         ),
         updated_at=v_now
    from modeled m
   where o.opportunity_id=m.opportunity_id
     and m.modeled_value_eur>0;
  get diagnostics v_opportunities_modeled = row_count;

  -- 5. Mature forecast calibration remains owned by the existing calibrator.
  select count(*) into v_due_calibrations
  from public.powerhouse_forecasts f
  where f.horizon_end < p_run_date
    and not exists (
      select 1 from public.powerhouse_forecast_calibration c
      where c.forecast_id=f.forecast_id
    );

  if v_due_calibrations>0 then
    select net.http_post(
      url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-forecast-calibrator',
      headers := jsonb_build_object(
        'content-type','application/json',
        'x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)
      ),
      body := jsonb_build_object('trigger','powerhouse-execution-learning-closure-v1'),
      timeout_milliseconds := 120000
    ) into v_calibrator_request;
  end if;

  -- 6. Existing canonical closed loop stays authoritative for intelligence,
  -- action preparation, source health and daily execution readback.
  v_closed_loop := public.powerhouse_commercial_closed_loop_v2(p_run_date);

  v_result := jsonb_build_object(
    'contract','powerhouse-execution-learning-closure-v1',
    'run_date',p_run_date,
    'executed_at',v_now,
    'healthy',coalesce((v_closed_loop->>'required_sources_bad')::integer,0)=0,
    'experiments_activated',v_experiments_activated,
    'experiments_decided',v_experiments_decided,
    'outcome_obligations_closed',v_outcomes_closed,
    'opportunities_modeled',v_opportunities_modeled,
    'offer_prior_expected_win_value_eur',round(v_offer_prior_eur,2),
    'offer_prior_sample',v_offer_sample,
    'offer_prior_confidence',round(v_offer_confidence,4),
    'due_calibrations',v_due_calibrations,
    'calibrator_request_id',v_calibrator_request,
    'closed_loop',v_closed_loop,
    'truth_boundary','no external response, conversion, experiment winner or realized revenue is invented; modeled economics remains explicitly modeled'
  );

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values (
    'execution-learning-closure:'||to_char(v_now at time zone 'UTC','YYYYMMDDHH24'),
    'execution_learning_closure_cycle','powerhouse-execution-learning-closure-v1','growth-revenue-os',v_now,
    v_result,
    jsonb_build_object('existing_state_first',true,'reuse_first',true,'no_parallel_system',true,'scheduler_owner',true),
    case when coalesce((v_closed_loop->>'required_sources_bad')::integer,0)=0 then 'closed' else 'error' end,
    'OBSERVED',1,v_now
  ) on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
    state=excluded.state,data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=v_now;

  insert into public.powerhouse_sales_learnings(
    fingerprint,subject_key,scope,hypothesis,evidence,effect,confidence,status,sample_size,updated_at
  ) values (
    'powerhouse-execution-learning-closure-v1','growth-revenue-os','system',
    'Commercial intelligence compounds only when planned experiments become evidence-backed execution, matured predictions are calibrated, economic priors are explicitly modeled, observed outcomes close obligations, and one scheduler-owned runtime path writes the result safely.',
    v_result,
    jsonb_build_object(
      'prevention_rule','Never mark experiments active without publication evidence, never claim winners without sample plus measured evidence, never overwrite declared value with modeled value, require a matching positive forecast for modeled opportunity economics, read canonical lowercase provider metrics, and serialize the scheduler-owned closed loop to avoid runtime-event deadlocks.',
      'reuse',jsonb_build_array('social_experiments','social_posts','social_metric_snapshots','powerhouse_forecasts','powerhouse-forecast-calibrator','powerhouse_offer_pricing_learning_v1','powerhouse_opportunities','powerhouse_sales_outcomes','powerhouse_commercial_closed_loop_v2')
    ),
    case when coalesce((v_closed_loop->>'required_sources_bad')::integer,0)=0 then 0.95 else 0.55 end,
    'active',
    greatest(1,v_experiments_activated+v_experiments_decided+v_outcomes_closed+v_opportunities_modeled+v_due_calibrations),
    v_now
  ) on conflict(fingerprint) do update set
    evidence=excluded.evidence,effect=excluded.effect,confidence=excluded.confidence,status=excluded.status,
    sample_size=excluded.sample_size,updated_at=v_now;

  return v_result;
exception when others then
  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values (
    'execution-learning-closure-error:'||to_char(now() at time zone 'UTC','YYYYMMDDHH24MI'),
    'execution_learning_closure_failed','powerhouse-execution-learning-closure-v1','growth-revenue-os',now(),
    jsonb_build_object('error',sqlerrm,'sqlstate',sqlstate,'run_date',p_run_date),
    jsonb_build_object('fail_closed',true),'error','OBSERVED',1,now()
  ) on conflict(dedupe_key) do nothing;
  return jsonb_build_object('contract','powerhouse-execution-learning-closure-v1','healthy',false,'error',sqlerrm,'sqlstate',sqlstate);
end;
$function$;

revoke execute on function public.powerhouse_execution_learning_closure_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_execution_learning_closure_v1(date) to service_role;

-- Replace the previous direct closed-loop scheduler owner with the serialized
-- execution/learning closure. Do not create a second competing hourly path.
do $$
begin
  if exists(select 1 from pg_extension where extname='pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname='powerhouse-execution-guard-hourly';
    perform cron.unschedule(jobid) from cron.job where jobname='powerhouse-execution-learning-closure-v1';
    perform cron.schedule(
      'powerhouse-execution-learning-closure-v1',
      '47 * * * *',
      'select public.powerhouse_execution_learning_closure_v1();'
    );
  end if;
end $$;

insert into public.powerhouse_runtime_events(
  dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence,updated_at
) values (
  'powerhouse-execution-learning-closure-v1:activation',
  'execution_learning_closure_activated',
  'powerhouse-execution-learning-closure-v1','growth-revenue-os',now(),
  jsonb_build_object(
    'contract','powerhouse-execution-learning-closure-v1',
    'schedule','47 * * * *',
    'replaces_job','powerhouse-execution-guard-hourly',
    'experiment_activation','published linked post required',
    'forecast_calibration','existing calibrator only when matured',
    'opportunity_economics','observed pricing prior + matching active forecast + opportunity probability/confidence, modeled only',
    'runtime_serialization','transaction advisory lock',
    'metric_contract','canonical lowercase social_metric_snapshots keys'
  ),
  jsonb_build_object('canonical_system','Bedrijfsgeheugen Powerhouse','no_parallel_system',true),
  'decided','verified',1,now()
) on conflict(dedupe_key) do update set
  evidence=excluded.evidence,context=excluded.context,state=excluded.state,
  data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=now();
