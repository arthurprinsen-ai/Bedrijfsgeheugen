
create table if not exists public.powerhouse_freshness_contradiction_cache_v1 (
  opportunity_key text primary key,
  company_key text,
  person_key text,
  topic_key text,
  probability numeric,
  confidence numeric,
  last_evidence_at timestamptz,
  updated_at timestamptz,
  company_last_relevant_at timestamptz,
  person_last_relevant_at timestamptz,
  freshest_evidence_at timestamptz,
  evidence_age_days numeric,
  freshness_state text not null,
  contradiction_detected boolean not null default false,
  company_intent_score numeric not null default 0,
  refreshed_at timestamptz not null default now()
);

alter table public.powerhouse_freshness_contradiction_cache_v1 enable row level security;
revoke all on table public.powerhouse_freshness_contradiction_cache_v1 from public, anon, authenticated;
grant select,insert,update,delete on table public.powerhouse_freshness_contradiction_cache_v1 to service_role;

create index if not exists powerhouse_freshness_cache_state_idx
  on public.powerhouse_freshness_contradiction_cache_v1(freshness_state, contradiction_detected);

create or replace function public.powerhouse_refresh_freshness_contradiction_cache_v1()
returns integer
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_rows integer := 0;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('powerhouse-freshness-contradiction-cache-v1',0)) then
    return 0;
  end if;

  delete from public.powerhouse_freshness_contradiction_cache_v1;

  insert into public.powerhouse_freshness_contradiction_cache_v1(
    opportunity_key,company_key,person_key,topic_key,probability,confidence,
    last_evidence_at,updated_at,company_last_relevant_at,person_last_relevant_at,
    freshest_evidence_at,evidence_age_days,freshness_state,contradiction_detected,
    company_intent_score,refreshed_at
  )
  select
    opportunity_key,company_key,person_key,topic_key,probability,confidence,
    last_evidence_at,updated_at,company_last_relevant_at,person_last_relevant_at,
    freshest_evidence_at,evidence_age_days,freshness_state,contradiction_detected,
    company_intent_score,clock_timestamp()
  from public.powerhouse_freshness_contradiction_v1;

  get diagnostics v_rows = row_count;
  return v_rows;
end
$function$;

revoke execute on function public.powerhouse_refresh_freshness_contradiction_cache_v1()
  from public, anon, authenticated;
grant execute on function public.powerhouse_refresh_freshness_contradiction_cache_v1()
  to service_role;

select public.powerhouse_refresh_freshness_contradiction_cache_v1();

create or replace view public.powerhouse_research_queue_v1
with (security_invoker=true)
as
select
  b.opportunity_key,
  b.person_key,
  b.company_key,
  b.topic_key,
  b.person_name,
  b.role,
  b.expected_commercial_value_eur,
  b.buying_window_score,
  b.buying_window_confidence,
  b.evidence_density,
  f.freshness_state,
  f.contradiction_detected,
  case
    when b.person_evidence = 0 then 'identity_or_person_context_missing'
    when b.company_evidence = 0 then 'company_context_missing'
    when b.forecast_evidence = 0 then 'forecast_missing'
    when coalesce(f.contradiction_detected,false) then 'contradictory_evidence'
    when coalesce(f.freshness_state,'stale') = 'stale' then 'stale_evidence'
    when b.buying_window_confidence < 0.55 then 'low_confidence'
    when b.evidence_density < 0.60 then 'evidence_density_low'
    else 'no_research_needed'
  end as research_reason,
  array_remove(array[
    case when b.person_evidence = 0 then 'person_evidence' end,
    case when b.company_evidence = 0 then 'company_evidence' end,
    case when b.forecast_evidence = 0 then 'forecast_evidence' end,
    case when coalesce(f.contradiction_detected,false) then 'contradiction_resolution' end,
    case when coalesce(f.freshness_state,'stale') = 'stale' then 'fresh_evidence' end
  ],null)::text[] as missing_evidence,
  least(100::numeric,greatest(0::numeric,
    40::numeric
    + coalesce(b.expected_commercial_value_eur,0::numeric)/1000::numeric
    + (1::numeric-coalesce(b.buying_window_confidence,0::numeric))*30::numeric
  )) as research_priority
from public.powerhouse_buying_window_v2 b
left join public.powerhouse_freshness_contradiction_cache_v1 f
  on f.opportunity_key=b.opportunity_key
where b.person_evidence = 0
   or b.company_evidence = 0
   or b.forecast_evidence = 0
   or coalesce(f.contradiction_detected,false)
   or coalesce(f.freshness_state,'stale') = 'stale'
   or b.buying_window_confidence < 0.55
   or b.evidence_density < 0.60;

revoke all on public.powerhouse_research_queue_v1 from public, anon, authenticated;
grant select on public.powerhouse_research_queue_v1 to service_role;

do $cron$
declare v_jobid bigint;
begin
  select jobid into v_jobid from cron.job where jobname='powerhouse-one-brain-reconcile-v1';
  if v_jobid is null then
    raise exception 'ONE_BRAIN_CRON_MISSING';
  end if;
  perform cron.alter_job(
    v_jobid,
    schedule := '13,43 * * * *',
    command := 'select public.powerhouse_one_brain_reconcile_v1(now());',
    active := true
  );

  select jobid into v_jobid from cron.job where jobname='powerhouse-linkedin-oauth-resume-reconcile-v1';
  if v_jobid is null then
    perform cron.schedule(
      'powerhouse-linkedin-oauth-resume-reconcile-v1',
      '18,48 * * * *',
      'select public.powerhouse_linkedin_oauth_resume_reconcile_v1(now());'
    );
  else
    perform cron.alter_job(v_jobid,schedule := '18,48 * * * *',command := 'select public.powerhouse_linkedin_oauth_resume_reconcile_v1(now());',active := true);
  end if;

  select jobid into v_jobid from cron.job where jobname='powerhouse-regression-stage-evidence-v1';
  if v_jobid is null then
    perform cron.schedule(
      'powerhouse-regression-stage-evidence-v1',
      '23,53 * * * *',
      'select public.powerhouse_refresh_regression_stage_evidence_v1(now());'
    );
  else
    perform cron.alter_job(v_jobid,schedule := '23,53 * * * *',command := 'select public.powerhouse_refresh_regression_stage_evidence_v1(now());',active := true);
  end if;

  select jobid into v_jobid from cron.job where jobname='powerhouse-seo-assurance-v1';
  if v_jobid is null then
    perform cron.schedule(
      'powerhouse-seo-assurance-v1',
      '28,58 * * * *',
      'select public.powerhouse_refresh_seo_assurance_v1(now());'
    );
  else
    perform cron.alter_job(v_jobid,schedule := '28,58 * * * *',command := 'select public.powerhouse_refresh_seo_assurance_v1(now());',active := true);
  end if;

  select jobid into v_jobid from cron.job where jobname='powerhouse-freshness-contradiction-cache-v1';
  if v_jobid is null then
    perform cron.schedule(
      'powerhouse-freshness-contradiction-cache-v1',
      '6,21,36,51 * * * *',
      'select public.powerhouse_refresh_freshness_contradiction_cache_v1();'
    );
  else
    perform cron.alter_job(v_jobid,schedule := '6,21,36,51 * * * *',command := 'select public.powerhouse_refresh_freshness_contradiction_cache_v1();',active := true);
  end if;
end
$cron$;
