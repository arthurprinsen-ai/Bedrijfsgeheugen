-- Powerhouse seven-channel closed-loop completion.
-- EXISTING-STATE-FIRST: extend existing publication ledger, cockpit and watchdogs only.

-- Normalize legacy Instagram channel before tightening the canonical constraint.
delete from public.content_publication_obligations legacy
using public.content_publication_obligations canonical
where legacy.tenant_id = canonical.tenant_id
  and legacy.publication_date = canonical.publication_date
  and legacy.channel = 'instagram'
  and canonical.channel = 'instagram_company';

update public.content_publication_obligations
set channel = 'instagram_company', updated_at = now()
where channel = 'instagram';

alter table public.content_publication_obligations
  drop constraint if exists content_publication_obligations_channel_check;
alter table public.content_publication_obligations
  add constraint content_publication_obligations_channel_check
  check (channel in (
    'email_newsletter','linkedin_personal','linkedin_company',
    'linkedin_article_personal','linkedin_article_company',
    'instagram_company','blog'
  ));

alter table public.content_publication_obligations
  drop constraint if exists content_publication_obligations_content_kind_check;
alter table public.content_publication_obligations
  add constraint content_publication_obligations_content_kind_check
  check (content_kind in ('social','blog','email','article'));

create or replace function public.sync_content_publication_obligations(
  p_from date default (timezone('Europe/Amsterdam', now()))::date,
  p_to date default (timezone('Europe/Amsterdam', now()))::date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  if p_from is null or p_to is null or p_to < p_from then
    raise exception 'INVALID_PUBLICATION_RANGE';
  end if;

  insert into public.content_publication_obligations(
    tenant_id, publication_date, channel, experiment_id, content_kind, status, next_action, updated_at
  )
  select
    'canonical',
    e.calendar_date,
    lane.channel,
    e.experiment_id,
    case
      when lane.channel = 'blog' then 'blog'
      when lane.channel = 'email_newsletter' then 'email'
      when lane.channel in ('linkedin_article_personal','linkedin_article_company') then 'article'
      else 'social'
    end,
    'PLANNED',
    case
      when lane.channel in ('linkedin_personal','linkedin_company','instagram_company')
        then 'HARD_SOCIAL: generate → identity/media gate → provider dispatch → provider readback → live proof.'
      when lane.channel = 'blog'
        then 'Adaptive Brain decision; publish only when selected, then candidate PR → production → live proof.'
      when lane.channel = 'email_newsletter'
        then 'Adaptive Brain decision; publish or persist explicit HOLD/SKIP reason with evidence.'
      else 'Adaptive Brain decision; publish or persist explicit HOLD/SKIP reason with evidence.'
    end,
    now()
  from (
    select distinct on (calendar_date)
      calendar_date, experiment_id
    from public.social_experiments
    where tenant_id = 'canonical'
      and calendar_date between p_from and p_to
    order by calendar_date, updated_at desc nulls last, created_at desc nulls last
  ) e
  cross join (values
    ('email_newsletter'),
    ('linkedin_personal'),
    ('linkedin_company'),
    ('linkedin_article_personal'),
    ('linkedin_article_company'),
    ('instagram_company'),
    ('blog')
  ) as lane(channel)
  on conflict (tenant_id, publication_date, channel) do update
    set experiment_id = excluded.experiment_id,
        content_kind = excluded.content_kind,
        next_action = case
          when public.content_publication_state_rank(content_publication_obligations.status) <= 10
            then excluded.next_action
          else content_publication_obligations.next_action
        end,
        updated_at = now();

  get diagnostics v_count = row_count;
  return v_count;
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
  if p_channel in ('linkedin_personal','linkedin_company','instagram_company') then
    raise exception 'HARD_SOCIAL_SKIP_FORBIDDEN:%', p_channel;
  end if;
  if v_reason = '' then
    raise exception 'NO_PUBLISH_REASON_REQUIRED';
  end if;

  select * into v_row
  from public.content_publication_obligations
  where tenant_id = p_tenant_id
    and publication_date = p_publication_date
    and channel = p_channel
  for update;

  if not found then raise exception 'PUBLICATION_OBLIGATION_NOT_FOUND'; end if;
  if v_row.status in ('DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then
    raise exception 'NO_PUBLISH_DECISION_TOO_LATE';
  end if;

  update public.content_publication_obligations
  set status = 'SKIPPED',
      evidence = evidence || coalesce(p_evidence,'{}'::jsonb) || jsonb_build_object(
        'decision','NO_PUBLISH','no_publish_reason',v_reason,'decided_at',now()
      ),
      next_action = 'Geen publicatie vereist: expliciete adaptive-lane no-publish-beslissing vastgelegd.',
      last_error = null,
      updated_at = now()
  where tenant_id = p_tenant_id
    and publication_date = p_publication_date
    and channel = p_channel
  returning * into v_row;
  return v_row;
end;
$$;

-- Preserve the existing view column order and append decision/execution fields.
create or replace view public.content_operations_cockpit as
select
  o.tenant_id,
  o.publication_date,
  o.channel,
  o.content_kind,
  o.status,
  o.experiment_id,
  e.comparison_scope ->> 'family' as experiment_family,
  e.comparison_scope ->> 'mode' as decision_mode,
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
  greatest(o.updated_at, coalesce(d.updated_at,o.updated_at)) as updated_at,
  d.decision,
  d.state as decision_state,
  d.priority,
  d.confidence,
  d.topic_key,
  d.content_key,
  d.rationale as decision_rationale,
  d.scheduled_for,
  d.delivery_ref,
  d.delivery_evidence,
  d.learning_evidence
from public.content_publication_obligations o
left join public.social_experiments e
  on e.tenant_id=o.tenant_id and e.experiment_id=o.experiment_id and e.calendar_date=o.publication_date
left join public.powerhouse_channel_decisions d
  on d.run_date=o.publication_date and d.channel=o.channel;

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
         count(*) filter (
           where status not in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED')
              or (channel in ('linkedin_personal','linkedin_company','instagram_company') and status='SKIPPED')
         )
    into v_expected, v_bad
  from public.content_publication_obligations
  where tenant_id='canonical'
    and publication_date=p_publication_date
    and channel in (
      'email_newsletter','linkedin_personal','linkedin_company',
      'linkedin_article_personal','linkedin_article_company','instagram_company','blog'
    );

  if v_expected <> 7 or v_bad > 0 then
    raise exception 'DAILY_PUBLICATION_INVARIANT_FAILED date=% expected=7 actual=% non_terminal=%',
      p_publication_date, v_expected, v_bad;
  end if;
end;
$$;

create or replace function public.enforce_content_publication_daily_invariant(
  p_publication_date date default (timezone('Europe/Amsterdam', now()))::date,
  p_deadline time default '20:30:00',
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
  if p_publication_date is null then raise exception 'PUBLICATION_DATE_REQUIRED'; end if;
  perform public.sync_content_publication_obligations(p_publication_date,p_publication_date);

  select count(*) into v_expected
  from public.content_publication_obligations
  where tenant_id='canonical' and publication_date=p_publication_date;

  if p_publication_date > v_local_date
     or (p_publication_date = v_local_date and v_local_time < p_deadline) then
    return jsonb_build_object('ok',v_expected=7,'state','NOT_DUE','publication_date',p_publication_date,'expected',7,'actual',v_expected,'failed',0);
  end if;

  update public.content_publication_obligations
  set status='FAILED',
      last_error='SILENT_PUBLICATION_FAILURE',
      next_action='Herstel decision → content → identity/media gate → provider dispatch → provider readback → live proof.',
      recovery_attempts=recovery_attempts + case when status='FAILED' then 0 else 1 end,
      evidence=evidence || jsonb_build_object(
        'watchdog','daily-publication-invariant-v2',
        'watchdog_checked_at',p_now,
        'watchdog_previous_status',status,
        'watchdog_reason','SILENT_PUBLICATION_FAILURE'
      ),
      updated_at=now()
  where tenant_id='canonical'
    and publication_date=p_publication_date
    and (
      status not in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED','FAILED')
      or (channel in ('linkedin_personal','linkedin_company','instagram_company') and status='SKIPPED')
    );

  select
    count(*) filter (
      where status in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED')
        and not (channel in ('linkedin_personal','linkedin_company','instagram_company') and status='SKIPPED')
    ),
    count(*) filter (where status='FAILED')
  into v_success,v_failed
  from public.content_publication_obligations
  where tenant_id='canonical' and publication_date=p_publication_date;

  return jsonb_build_object(
    'ok',v_expected=7 and v_failed=0 and v_success=7,
    'state',case when v_expected=7 and v_failed=0 and v_success=7 then 'TERMINAL_OK' else 'FAILED' end,
    'publication_date',p_publication_date,'expected',7,'actual',v_expected,
    'terminal_success',v_success,'failed',v_failed
  );
end;
$$;

-- Backfill the existing approved operating horizon from the existing experiment calendar.
select public.sync_content_publication_obligations(
  (select min(calendar_date) from public.social_experiments where tenant_id='canonical' and calendar_date >= (timezone('Europe/Amsterdam',now()))::date),
  (select max(calendar_date) from public.social_experiments where tenant_id='canonical')
);
