-- Close the observed upstream gap: predictive signals existed but no forecasts were materialized,
-- and zero-value opportunities could never produce safe research/content next-best-actions.
-- Reuse the existing canonical forecast/action tables; never invent revenue potential.

create or replace function public.powerhouse_sync_predictive_signal_forecast()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_day date := (new.observed_at at time zone 'Europe/Amsterdam')::date;
  v_lead integer := greatest(7, least(90, coalesce(new.lead_time_days,30)));
  v_probability numeric := least(1,greatest(0,coalesce(new.strength,0)));
  v_novelty numeric := least(1,greatest(0,coalesce(new.novelty,0)));
  v_confidence numeric := least(1,greatest(0,0.25 + 0.50*coalesce(new.strength,0) + 0.25*coalesce(new.novelty,0)));
begin
  if new.topic_key is null or new.entity_key is null then
    return new;
  end if;

  insert into public.powerhouse_forecasts(
    forecast_key,horizon_start,horizon_end,scope,scope_key,topic_key,
    predicted_event,predicted_problem,predicted_question,predicted_search_intent,predicted_buying_trigger,
    probability,confidence,expected_lead_days,first_mover_score,strategic_fit,revenue_potential,
    evidence_signal_ids,evidence,status,expected_by,signal_acceleration,market_saturation,whitespace_score,
    prediction_mode,last_scored_at,updated_at
  ) values (
    'signal:'||new.signal_id::text,
    v_day,v_day+v_lead,
    coalesce(nullif(new.entity_scope,''),'market'),new.entity_key,new.topic_key,
    concat(coalesce(new.direction,'emerging'),' ',replace(coalesce(new.signal_type,'market_signal'),'_',' '),' for ',new.topic_key),
    concat('Potential emerging need evidenced by ',new.topic_key),
    concat('What is changing around ',new.topic_key,'?'),
    case when new.source_type='search_demand' then 'research_demand' else 'market_research' end,
    null,
    v_probability,v_confidence,v_lead,
    round(100*v_novelty,2),
    v_probability,
    0,
    array[new.signal_id],
    jsonb_build_object(
      'contract','predictive-signal-to-forecast-v1',
      'source_signal_key',new.signal_key,
      'source_type',new.source_type,
      'source_ref',new.source_ref,
      'observed_at',new.observed_at,
      'revenue_policy','revenue_potential remains zero until observed commercial evidence exists'
    ),
    'active',v_day+v_lead,
    v_probability,
    1-v_novelty,
    v_novelty,
    'anticipatory',now(),now()
  )
  on conflict (forecast_key) do update set
    horizon_start=excluded.horizon_start,
    horizon_end=excluded.horizon_end,
    scope=excluded.scope,
    scope_key=excluded.scope_key,
    topic_key=excluded.topic_key,
    predicted_event=excluded.predicted_event,
    predicted_problem=excluded.predicted_problem,
    predicted_question=excluded.predicted_question,
    predicted_search_intent=excluded.predicted_search_intent,
    probability=excluded.probability,
    confidence=excluded.confidence,
    expected_lead_days=excluded.expected_lead_days,
    first_mover_score=excluded.first_mover_score,
    strategic_fit=excluded.strategic_fit,
    evidence_signal_ids=excluded.evidence_signal_ids,
    evidence=excluded.evidence,
    status='active',
    expected_by=excluded.expected_by,
    signal_acceleration=excluded.signal_acceleration,
    market_saturation=excluded.market_saturation,
    whitespace_score=excluded.whitespace_score,
    prediction_mode=excluded.prediction_mode,
    last_scored_at=now(),
    updated_at=now();

  return new;
end
$$;

revoke execute on function public.powerhouse_sync_predictive_signal_forecast() from public, anon, authenticated;
grant execute on function public.powerhouse_sync_predictive_signal_forecast() to service_role;

drop trigger if exists trg_powerhouse_sync_predictive_signal_forecast on public.powerhouse_predictive_signals;
create trigger trg_powerhouse_sync_predictive_signal_forecast
after insert or update of observed_at,entity_scope,entity_key,topic_key,signal_type,direction,strength,novelty,lead_time_days,evidence
on public.powerhouse_predictive_signals
for each row execute function public.powerhouse_sync_predictive_signal_forecast();

-- Bootstrap the already-observed canonical signals. Revenue potential deliberately stays zero.
insert into public.powerhouse_forecasts(
  forecast_key,horizon_start,horizon_end,scope,scope_key,topic_key,
  predicted_event,predicted_problem,predicted_question,predicted_search_intent,predicted_buying_trigger,
  probability,confidence,expected_lead_days,first_mover_score,strategic_fit,revenue_potential,
  evidence_signal_ids,evidence,status,expected_by,signal_acceleration,market_saturation,whitespace_score,
  prediction_mode,last_scored_at,updated_at
)
select
  'signal:'||s.signal_id::text,
  (s.observed_at at time zone 'Europe/Amsterdam')::date,
  (s.observed_at at time zone 'Europe/Amsterdam')::date + greatest(7,least(90,coalesce(s.lead_time_days,30))),
  coalesce(nullif(s.entity_scope,''),'market'),s.entity_key,s.topic_key,
  concat(coalesce(s.direction,'emerging'),' ',replace(coalesce(s.signal_type,'market_signal'),'_',' '),' for ',s.topic_key),
  concat('Potential emerging need evidenced by ',s.topic_key),
  concat('What is changing around ',s.topic_key,'?'),
  case when s.source_type='search_demand' then 'research_demand' else 'market_research' end,
  null,
  least(1,greatest(0,coalesce(s.strength,0))),
  least(1,greatest(0,0.25+0.50*coalesce(s.strength,0)+0.25*coalesce(s.novelty,0))),
  greatest(7,least(90,coalesce(s.lead_time_days,30))),
  round(100*least(1,greatest(0,coalesce(s.novelty,0))),2),
  least(1,greatest(0,coalesce(s.strength,0))),
  0,
  array[s.signal_id],
  jsonb_build_object(
    'contract','predictive-signal-to-forecast-v1','source_signal_key',s.signal_key,
    'source_type',s.source_type,'source_ref',s.source_ref,'observed_at',s.observed_at,
    'revenue_policy','revenue_potential remains zero until observed commercial evidence exists'
  ),
  'active',
  (s.observed_at at time zone 'Europe/Amsterdam')::date + greatest(7,least(90,coalesce(s.lead_time_days,30))),
  least(1,greatest(0,coalesce(s.strength,0))),
  1-least(1,greatest(0,coalesce(s.novelty,0))),
  least(1,greatest(0,coalesce(s.novelty,0))),
  'anticipatory',now(),now()
from public.powerhouse_predictive_signals s
where s.topic_key is not null and s.entity_key is not null
on conflict (forecast_key) do update set
  horizon_start=excluded.horizon_start,horizon_end=excluded.horizon_end,scope=excluded.scope,
  scope_key=excluded.scope_key,topic_key=excluded.topic_key,predicted_event=excluded.predicted_event,
  predicted_problem=excluded.predicted_problem,predicted_question=excluded.predicted_question,
  predicted_search_intent=excluded.predicted_search_intent,probability=excluded.probability,
  confidence=excluded.confidence,expected_lead_days=excluded.expected_lead_days,
  first_mover_score=excluded.first_mover_score,strategic_fit=excluded.strategic_fit,
  evidence_signal_ids=excluded.evidence_signal_ids,evidence=excluded.evidence,status='active',
  expected_by=excluded.expected_by,signal_acceleration=excluded.signal_acceleration,
  market_saturation=excluded.market_saturation,whitespace_score=excluded.whitespace_score,
  prediction_mode=excluded.prediction_mode,last_scored_at=now(),updated_at=now();

-- Zero observed revenue/value must never unlock outbound. It may still create internal/content work so the flywheel learns.
do $$
declare
  v_before text;
  v_after text;
begin
  select pg_get_functiondef('public.powerhouse_autonomous_growth_revenue_cycle(date)'::regprocedure) into v_before;
  v_after := v_before;
  v_after := regexp_replace(v_after,
    'when e\.buying_window>=0\.72 and e\.person_key is not null then ''direct_personal_outreach''',
    'when e.expected_value_eur>0 and e.buying_window>=0.72 and e.person_key is not null then ''direct_personal_outreach''','g');
  v_after := regexp_replace(v_after,
    'when e\.buying_window>=0\.58 then ''warm_account_activation''',
    'when e.expected_value_eur>0 and e.buying_window>=0.58 then ''warm_account_activation''','g');
  v_after := regexp_replace(v_after,
    'when e\.buying_window>=0\.72 and e\.person_key is not null then ''linkedin''',
    'when e.expected_value_eur>0 and e.buying_window>=0.72 and e.person_key is not null then ''linkedin''','g');
  v_after := regexp_replace(v_after,
    'when e\.buying_window>=0\.58 and e\.person_key is not null then ''email''',
    'when e.expected_value_eur>0 and e.buying_window>=0.58 and e.person_key is not null then ''email''','g');
  v_after := replace(v_after,
    'where o.status=''open'' and o.expected_revenue_value>0',
    'where o.status=''open'' and (o.expected_revenue_value>0 or (o.probability*o.confidence)>=0.20)');

  if v_after = v_before then
    raise exception 'autonomy safe-zero-value patch did not match current function body';
  end if;
  if position('expected_revenue_value>0 or (o.probability*o.confidence)>=0.20' in v_after)=0 then
    raise exception 'autonomy safe-zero-value ranking patch missing';
  end if;
  execute v_after;
end
$$;

insert into public.brain_failure_registry(
  fingerprint,maturity,root_cause,proven_fix,prevention_rule,regression_ref,
  occurrence_count,version,first_seen_at,last_seen_at,evidence
)
values(
  'predictive-signals-without-forecast-materialization-v1','OBSERVED',
  'Fresh predictive signals were present, but the canonical forecast table contained zero active forecasts; zero-value opportunities were therefore scored but could not materialize even safe research/content actions.',
  'Materialize a traceable zero-revenue forecast for every canonical predictive signal and allow zero-value opportunities to create only safe content/research actions while keeping direct outreach gated on positive observed value.',
  'Every predictive signal with entity + topic must have a canonical forecast lineage. Never invent revenue_potential. Zero-value opportunities may inform research/content learning but must not unlock direct outreach.',
  'tests/supabase-powerhouse-signal-forecast-materialization.test.mjs|predictive-signal-to-forecast-v1',
  1,1,now(),now(),
  jsonb_build_object('observed_on','2026-09-15','signals_observed',45,'forecasts_before_fix',0,'invented_revenue',false,'parallel_system',false)
)
on conflict (fingerprint) do update set
  root_cause=excluded.root_cause,proven_fix=excluded.proven_fix,prevention_rule=excluded.prevention_rule,
  regression_ref=excluded.regression_ref,occurrence_count=public.brain_failure_registry.occurrence_count+1,
  version=greatest(public.brain_failure_registry.version,excluded.version),last_seen_at=now(),
  evidence=coalesce(public.brain_failure_registry.evidence,'{}'::jsonb)||excluded.evidence;
