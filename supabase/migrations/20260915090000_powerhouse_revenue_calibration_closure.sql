-- Canonical Brain -> Powerhouse revenue calibration closure.
-- Reuses existing Powerhouse tables; no parallel source of truth.

create or replace function public.powerhouse_project_brain_revenue_learning()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  learning_type text := new.payload->>'learningType';
  prediction jsonb;
  settled jsonb;
  forecast_uuid uuid;
  action_uuid uuid;
  decision_key text;
  entity_key text;
  predicted_at timestamptz;
  occurred_at timestamptz;
  meeting_value integer;
  revenue_value numeric;
begin
  if new.record_type <> 'Learning' or new.record_kind <> 'learning' then
    return new;
  end if;

  if learning_type = 'revenue_prediction' then
    prediction := new.payload->'prediction';
    if coalesce(prediction->>'schema_version','') <> 'powerhouse.decision-prediction.v1' then
      raise exception 'POWERHOUSE_REVENUE_PREDICTION_SCHEMA_REQUIRED';
    end if;
    decision_key := prediction->>'decision_id';
    entity_key := prediction->>'entity_id';
    predicted_at := coalesce((prediction->>'predicted_at')::timestamptz,new.observed_at);

    insert into public.powerhouse_forecasts(
      forecast_key,horizon_start,horizon_end,scope,scope_key,topic_key,predicted_event,
      predicted_problem,predicted_buying_trigger,probability,confidence,expected_lead_days,
      first_mover_score,strategic_fit,revenue_potential,evidence_signal_ids,evidence,status,
      prediction_mode,last_scored_at
    ) values (
      'brain-revenue:'||new.tenant_id||':'||decision_key,
      predicted_at::date,(predicted_at + interval '30 days')::date,'company',entity_key,
      'commercial-meeting','meeting','commercial opportunity requires verified follow-up',
      prediction->'recommended_action'->>'type',
      (prediction->'prediction'->>'meeting_probability')::numeric,
      (prediction->'prediction'->>'confidence')::numeric,
      30,
      greatest(0,least(100,coalesce((prediction->'prediction'->>'opportunity_score')::numeric,0))),
      greatest(0,least(1,coalesce((prediction->'prediction'->>'confidence')::numeric,0))),
      coalesce((prediction->'prediction'->>'expected_commercial_value')::numeric,0),
      '{}'::uuid[],
      jsonb_build_object(
        'canonical_brain_record_id',new.record_id,
        'tenant_id',new.tenant_id,
        'decision_id',decision_key,
        'evidence_ids',to_jsonb(new.evidence_ids),
        'prediction_model',new.payload->'predictionModel',
        'source','revenue-calibration-loop'
      ),
      'active','anticipatory',predicted_at
    )
    on conflict (forecast_key) do update set
      probability=excluded.probability,
      confidence=excluded.confidence,
      revenue_potential=excluded.revenue_potential,
      evidence=excluded.evidence,
      last_scored_at=excluded.last_scored_at,
      updated_at=now()
    returning forecast_id into forecast_uuid;

    insert into public.powerhouse_sales_actions(
      dedupe_key,subject_key,company_key,action_type,channel,priority,reason,evidence,
      message_draft,source_url,status,due_at,topic_key,opportunity_key,expected_value_eur
    ) values (
      'brain-revenue-action:'||new.tenant_id||':'||decision_key,
      entity_key,entity_key,coalesce(prediction->'recommended_action'->>'type','observe_and_enrich'),
      'brain',
      greatest(0,least(100,coalesce((prediction->'prediction'->>'opportunity_score')::numeric,0))),
      'Canonical Brain pre-action commercial prediction',
      jsonb_build_object('prediction_record_id',new.record_id,'decision_id',decision_key,'evidence_ids',to_jsonb(new.evidence_ids)),
      '','brain://revenue-calibration-loop','prepared',predicted_at,
      'commercial-meeting',decision_key,coalesce((prediction->'prediction'->>'expected_commercial_value')::numeric,0)
    )
    on conflict (dedupe_key) do update set
      priority=excluded.priority,evidence=excluded.evidence,expected_value_eur=excluded.expected_value_eur,updated_at=now()
    returning action_id into action_uuid;

  elsif learning_type = 'revenue_settlement' then
    settled := new.payload->'settled';
    if coalesce(settled->>'schema_version','') <> 'powerhouse.decision-outcome.v1' then
      raise exception 'POWERHOUSE_REVENUE_SETTLEMENT_SCHEMA_REQUIRED';
    end if;
    decision_key := settled->>'decision_id';
    entity_key := settled->>'entity_id';
    occurred_at := coalesce((settled->'outcome'->>'occurred_at')::timestamptz,new.observed_at);
    meeting_value := case when coalesce((settled->'outcome'->>'meeting')::int,0) = 1 then 1 else 0 end;
    revenue_value := greatest(0,coalesce((settled->'outcome'->>'revenue')::numeric,0));

    select forecast_id into forecast_uuid
      from public.powerhouse_forecasts
      where forecast_key='brain-revenue:'||new.tenant_id||':'||decision_key;
    if forecast_uuid is null then
      raise exception 'POWERHOUSE_ORIGINATING_FORECAST_REQUIRED:%',decision_key;
    end if;

    select action_id into action_uuid
      from public.powerhouse_sales_actions
      where dedupe_key='brain-revenue-action:'||new.tenant_id||':'||decision_key;

    insert into public.powerhouse_sales_outcomes(
      action_id,dedupe_key,outcome_type,subject_key,company_key,revenue_eur,evidence,
      occurred_at,opportunity_key,channel
    ) values (
      action_uuid,'brain-revenue-outcome:'||new.tenant_id||':'||decision_key||':'||coalesce(new.payload->>'originatingPredictionId','unknown'),
      case when coalesce((settled->'outcome'->>'order')::int,0)=1 then 'order'
           when coalesce((settled->'outcome'->>'proposal')::int,0)=1 then 'proposal'
           when meeting_value=1 then 'meeting' else 'no_meeting' end,
      entity_key,entity_key,revenue_value,
      jsonb_build_object(
        'canonical_brain_record_id',new.record_id,
        'originatingPredictionId',new.payload->>'originatingPredictionId',
        'decision_id',decision_key,
        'evidence_ids',to_jsonb(new.evidence_ids),
        'settled',settled
      ),occurred_at,decision_key,'brain'
    )
    on conflict (dedupe_key) do update set
      outcome_type=excluded.outcome_type,revenue_eur=excluded.revenue_eur,evidence=excluded.evidence,occurred_at=excluded.occurred_at
    returning outcome_id into action_uuid;

    update public.powerhouse_sales_actions
      set status='done',executed_at=coalesce(executed_at,occurred_at),outcome_id=action_uuid,updated_at=now()
      where dedupe_key='brain-revenue-action:'||new.tenant_id||':'||decision_key;

    update public.powerhouse_forecasts
      set status='materialized',materialized_at=coalesce(materialized_at,occurred_at),
          outcome=jsonb_build_object('originatingPredictionId',new.payload->>'originatingPredictionId','settled',settled),updated_at=now()
      where forecast_id=forecast_uuid;

    insert into public.powerhouse_forecast_calibration(
      forecast_id,measured_at,actual_event_occurred,actual_event_at,probability_error,
      revenue_influence,evidence,outcome_value,brier_component,attribution_confidence,revenue_eur,content_ids
    ) values (
      forecast_uuid,occurred_at,(meeting_value=1),case when meeting_value=1 then occurred_at else null end,
      (settled->'learning'->>'probability_error')::numeric,
      revenue_value,
      jsonb_build_object(
        'canonical_brain_record_id',new.record_id,
        'originatingPredictionId',new.payload->>'originatingPredictionId',
        'decision_id',decision_key,
        'evidence_ids',to_jsonb(new.evidence_ids)
      ),
      meeting_value,(settled->'learning'->>'meeting_brier_score')::numeric,
      1,revenue_value,'{}'::text[]
    );
  end if;

  return new;
end;
$$;

revoke all on function public.powerhouse_project_brain_revenue_learning() from public, anon, authenticated;
grant execute on function public.powerhouse_project_brain_revenue_learning() to service_role;

drop trigger if exists trg_powerhouse_project_brain_revenue_learning on public.brain_records;
create trigger trg_powerhouse_project_brain_revenue_learning
after insert on public.brain_records
for each row
when (new.record_type='Learning' and new.record_kind='learning')
execute function public.powerhouse_project_brain_revenue_learning();

-- Canonical architecture guard: production transport is GitHub-native and the
-- revenue learning loop is one Brein/Powerhouse system, not parallel storage.
insert into public.brain_records(
  tenant_id,record_id,record_type,record_kind,subject_id,correlation_id,owner_id,status,
  observed_at,executed,verified,evidence_ids,provenance,payload,idempotency_key
) values (
  'canonical','powerhouse-no-make-production-v1','Learning','learning','powerhouse-revenue-os',
  'growth-revenue-os-1m-2027-v1','powerhouse','ACTIVE_GUARD',now(),true,true,
  array['github:pr:1486','github:merge:45c9600d742128f36e0457abe547ee5f163c7010','channel-identity-hard-gate-v2'],
  jsonb_build_object('source','production_readback','contract','powerhouse-no-make-production-v1'),
  jsonb_build_object(
    'architecture','Brein + Powerhouse',
    'parent','growth-revenue-os-1m-2027-v1',
    'channel_identity_gate','channel-identity-hard-gate-v2',
    'production_transport','github-native',
    'make_allowed',false,
    'parallel_truth_store',false,
    'canonical_loop',jsonb_build_array('prediction','action','outcome','revenue','calibration','next_decision'),
    'persistence',jsonb_build_array('powerhouse_forecasts','powerhouse_sales_actions','powerhouse_sales_outcomes','powerhouse_forecast_calibration'),
    'regression_guard','brain/guards/no-make-production-transport.test.mjs'
  ),
  'powerhouse-no-make-production-v1'
)
on conflict (tenant_id,record_id) do update set
  status=excluded.status,observed_at=excluded.observed_at,executed=excluded.executed,verified=excluded.verified,
  evidence_ids=excluded.evidence_ids,provenance=excluded.provenance,payload=excluded.payload,updated_at=now();
