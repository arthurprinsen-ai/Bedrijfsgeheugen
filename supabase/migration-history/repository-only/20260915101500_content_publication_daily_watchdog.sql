-- Hard daily publication invariant: every planned publication must end in observed live proof or an explicit no-publish decision.
-- Silent absence is converted to FAILED and a second cron assertion makes the watchdog itself fail closed.

alter table public.content_publication_obligations
  drop constraint if exists content_publication_obligations_status_check;

alter table public.content_publication_obligations
  add constraint content_publication_obligations_status_check
  check (status in ('PLANNED','GENERATED','APPROVED','DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED','SKIPPED','BLOCKED','FAILED'));

alter table public.content_publication_obligations
  drop constraint if exists content_publication_skip_evidence_check;

alter table public.content_publication_obligations
  add constraint content_publication_skip_evidence_check
  check (
    status <> 'SKIPPED'
    or (
      evidence ? 'no_publish_reason'
      and length(btrim(coalesce(evidence->>'no_publish_reason',''))) > 0
    )
  );

create or replace function public.content_publication_state_rank(p_status text)
returns integer
language sql
immutable
as $$
  select case p_status
    when 'PLANNED' then 10
    when 'GENERATED' then 20
    when 'APPROVED' then 30
    when 'DISPATCHED' then 40
    when 'PUBLISHED' then 50
    when 'LIVE_PROVEN' then 60
    when 'MEASURED' then 70
    when 'LEARNED' then 80
    when 'SKIPPED' then 90
    when 'BLOCKED' then 5
    when 'FAILED' then 5
    else -1
  end;
$$;

create or replace function public.record_content_publication_skip(
  p_tenant_id text,
  p_publication_date date,
  p_channel text,
  p_reason text,
  p_evidence jsonb default '{}'::jsonb
)
returns public.content_publication_obligations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.content_publication_obligations%rowtype;
  v_reason text := btrim(coalesce(p_reason,''));
begin
  if v_reason = '' then
    raise exception 'NO_PUBLISH_REASON_REQUIRED';
  end if;

  select * into v_row
  from public.content_publication_obligations
  where tenant_id = p_tenant_id
    and publication_date = p_publication_date
    and channel = p_channel
  for update;

  if not found then
    raise exception 'PUBLICATION_OBLIGATION_NOT_FOUND';
  end if;

  if v_row.status in ('DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then
    raise exception 'NO_PUBLISH_DECISION_TOO_LATE';
  end if;

  update public.content_publication_obligations
  set status = 'SKIPPED',
      evidence = evidence
        || coalesce(p_evidence,'{}'::jsonb)
        || jsonb_build_object(
             'decision','NO_PUBLISH',
             'no_publish_reason',v_reason,
             'decided_at',now()
           ),
      next_action = 'Geen publicatie vereist: expliciete no-publish-beslissing vastgelegd.',
      last_error = null,
      updated_at = now()
  where tenant_id = p_tenant_id
    and publication_date = p_publication_date
    and channel = p_channel
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.record_content_publication_skip(text,date,text,text,jsonb) from public;

create or replace function public.enforce_content_publication_daily_invariant(
  p_publication_date date default (timezone('Europe/Amsterdam', now()))::date,
  p_deadline time default time '20:30',
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_local_date date := (p_now at time zone 'Europe/Amsterdam')::date;
  v_local_time time := (p_now at time zone 'Europe/Amsterdam')::time;
  v_expected integer := 0;
  v_success integer := 0;
  v_failed integer := 0;
begin
  if p_publication_date is null then
    raise exception 'PUBLICATION_DATE_REQUIRED';
  end if;

  perform public.sync_content_publication_obligations(p_publication_date, p_publication_date);

  select count(*) into v_expected
  from public.content_publication_obligations
  where tenant_id = 'canonical'
    and publication_date = p_publication_date
    and channel in ('linkedin_personal','linkedin_company','instagram','blog');

  if p_publication_date > v_local_date
     or (p_publication_date = v_local_date and v_local_time < p_deadline) then
    return jsonb_build_object(
      'ok', true,
      'state', 'NOT_DUE',
      'publication_date', p_publication_date,
      'expected', v_expected,
      'failed', 0
    );
  end if;

  update public.content_publication_obligations
  set status = 'FAILED',
      last_error = 'SILENT_PUBLICATION_FAILURE',
      next_action = 'Herstel de publicatieketen end-to-end: decision → content → identity/media gate → Buffer dispatch → live proof.',
      recovery_attempts = recovery_attempts + case when status = 'FAILED' then 0 else 1 end,
      evidence = evidence || jsonb_build_object(
        'watchdog','daily-publication-invariant-v1',
        'watchdog_checked_at',p_now,
        'watchdog_previous_status',status,
        'watchdog_reason','SILENT_PUBLICATION_FAILURE'
      ),
      updated_at = now()
  where tenant_id = 'canonical'
    and publication_date = p_publication_date
    and channel in ('linkedin_personal','linkedin_company','instagram','blog')
    and status not in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED','FAILED');

  select count(*) filter (where status in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED')),
         count(*) filter (where status = 'FAILED')
    into v_success, v_failed
  from public.content_publication_obligations
  where tenant_id = 'canonical'
    and publication_date = p_publication_date
    and channel in ('linkedin_personal','linkedin_company','instagram','blog');

  return jsonb_build_object(
    'ok', v_expected > 0 and v_failed = 0 and v_success = v_expected,
    'state', case when v_failed = 0 and v_success = v_expected and v_expected > 0 then 'TERMINAL_OK' else 'FAILED' end,
    'publication_date', p_publication_date,
    'expected', v_expected,
    'terminal_success', v_success,
    'failed', v_failed
  );
end;
$$;

revoke all on function public.enforce_content_publication_daily_invariant(date,time,timestamptz) from public;

create or replace function public.assert_content_publication_daily_invariant(
  p_publication_date date default (timezone('Europe/Amsterdam', now()))::date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected integer;
  v_bad integer;
begin
  select count(*),
         count(*) filter (where status not in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED'))
    into v_expected, v_bad
  from public.content_publication_obligations
  where tenant_id = 'canonical'
    and publication_date = p_publication_date
    and channel in ('linkedin_personal','linkedin_company','instagram','blog');

  if v_expected = 0 or v_bad > 0 then
    raise exception 'DAILY_PUBLICATION_INVARIANT_FAILED date=% expected=% non_terminal=%', p_publication_date, v_expected, v_bad;
  end if;
end;
$$;

revoke all on function public.assert_content_publication_daily_invariant(date) from public;

create or replace view public.content_operations_cockpit as
select
  o.tenant_id,
  o.publication_date,
  o.channel,
  o.content_kind,
  o.status,
  o.experiment_id,
  e.comparison_scope->>'family' as experiment_family,
  e.comparison_scope->>'mode' as decision_mode,
  e.recipe,
  e.source_signals,
  e.commercial_hypothesis,
  o.content_id,
  o.slug,
  o.external_id,
  o.canonical_url,
  o.last_error,
  o.recovery_attempts,
  o.evidence,
  o.metrics,
  o.next_action,
  o.generated_at,
  o.approved_at,
  o.dispatched_at,
  o.published_at,
  o.live_proven_at,
  o.measured_at,
  o.learned_at,
  (o.publication_date = (timezone('Europe/Amsterdam', now()))::date) as is_due_today,
  (o.publication_date < (timezone('Europe/Amsterdam', now()))::date
    and o.status not in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED')) as is_overdue,
  o.updated_at
from public.content_publication_obligations o
left join public.social_experiments e
  on e.tenant_id = o.tenant_id
 and e.experiment_id = o.experiment_id
 and e.calendar_date = o.publication_date;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'bg-content-publication-daily-watchdog') then
    perform cron.unschedule((select jobid from cron.job where jobname = 'bg-content-publication-daily-watchdog' limit 1));
  end if;
  if exists (select 1 from cron.job where jobname = 'bg-content-publication-daily-assert') then
    perform cron.unschedule((select jobid from cron.job where jobname = 'bg-content-publication-daily-assert' limit 1));
  end if;
end $$;

select cron.schedule(
  'bg-content-publication-daily-watchdog',
  '30 19 * * *',
  $$select public.enforce_content_publication_daily_invariant((timezone('Europe/Amsterdam', now()))::date, time '20:30', now());$$
);

select cron.schedule(
  'bg-content-publication-daily-assert',
  '35 19 * * *',
  $$select public.assert_content_publication_daily_invariant((timezone('Europe/Amsterdam', now()))::date);$$
);
