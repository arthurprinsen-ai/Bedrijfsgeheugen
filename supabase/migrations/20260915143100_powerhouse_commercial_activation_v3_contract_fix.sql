-- Contract fix discovered by production-schema readback before deployment.
-- powerhouse_sales_learnings.status accepts hypothesis|active|proven|rejected|superseded.
-- Keep low-sample experiment learning as hypothesis; never invent an unsupported status.

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
    case when v_learning_sample>=5 then 'active' else 'hypothesis' end,
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
    'learning_status',case when v_learning_sample>=5 then 'active' else 'hypothesis' end,
    'truth_boundary','no fake winner; experimentally supported lift requires a valid baseline/comparison and sufficient observed evidence'
  );
end;
$$;

revoke all on function public.powerhouse_decide_mature_experiments_v2(date) from public, anon, authenticated;
grant execute on function public.powerhouse_decide_mature_experiments_v2(date) to service_role;
