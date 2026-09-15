-- Canonical opportunity -> forecast bridge for the revenue intelligence loop.
-- Uses observed action/outcome history only; does not fabricate commercial outcomes or revenue.

create or replace function public.powerhouse_ensure_commercial_progression_forecasts_v1(
  p_run_date date default current_date
)
returns table(inserted_count bigint, eligible_count bigint)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_inserted bigint := 0;
  v_eligible bigint := 0;
begin
  with eligible as materialized (
    select distinct on (a.opportunity_key)
      a.opportunity_key,
      a.person_key,
      a.company_key,
      a.channel,
      o.confidence as opportunity_confidence,
      o.expected_value_eur,
      o.evidence as opportunity_evidence
    from public.powerhouse_sales_actions a
    join public.powerhouse_opportunities o on o.opportunity_key=a.opportunity_key
    where a.status in ('suggested','prepared','pending')
      and a.created_at>=now()-interval '30 days'
      and a.action_type not in ('internal_research','research','research_enrichment')
      and coalesce(o.status,'open')='open'
      and nullif(trim(a.opportunity_key),'') is not null
      and nullif(trim(a.person_key),'') is not null
      and nullif(trim(a.company_key),'') is not null
      and not exists (
        select 1
        from public.powerhouse_forecasts f
        where f.predicted_event='commercial_progression'
          and f.status in ('active','claimed')
          and (
            f.evidence->>'opportunity_key'=a.opportunity_key
            or (f.scope='person' and lower(f.scope_key)=lower(a.person_key))
          )
      )
    order by a.opportunity_key,a.created_at desc,a.action_id desc
  ), channel_history as materialized (
    select
      lower(regexp_replace(coalesce(a.channel,'unknown'),'[^a-zA-Z0-9]+','_','g')) as channel_key,
      count(distinct a.action_id)::numeric as actions,
      count(distinct o.outcome_id) filter (
        where lower(o.outcome_type) ~ '(meeting|appointment|proposal|offerte|qualified|won|order|revenue)'
      )::numeric as commercial_progressions
    from public.powerhouse_sales_actions a
    left join public.powerhouse_sales_outcomes o on o.action_id=a.action_id
    where a.created_at>=now()-interval '180 days'
    group by 1
  ), candidates as (
    select
      e.*,
      coalesce(h.actions,0) as observed_actions,
      coalesce(h.commercial_progressions,0) as observed_progressions,
      least(.85::numeric,greatest(.005::numeric,
        (coalesce(h.commercial_progressions,0)+1)/(coalesce(h.actions,0)+12)
      )) as predicted_probability,
      least(.80::numeric,greatest(.15::numeric,
        coalesce(e.opportunity_confidence,.25) * least(1::numeric,(coalesce(h.actions,0)+5)/25)
      )) as predicted_confidence
    from eligible e
    left join channel_history h
      on h.channel_key=lower(regexp_replace(coalesce(e.channel,'unknown'),'[^a-zA-Z0-9]+','_','g'))
  ), inserted as (
    insert into public.powerhouse_forecasts (
      forecast_key,horizon_start,horizon_end,scope,scope_key,topic_key,predicted_event,
      predicted_problem,predicted_buying_trigger,probability,confidence,expected_lead_days,
      first_mover_score,strategic_fit,revenue_potential,evidence_signal_ids,evidence,status,
      expected_by,signal_acceleration,market_saturation,whitespace_score,prediction_mode,last_scored_at,updated_at
    )
    select
      concat('commercial_progression:',c.opportunity_key,':',p_run_date::text),
      p_run_date,p_run_date+30,'person',c.person_key,'commercial_progression','commercial_progression',
      'Observed commercial opportunity has an eligible activation action but no canonical progression forecast.',
      nullif(c.opportunity_evidence->>'latest_reason',''),
      c.predicted_probability,c.predicted_confidence,30,
      0::numeric,least(1::numeric,greatest(0::numeric,coalesce(c.opportunity_confidence,0))),
      greatest(0::numeric,coalesce(c.expected_value_eur,0)),array[]::uuid[],
      jsonb_build_object(
        'opportunity_key',c.opportunity_key,
        'person_key',c.person_key,
        'company_key',c.company_key,
        'channel',c.channel,
        'source','powerhouse-commercial-progression-forecast-bridge-v1',
        'prediction_model','bayesian-smoothed-observed-commercial-progression-v1',
        'observed_actions',c.observed_actions,
        'observed_commercial_progressions',c.observed_progressions,
        'opportunity_confidence',c.opportunity_confidence,
        'truth_boundary','prediction only; no outcome or revenue is synthesized'
      ),
      'active',p_run_date+30,.5,.5,.5,'anticipatory',now(),now()
    from candidates c
    on conflict (forecast_key) do nothing
    returning forecast_id
  )
  select (select count(*) from eligible),(select count(*) from inserted)
  into v_eligible,v_inserted;

  return query select v_inserted,v_eligible;
end;
$$;

revoke execute on function public.powerhouse_ensure_commercial_progression_forecasts_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_ensure_commercial_progression_forecasts_v1(date) to service_role;