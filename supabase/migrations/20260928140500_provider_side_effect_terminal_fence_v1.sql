-- provider-side-effect-terminal-fence-v1
-- A provider-created external ID is a durable anti-duplicate fence.
-- Readback/admin/media-proof limitations after a successful provider write must
-- never downgrade the already-created social publication to BLOCKED/FAILED.

create or replace function public.powerhouse_provider_side_effect_proven_v1(
  p_external_id text,
  p_evidence jsonb
)
returns boolean
language sql
immutable
set search_path = public, pg_catalog
as $$
  select
    nullif(btrim(coalesce(p_external_id,'')),'') is not null
    and public.powerhouse_jsonb_true(coalesce(p_evidence,'{}'::jsonb),'republish_forbidden')
    and (
      public.powerhouse_jsonb_true(coalesce(p_evidence,'{}'::jsonb),'provider_create_success')
      or public.powerhouse_jsonb_true(coalesce(p_evidence,'{}'::jsonb),'provider_publication_ack_verified')
      or public.powerhouse_jsonb_true(coalesce(p_evidence,'{}'::jsonb),'provider_truth_verified')
    );
$$;

create or replace function public.powerhouse_reconcile_content_outcomes_v1(
  p_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  r record;
  v_ob_channel text;
  v_status text;
  v_updated integer := 0;
  v_blocked integer := 0;
  v_provider_verified integer := 0;
  v_outcome_verified integer := 0;
begin
  perform public.sync_content_publication_obligations(p_date, p_date);

  for r in
    select d.channel, d.state, d.delivery_ref, coalesce(d.delivery_evidence,'{}'::jsonb) evidence
      from public.powerhouse_channel_decisions d
     where d.run_date = p_date
       and d.channel in ('linkedin_personal','linkedin_company','instagram_company')
  loop
    v_ob_channel := case when r.channel='instagram_company' then 'instagram' else r.channel end;

    if coalesce(r.evidence->>'error','') = 'PROVIDER_RECORD_MISSING'
       or public.powerhouse_jsonb_true(r.evidence,'stale_delivery_ref') then
      update public.content_publication_obligations
         set status='BLOCKED',
             external_id=coalesce(nullif(r.delivery_ref,''),external_id),
             evidence=coalesce(evidence,'{}'::jsonb) || r.evidence || jsonb_build_object(
               'reconciler','powerhouse_reconcile_content_outcomes_v1',
               'provider_truth_verified',false,
               'reconciled_at',now(),
               'reconciliation_reason','PROVIDER_RECORD_MISSING'),
             last_error='PROVIDER_RECORD_MISSING',
             next_action='Provider record ontbreekt; reconcile exact provider ID. Geen blinde replacement.',
             updated_at=now()
       where tenant_id='canonical' and publication_date=p_date and channel=v_ob_channel;
      v_blocked := v_blocked + 1;
      v_updated := v_updated + 1;
      continue;
    end if;

    -- Terminal side-effect fence: provider create acknowledgement + durable external ID
    -- can never be negated by later readback/admin/media-proof permission limitations.
    if public.powerhouse_provider_side_effect_proven_v1(r.delivery_ref,r.evidence) then
      update public.powerhouse_channel_decisions
         set state='published',
             delivery_evidence=coalesce(delivery_evidence,'{}'::jsonb) || jsonb_build_object(
               'provider_publication_ack_verified',true,
               'republish_forbidden',true,
               'side_effect_terminal_fence','provider-side-effect-terminal-fence-v1',
               'reconciled_at',now()
             ),
             updated_at=now()
       where run_date=p_date and channel=r.channel;

      update public.content_publication_obligations
         set status='PUBLISHED',
             external_id=coalesce(nullif(r.delivery_ref,''),external_id),
             evidence=coalesce(evidence,'{}'::jsonb) || r.evidence || jsonb_build_object(
               'reconciler','powerhouse_reconcile_content_outcomes_v1',
               'provider_publication_ack_verified',true,
               'republish_forbidden',true,
               'side_effect_terminal_fence','provider-side-effect-terminal-fence-v1',
               'reconciled_at',now()
             ),
             last_error=null,
             next_action='Collect outcome metrics. Exact readback is enrichment only; never republish this provider-created ID.',
             updated_at=now()
       where tenant_id='canonical'
         and publication_date=p_date
         and channel=v_ob_channel
         and status not in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED');

      v_provider_verified := v_provider_verified + 1;
      v_updated := v_updated + 1;
      continue;
    end if;

    if r.channel='linkedin_personal'
       and r.state in ('content_ready','scheduled','published')
       and public.powerhouse_jsonb_true(r.evidence,'personal_truth_verified') is not true then
      update public.content_publication_obligations
         set status='BLOCKED',
             evidence=coalesce(evidence,'{}'::jsonb) || jsonb_build_object(
               'reconciler','powerhouse_reconcile_content_outcomes_v1',
               'personal_truth_verified',false,
               'reconciled_at',now()),
             last_error='PERSONAL_TRUTH_UNVERIFIED',
             next_action='Persoonlijk LinkedIn blijft pre-provider fail-closed tot expliciete personal_truth_verified=true evidence bestaat.',
             updated_at=now()
       where tenant_id='canonical' and publication_date=p_date and channel=v_ob_channel;
      v_blocked := v_blocked + 1;
      v_updated := v_updated + 1;
      continue;
    end if;

    if public.powerhouse_jsonb_true(r.evidence,'provider_truth_verified') is true then
      v_provider_verified := v_provider_verified + 1;
      if r.state='published' then v_status := 'PUBLISHED';
      elsif r.state='scheduled' then v_status := 'DISPATCHED';
      else v_status := null;
      end if;
      if v_status is not null then
        update public.content_publication_obligations
           set status=v_status,
               external_id=coalesce(nullif(r.delivery_ref,''),external_id),
               evidence=coalesce(evidence,'{}'::jsonb) || r.evidence || jsonb_build_object(
                 'reconciler','powerhouse_reconcile_content_outcomes_v1',
                 'provider_truth_verified',true,
                 'reconciled_at',now()),
               last_error=null,
               updated_at=now()
         where tenant_id='canonical' and publication_date=p_date and channel=v_ob_channel
           and status not in ('LIVE_PROVEN','MEASURED','LEARNED');
        v_updated := v_updated + 1;
      end if;
    end if;
  end loop;

  -- Exact-final-media is a PRE-PUBLISH gate. It may not retroactively invalidate
  -- an already provider-created Instagram post.
  update public.content_publication_obligations
     set status='BLOCKED',
         evidence=coalesce(evidence,'{}'::jsonb) || jsonb_build_object(
           'reconciler','powerhouse_reconcile_content_outcomes_v1',
           'provider_truth_verified',public.powerhouse_jsonb_true(evidence,'provider_truth_verified'),
           'reconciled_at',now(),
           'reconciliation_reason','EXACT_FINAL_MEDIA_PROOF_REQUIRED'),
         last_error='EXACT_FINAL_MEDIA_PROOF_REQUIRED',
         next_action='Bewijs immutable exact-final-media digest/frames + Mira PASS vóór provider write.',
         updated_at=now()
   where tenant_id='canonical' and publication_date=p_date and channel='instagram'
     and coalesce(evidence->>'provider_status','') in ('sent','published')
     and not public.powerhouse_provider_side_effect_proven_v1(external_id,evidence)
     and not (
       public.powerhouse_jsonb_true(evidence,'exact_final_media_proven') is true
       and nullif(evidence->>'final_media_sha256','') is not null
       and coalesce(evidence->>'mira_gate_result','')='PASS'
     )
     and status not in ('PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED');
  get diagnostics v_blocked = row_count;

  update public.content_publication_obligations o
     set status = case when o.status='PLANNED' then 'GENERATED' else o.status end,
         evidence=coalesce(o.evidence,'{}'::jsonb) || jsonb_build_object(
           'reconciler','powerhouse_reconcile_content_outcomes_v1','artifact_truth_verified',true,'reconciled_at',now()),
         next_action=case when o.status='PLANNED' then 'Canonical blog artifact gereed; continue via approved central queue → BG169 → public proof.' else o.next_action end,
         updated_at=now()
   where o.tenant_id='canonical' and o.publication_date=p_date and o.channel='blog'
     and exists (
       select 1 from public.powerhouse_content_artifacts a
       join public.powerhouse_channel_decisions d on d.run_date=a.run_date and d.channel=a.channel
       where a.run_date=p_date and a.channel='blog' and a.status='content_ready'
         and d.decision='publish' and d.state='content_ready'
     )
     and o.status not in ('PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED','SKIPPED');

  select count(*) filter (
           where status in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED')
              or (
                channel in ('linkedin_personal','linkedin_company','instagram')
                and status='PUBLISHED'
                and public.powerhouse_provider_side_effect_proven_v1(external_id,evidence)
              )
         ),
         count(*) filter (where status in ('BLOCKED','FAILED'))
    into v_outcome_verified, v_blocked
    from public.content_publication_obligations
   where tenant_id='canonical' and publication_date=p_date
     and channel in ('linkedin_personal','linkedin_company','instagram','blog');

  return jsonb_build_object(
    'ok',v_blocked=0,
    'publication_date',p_date,
    'updated',v_updated,
    'provider_truth_verified_count',v_provider_verified,
    'outcome_verified_count',v_outcome_verified,
    'blocked_count',v_blocked,
    'truth_contract','PROVIDER CREATE ACK + DURABLE ID IS TERMINAL SIDE-EFFECT TRUTH',
    'terminal_fence','provider-side-effect-terminal-fence-v1'
  );
end;
$$;

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
  if p_publication_date is null then raise exception 'PUBLICATION_DATE_REQUIRED'; end if;

  perform public.sync_content_publication_obligations(p_publication_date, p_publication_date);
  perform public.powerhouse_reconcile_content_outcomes_v1(p_publication_date);

  select count(*) into v_expected
  from public.content_publication_obligations
  where tenant_id='canonical' and publication_date=p_publication_date
    and channel in ('linkedin_personal','linkedin_company','instagram','blog');

  if p_publication_date > v_local_date
     or (p_publication_date = v_local_date and v_local_time < p_deadline) then
    return jsonb_build_object('ok',true,'state','NOT_DUE','publication_date',p_publication_date,'expected',v_expected,'failed',0);
  end if;

  -- Normalize any surviving provider-created social side effect before evaluating failure.
  update public.content_publication_obligations
     set status='PUBLISHED',
         last_error=null,
         evidence=coalesce(evidence,'{}'::jsonb) || jsonb_build_object(
           'watchdog','daily-publication-invariant-v2',
           'watchdog_checked_at',p_now,
           'watchdog_reason','PROVIDER_SIDE_EFFECT_TERMINAL_FENCE',
           'provider_publication_ack_verified',true,
           'republish_forbidden',true
         ),
         updated_at=now()
   where tenant_id='canonical'
     and publication_date=p_publication_date
     and channel in ('linkedin_personal','linkedin_company','instagram')
     and public.powerhouse_provider_side_effect_proven_v1(external_id,evidence)
     and status not in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED');

  update public.content_publication_obligations
     set status='FAILED',
         last_error='SILENT_PUBLICATION_FAILURE',
         next_action='Herstel de publicatieketen end-to-end; géén replacement wanneer provider side-effect bewijs bestaat.',
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
     and channel in ('linkedin_personal','linkedin_company','instagram','blog')
     and status not in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED','FAILED')
     and not (
       channel in ('linkedin_personal','linkedin_company','instagram')
       and public.powerhouse_provider_side_effect_proven_v1(external_id,evidence)
     );

  select count(*) filter (
           where status in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED')
              or (
                channel in ('linkedin_personal','linkedin_company','instagram')
                and status='PUBLISHED'
                and public.powerhouse_provider_side_effect_proven_v1(external_id,evidence)
              )
         ),
         count(*) filter (where status='FAILED')
    into v_success,v_failed
    from public.content_publication_obligations
   where tenant_id='canonical'
     and publication_date=p_publication_date
     and channel in ('linkedin_personal','linkedin_company','instagram','blog');

  return jsonb_build_object(
    'ok',v_expected>0 and v_failed=0 and v_success=v_expected,
    'state',case when v_failed=0 and v_success=v_expected and v_expected>0 then 'TERMINAL_OK' else 'FAILED' end,
    'publication_date',p_publication_date,
    'expected',v_expected,
    'terminal_success',v_success,
    'failed',v_failed,
    'terminal_fence','provider-side-effect-terminal-fence-v1'
  );
end;
$$;

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
             and not (
               channel in ('linkedin_personal','linkedin_company','instagram')
               and status='PUBLISHED'
               and public.powerhouse_provider_side_effect_proven_v1(external_id,evidence)
             )
         )
    into v_expected,v_bad
    from public.content_publication_obligations
   where tenant_id='canonical'
     and publication_date=p_publication_date
     and channel in ('linkedin_personal','linkedin_company','instagram','blog');

  if v_expected=0 or v_bad>0 then
    raise exception 'DAILY_PUBLICATION_INVARIANT_FAILED date=% expected=% non_terminal=%',p_publication_date,v_expected,v_bad;
  end if;
end;
$$;

comment on function public.powerhouse_provider_side_effect_proven_v1(text,jsonb)
is 'Terminal anti-duplicate fence: durable provider external ID + create/ack/truth evidence + republish_forbidden means the social side effect exists and cannot be downgraded by later readback/admin/media-proof limitations.';

revoke execute on function public.powerhouse_provider_side_effect_proven_v1(text,jsonb) from public, anon, authenticated;
grant execute on function public.powerhouse_provider_side_effect_proven_v1(text,jsonb) to service_role, postgres;

revoke execute on function public.powerhouse_reconcile_content_outcomes_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_reconcile_content_outcomes_v1(date) to service_role;

revoke all on function public.enforce_content_publication_daily_invariant(date,time,timestamptz) from public;
grant execute on function public.enforce_content_publication_daily_invariant(date,time,timestamptz) to service_role, postgres;

revoke all on function public.assert_content_publication_daily_invariant(date) from public;
grant execute on function public.assert_content_publication_daily_invariant(date) to service_role, postgres;

-- Repair today's known provider-created social side effects using the same generic rule.
perform public.powerhouse_reconcile_content_outcomes_v1((timezone('Europe/Amsterdam',now()))::date);
