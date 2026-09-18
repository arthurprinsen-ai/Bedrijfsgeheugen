-- Legacy growth outcome reconciler v1
-- Bridges old OUTCOME_EVALUATION obligations into the current canonical evidence model.
-- Evidence-first: close only when the declared metric is fully observable for the required horizon.

create or replace function public.powerhouse_reconcile_legacy_growth_outcomes_v1(
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  o public.revenue_learning_obligations%rowtype;
  d public.revenue_learning_decisions%rowtype;
  e public.revenue_learning_evidence%rowtype;
  s public.social_metric_snapshots%rowtype;
  v_ref text;
  v_post_id text;
  v_published timestamptz;
  v_expected numeric;
  v_actual numeric;
  v_metric text;
  v_met boolean;
  v_evidence_id text;
  v_closed integer := 0;
  v_deferred integer := 0;
  v_bootstrap_closed integer := 0;
begin
  for o in
    select *
    from public.revenue_learning_obligations
    where tenant_id='canonical'
      and type='OUTCOME_EVALUATION'
      and status='OPEN'
      and due_at is not null
      and due_at <= p_now
    order by due_at,obligation_id
  loop
    select *
    into d
    from public.revenue_learning_decisions
    where tenant_id=o.tenant_id
      and decision_id=o.payload->>'decision_id'
    limit 1;

    if not found then
      v_deferred := v_deferred + 1;
      continue;
    end if;

    select ev.*
    into e
    from public.revenue_learning_evidence ev
    where ev.tenant_id=o.tenant_id
      and ev.content_id=o.content_id
      and exists(
        select 1
        from jsonb_array_elements_text(ev.source_refs) refs(ref)
        where refs.ref like 'buffer:post:%'
      )
    order by ev.updated_at desc,ev.evaluated_at desc nulls last
    limit 1;

    if not found then
      v_deferred := v_deferred + 1;
      continue;
    end if;

    select refs.ref
    into v_ref
    from jsonb_array_elements_text(e.source_refs) refs(ref)
    where refs.ref like 'buffer:post:%'
    limit 1;

    if v_ref is null then
      v_deferred := v_deferred + 1;
      continue;
    end if;

    v_post_id := regexp_replace(v_ref,'^buffer:post:','');
    v_published := coalesce(e.published_at,d.recorded_at);

    if o.window_hours=24
       and (d.decision->'expected_metric') ? '24h_impressions_gte' then
      v_metric := 'impressions';
      v_expected := nullif(d.decision#>>'{expected_metric,24h_impressions_gte}','')::numeric;

      select sm.*
      into s
      from public.social_metric_snapshots sm
      where sm.post_id=v_post_id
        and sm.observed_at>=v_published
        and sm.observed_at<=v_published+interval '24 hours'
        and coalesce(
          nullif(sm.metrics->>'impressions','')::numeric,
          nullif(sm.metrics->>'Impressions','')::numeric
        ) >= v_expected
      order by sm.observed_at
      limit 1;

      if not found then
        select sm.*
        into s
        from public.social_metric_snapshots sm
        where sm.post_id=v_post_id
          and sm.observed_at between v_published+interval '18 hours' and v_published+interval '30 hours'
          and coalesce(sm.metrics->>'impressions',sm.metrics->>'Impressions') is not null
        order by abs(extract(epoch from (sm.observed_at-(v_published+interval '24 hours'))))
        limit 1;
      end if;

      if not found then
        v_deferred := v_deferred + 1;
        continue;
      end if;

      v_actual := coalesce(
        nullif(s.metrics->>'impressions','')::numeric,
        nullif(s.metrics->>'Impressions','')::numeric
      );
      v_met := v_actual>=v_expected;

    elsif o.window_hours=72
       and (d.decision->'expected_metric') ? '72h_substantive_interactions_gte' then
      v_metric := 'substantive_interactions';
      v_expected := nullif(d.decision#>>'{expected_metric,72h_substantive_interactions_gte}','')::numeric;

      select sm.*
      into s
      from public.social_metric_snapshots sm
      where sm.post_id=v_post_id
        and sm.observed_at>=v_published
        and sm.observed_at<=v_published+interval '72 hours'
        and (sm.metrics ? 'comments' or sm.metrics ? 'Comments')
        and (sm.metrics ? 'shares' or sm.metrics ? 'Shares')
        and (sm.metrics ? 'saves' or sm.metrics ? 'Saves')
        and (
          coalesce(nullif(sm.metrics->>'comments','')::numeric,nullif(sm.metrics->>'Comments','')::numeric,0)
          + coalesce(nullif(sm.metrics->>'shares','')::numeric,nullif(sm.metrics->>'Shares','')::numeric,0)
          + coalesce(nullif(sm.metrics->>'saves','')::numeric,nullif(sm.metrics->>'Saves','')::numeric,0)
        ) >= v_expected
      order by sm.observed_at
      limit 1;

      if not found then
        select sm.*
        into s
        from public.social_metric_snapshots sm
        where sm.post_id=v_post_id
          and sm.observed_at between v_published+interval '66 hours' and v_published+interval '78 hours'
          and (sm.metrics ? 'comments' or sm.metrics ? 'Comments')
          and (sm.metrics ? 'shares' or sm.metrics ? 'Shares')
          and (sm.metrics ? 'saves' or sm.metrics ? 'Saves')
        order by abs(extract(epoch from (sm.observed_at-(v_published+interval '72 hours'))))
        limit 1;
      end if;

      if not found then
        v_deferred := v_deferred + 1;
        continue;
      end if;

      v_actual :=
        coalesce(nullif(s.metrics->>'comments','')::numeric,nullif(s.metrics->>'Comments','')::numeric,0)
        + coalesce(nullif(s.metrics->>'shares','')::numeric,nullif(s.metrics->>'Shares','')::numeric,0)
        + coalesce(nullif(s.metrics->>'saves','')::numeric,nullif(s.metrics->>'Saves','')::numeric,0);
      v_met := v_actual>=v_expected;

    else
      v_deferred := v_deferred + 1;
      continue;
    end if;

    v_evidence_id := 'legacy-growth-outcome:' || o.obligation_id;

    insert into public.revenue_learning_evidence(
      tenant_id,evidence_id,content_id,channel,canonical,attribution_key,data_quality,
      published_at,publication_date,window_hours,component_fingerprint,
      exposures,substantive_interactions,attributes,source_refs,evaluated_at,updated_at
    )
    values(
      o.tenant_id,v_evidence_id,o.content_id,coalesce(d.channel,e.channel),e.canonical,
      d.decision_id,'OBSERVED',v_published,v_published::date,o.window_hours,
      coalesce(e.component_fingerprint,'legacy-growth-outcome'),
      case when v_metric='impressions' then v_actual else null end,
      case when v_metric='substantive_interactions' then v_actual else null end,
      jsonb_build_object(
        'contract','legacy-growth-outcome-reconciler-v1',
        'metric',v_metric,
        'expected_threshold',v_expected,
        'actual_value',v_actual,
        'threshold_met',v_met,
        'snapshot_id',s.snapshot_id,
        'snapshot_observed_at',s.observed_at,
        'source_data_quality',s.data_quality,
        'truth','observed_social_metric'
      ),
      jsonb_build_array(
        'social_metric_snapshots:'||s.snapshot_id,
        'buffer:post:'||v_post_id,
        'revenue_learning_decisions:'||d.decision_id
      ),
      p_now,p_now
    )
    on conflict (tenant_id,evidence_id) do update set
      exposures=excluded.exposures,
      substantive_interactions=excluded.substantive_interactions,
      attributes=excluded.attributes,
      source_refs=excluded.source_refs,
      evaluated_at=excluded.evaluated_at,
      updated_at=excluded.updated_at;

    insert into public.revenue_learning_applications(
      tenant_id,application_id,content_id,channel,learning_id,decision_id,
      applied_at,application_role,expected_effect,actual_effect,verification_status,updated_at
    )
    values(
      o.tenant_id,'legacy-calibration:'||o.obligation_id,o.content_id,d.channel,
      'growth-daily-prediction-calibration-v1',d.decision_id,p_now,'CALIBRATION',
      nullif(d.decision->>'predicted_probability','')::double precision,
      case when v_met then 1::double precision else 0::double precision end,
      'VERIFIED',p_now
    )
    on conflict (tenant_id,application_id) do update set
      actual_effect=excluded.actual_effect,
      verification_status='VERIFIED',
      updated_at=excluded.updated_at;

    update public.revenue_learning_obligations
    set status='CLOSED',
        payload=payload||jsonb_build_object(
          'evaluation_state','CLOSED_WITH_OBSERVED_EVIDENCE',
          'evidence_id',v_evidence_id,
          'metric',v_metric,
          'expected_threshold',v_expected,
          'actual_value',v_actual,
          'threshold_met',v_met,
          'snapshot_observed_at',s.observed_at
        ),
        updated_at=p_now
    where tenant_id=o.tenant_id
      and obligation_id=o.obligation_id
      and status='OPEN';

    v_closed := v_closed + 1;
  end loop;

  update public.revenue_learning_obligations b
  set status='CLOSED',
      payload=b.payload||jsonb_build_object(
        'state','CLOSED_FIRST_REAL_OUTCOME_OBSERVED',
        'closed_by_obligation',c.obligation_id,
        'closed_at',p_now
      ),
      updated_at=p_now
  from public.revenue_learning_obligations c
  where b.tenant_id='canonical'
    and b.type='CALIBRATION_BOOTSTRAP'
    and b.status='OPEN'
    and c.tenant_id=b.tenant_id
    and c.obligation_id=b.payload->>'next_due_obligation'
    and c.status='CLOSED';

  get diagnostics v_bootstrap_closed = row_count;

  return jsonb_build_object(
    'contract','legacy-growth-outcome-reconciler-v1',
    'closed_outcome_obligations',v_closed,
    'deferred_insufficient_evidence',v_deferred,
    'closed_bootstrap_obligations',v_bootstrap_closed,
    'observed_at',p_now
  );
end
$$;

revoke execute on function public.powerhouse_reconcile_legacy_growth_outcomes_v1(timestamptz) from public,anon,authenticated;
grant execute on function public.powerhouse_reconcile_legacy_growth_outcomes_v1(timestamptz) to service_role;

select cron.unschedule(jobid)
from cron.job
where jobname='powerhouse-legacy-growth-outcome-reconcile-v1';

select cron.schedule(
  'powerhouse-legacy-growth-outcome-reconcile-v1',
  '17 * * * *',
  $$select public.powerhouse_reconcile_legacy_growth_outcomes_v1(now());$$
);

select public.powerhouse_reconcile_legacy_growth_outcomes_v1(now());

comment on function public.powerhouse_reconcile_legacy_growth_outcomes_v1(timestamptz) is
'Compatibility reconciler for legacy growth OUTCOME_EVALUATION obligations. Reuses canonical decision/evidence/social snapshot authorities; closes only on complete observed evidence and preserves insufficient-evidence obligations open.';
