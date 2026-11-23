-- One loop: every stuck publication is matched to a blocker playbook entry, gets a recovery
-- check recorded, and escalates with an owner when it stays stuck. Unknown error codes are
-- logged as incidents so they become playbook entries and never repeat. Uses the existing
-- failure registry and the existing hourly tick; no new scheduler. Nothing republishes here.
create table if not exists public.powerhouse_blocker_playbook (
  code text primary key,
  channels text not null,
  cause text not null,
  prevention text not null,
  recovery_class text not null check (recovery_class in ('AUTO_RETRY','OWNER_ACTION','HUMAN_DECISION')),
  escalate_after_hours integer not null default 6,
  created_at timestamptz not null default now()
);
alter table public.powerhouse_blocker_playbook enable row level security;
revoke all on public.powerhouse_blocker_playbook from public, anon, authenticated;

create table if not exists public.powerhouse_blocker_recovery_log (
  publication_date date not null,
  channel text not null,
  code text not null,
  checks integer not null default 0,
  first_seen_at timestamptz not null default now(),
  last_checked_at timestamptz not null default now(),
  escalated_at timestamptz,
  primary key (publication_date, channel)
);
alter table public.powerhouse_blocker_recovery_log enable row level security;
revoke all on public.powerhouse_blocker_recovery_log from public, anon, authenticated;

insert into public.powerhouse_blocker_playbook(code, channels, cause, prevention, recovery_class, escalate_after_hours) values
  ('SILENT_PUBLICATION_FAILURE', 'blog,instagram,linkedin_company,linkedin_personal', 'Obligation ended FAILED without provider-visible proof (14 blog, 7 instagram, 10 company, 13 personal; 16 Sep-2 Nov).', 'Never mark green without provider proof; missed-publication report raises an incident with owner.', 'OWNER_ACTION', 6),
  ('MEDIA_ASSET_REQUIRED', 'instagram', '27 BLOCKED days: no final Mira media existed because no scheduled producer runs.', 'Schedule the original Mira producer with claim, budget and identity safeguards; no static fallback.', 'OWNER_ACTION', 6),
  ('EXACT_FINAL_MEDIA_PROOF_REQUIRED', 'instagram', 'Published asset not bound to the exact final media.', 'Bind proof to exact final file hash and independent Meta readback.', 'OWNER_ACTION', 6),
  ('VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH', 'instagram', 'Frame identity 0.920 below the 0.940 threshold (22 Oct-3 Nov).', 'Three frame checks >= 0.940; regenerate once within budget, never lower the threshold.', 'OWNER_ACTION', 6),
  ('MIRA_ASSET_QUALITY_AND_PROVIDER_REVIEW_REQUIRED', 'instagram', 'Asset failed quality and provider review.', 'Review before publish; regenerate, do not publish.', 'OWNER_ACTION', 6),
  ('MEDIA_PROVIDER_UNAVAILABLE', 'instagram', 'Media provider down (22 Sep).', 'Retry within budget, then incident; Veo/openart routing decision must be checked first.', 'AUTO_RETRY', 3),
  ('PRE_PUBLISH_GATE_BLOCKED', 'instagram,linkedin_company', 'Pre-publish gate rejected content.', 'Fix content to the gate, never bypass the gate.', 'OWNER_ACTION', 6),
  ('COMPOSIO_INSTAGRAM_AUTH_REQUIRED', 'instagram', 'Composio Instagram connection expired (20 Sep).', 'Reconnect via Composio; auth errors stay uncaught and raise an incident.', 'HUMAN_DECISION', 2),
  ('GLOBAL_POST_DUPLICATE_BLOCKED', 'linkedin_company,linkedin_personal', 'Same story family reused within the duplicate window (8 rows, 16 Oct-3 Nov).', 'Choose a new story family before generating; check claims table. Never republish blindly.', 'OWNER_ACTION', 6),
  ('PERSONAL_SOURCE_UNVERIFIED', 'linkedin_personal', 'Personal post lacked a verified first-person source (4 Oct).', 'Only post lived events with a verified source.', 'OWNER_ACTION', 6),
  ('LINKEDIN_REAUTH_REQUIRED', 'linkedin_personal', 'LinkedIn token revoked, 401 REVOKED_ACCESS_TOKEN (5 Oct).', 'Reconnect LinkedIn; surface as incident immediately.', 'HUMAN_DECISION', 2),
  ('COMPOSIO_LINKEDIN_GET_POST_CONTENT_200', 'linkedin_personal', 'Readback forbidden for a post (9 Oct).', 'Use provider post ID reconciliation instead of content readback.', 'OWNER_ACTION', 6),
  ('GITHUB_ACTIONS_PR_CREATION_DENIED', 'blog', 'Blog workflow ''Create exactly one protected candidate'' fails: Actions may not create PRs (Arthur''s GitHub setting).', 'Surfaces as incident; Arthur enables ''Allow GitHub Actions to create and approve pull requests''.', 'HUMAN_DECISION', 2),
  ('NO_OBLIGATION_ROW', 'email_newsletter', 'No email_newsletter obligation rows and no authorized executor (3-6 Nov).', 'Create obligation rows and designate an executor with email_canonical_authorization_required.', 'HUMAN_DECISION', 4),
  ('DOCS_CHANGES_GITIGNORED', 'blog', 'docs/changes/powerhouse-blog-*.md is gitignored, closure bundle silently incomplete.', 'Use another file name such as blogcandidate-closure-*.', 'OWNER_ACTION', 6),
  ('MIGRATION_LOCK_PARITY', 'all', 'Migration applied without lock entry turned main red.', 'Follow-up recovery PR appends lock; never predeclare in the candidate PR.', 'OWNER_ACTION', 6)
on conflict (code) do nothing;

create or replace function public.powerhouse_recover_stuck_publications_v1(p_now timestamptz default now())
returns integer
language plpgsql
security definer
set search_path to 'public', 'pg_catalog'
as $fn$
declare
  m jsonb;
  v_n integer := 0;
  v_date date;
  v_channel text;
  v_code text;
  v_err text;
  pb public.powerhouse_blocker_playbook%rowtype;
  v_log public.powerhouse_blocker_recovery_log%rowtype;
  v_hours numeric;
begin
  for m in select * from jsonb_array_elements(coalesce(public.powerhouse_missed_publication_v1(p_now, 3)->'missed','[]'::jsonb)) loop
    v_date := (m->>'publication_date')::date;
    v_channel := m->>'channel';
    select o.last_error into v_err from public.content_publication_obligations o
      where o.tenant_id = 'canonical' and o.publication_date = v_date and o.channel = v_channel;
    v_code := coalesce(nullif(split_part(coalesce(v_err,''), ':', 1), ''),
                       case when (m->>'status') = 'NO_OBLIGATION_ROW' then 'NO_OBLIGATION_ROW' else 'SILENT_PUBLICATION_FAILURE' end);
    v_hours := coalesce((m->>'hours_late')::numeric, 0);

    select * into pb from public.powerhouse_blocker_playbook where code = v_code;

    insert into public.powerhouse_blocker_recovery_log(publication_date, channel, code, checks, last_checked_at)
      values (v_date, v_channel, v_code, 1, p_now)
    on conflict (publication_date, channel)
      do update set checks = powerhouse_blocker_recovery_log.checks + 1, code = excluded.code, last_checked_at = p_now
    returning * into v_log;

    if pb.code is null then
      perform public.brain_observe_failure(
        'blocker-unregistered:' || v_code,
        'powerhouse|content|blocker-unregistered|' || v_code,
        encode(sha256(convert_to(v_code, 'utf8')), 'hex'),
        jsonb_build_object('kind','UNREGISTERED_BLOCKER','code',v_code,'channel',v_channel,
          'publication_date',v_date::text,'owner',m->>'owner',
          'rule','Nieuwe foutcode: voeg toe aan powerhouse_blocker_playbook en brain/content-publication-blocker-register.json met oorzaak en preventie.'));
    elsif v_hours >= pb.escalate_after_hours and v_log.escalated_at is null then
      perform public.brain_observe_failure(
        'blocker-escalated:' || v_date::text || ':' || v_channel,
        'powerhouse|content|blocker-escalated|' || v_code,
        encode(sha256(convert_to(v_date::text || '|' || v_channel || '|' || v_code, 'utf8')), 'hex'),
        jsonb_build_object('kind','BLOCKER_ESCALATED','code',v_code,'channel',v_channel,
          'publication_date',v_date::text,'owner',m->>'owner','recovery_class',pb.recovery_class,
          'hours_late',v_hours,'checks',v_log.checks,'cause',pb.cause,'prevention',pb.prevention,
          'rule','Vast na de escalatiegrens: de eigenaar voert de preventieregel uit; nooit blind opnieuw publiceren.'));
      update public.powerhouse_blocker_recovery_log set escalated_at = p_now
        where publication_date = v_date and channel = v_channel;
    end if;
    v_n := v_n + 1;
  end loop;
  return v_n;
end
$fn$;

revoke all on function public.powerhouse_recover_stuck_publications_v1(timestamptz) from public, anon, authenticated;
grant execute on function public.powerhouse_recover_stuck_publications_v1(timestamptz) to service_role;

create or replace function public.powerhouse_content_closed_loop_tick_v1(p_now timestamp with time zone default now())
returns bigint
language plpgsql
security definer
set search_path to 'public', 'pg_catalog', 'net', 'vault'
as $function$
declare
  v_request bigint;
  v_date date := (p_now at time zone 'Europe/Amsterdam')::date;
  v_token text;
begin
  begin
    perform public.powerhouse_reconcile_content_outcomes_v1(v_date);
  exception when others then
    raise warning 'CONTENT_OUTCOME_RECONCILE_ISOLATED: % %', sqlstate, left(sqlerrm, 240);
    begin
      insert into public.bg_gezondheid(gemeten_op, onderdeel, soort, status, detail, gegevens)
      values (now(), 'powerhouse-content-closed-loop-tick', 'reconciliation', 'fout', left(sqlerrm,360),
        jsonb_build_object('run_date',v_date::text,'stage','reconcile_pre','isolated',true));
    exception when others then
      raise warning 'CONTENT_RECONCILE_DIAGNOSTIC_WRITE_FAILED: %', sqlstate;
    end;
  end;

  begin
    perform public.powerhouse_measure_content_outcomes_v1(p_now);
  exception when others then
    raise warning 'CONTENT_OUTCOME_MEASURE_ISOLATED: % %', sqlstate, left(sqlerrm, 240);
    begin
      insert into public.bg_gezondheid(gemeten_op, onderdeel, soort, status, detail, gegevens)
      values (now(), 'powerhouse-content-closed-loop-tick', 'measurement', 'fout', left(sqlerrm,360),
        jsonb_build_object('run_date',v_date::text,'stage','measure','isolated',true));
    exception when others then
      raise warning 'CONTENT_MEASURE_DIAGNOSTIC_WRITE_FAILED: %', sqlstate;
    end;
  end;

  begin
    perform public.powerhouse_report_missed_publications_v1(p_now);
  exception when others then
    raise warning 'CONTENT_MISSED_PUBLICATION_REPORT_ISOLATED: % %', sqlstate, left(sqlerrm, 240);
    begin
      insert into public.bg_gezondheid(gemeten_op, onderdeel, soort, status, detail, gegevens)
      values (now(), 'powerhouse-content-closed-loop-tick', 'missed-publication-report', 'fout', left(sqlerrm,360),
        jsonb_build_object('run_date',v_date::text,'stage','missed_report','isolated',true));
    exception when others then
      raise warning 'CONTENT_MISSED_REPORT_DIAGNOSTIC_WRITE_FAILED: %', sqlstate;
    end;
  end;

  begin
    perform public.powerhouse_recover_stuck_publications_v1(p_now);
  exception when others then
    raise warning 'CONTENT_STUCK_RECOVERY_ISOLATED: % %', sqlstate, left(sqlerrm, 240);
    begin
      insert into public.bg_gezondheid(gemeten_op, onderdeel, soort, status, detail, gegevens)
      values (now(), 'powerhouse-content-closed-loop-tick', 'stuck-recovery', 'fout', left(sqlerrm,360),
        jsonb_build_object('run_date',v_date::text,'stage','stuck_recovery','isolated',true));
    exception when others then
      raise warning 'CONTENT_STUCK_RECOVERY_DIAGNOSTIC_WRITE_FAILED: %', sqlstate;
    end;
  end;

  -- Auth/security and provider dispatch errors are deliberately NOT caught.
  v_token := nullif(trim(public.bg_geheim('powerhouse_daily_scheduler_token')), '');
  if v_token is null then
    raise exception 'CONTENT_LOOP_SCHEDULER_TOKEN_UNAVAILABLE';
  end if;
  select net.http_post(
    url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-content-loop',
    headers := jsonb_build_object('content-type','application/json','x-powerhouse-token',v_token),
    body := jsonb_build_object('runDate',v_date::text),
    timeout_milliseconds := 120000
  ) into v_request;
  return v_request;
end
$function$;
