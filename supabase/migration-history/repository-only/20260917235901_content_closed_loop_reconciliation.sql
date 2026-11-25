-- One canonical content execution truth loop.
-- GREEN MEANS OUTCOME VERIFIED: transport/scheduler success is never sufficient.

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
       or coalesce((r.evidence->>'stale_delivery_ref')::boolean,false) then
      update public.content_publication_obligations
         set status='BLOCKED',
             external_id=coalesce(nullif(r.delivery_ref,''),external_id),
             evidence=coalesce(evidence,'{}'::jsonb) || r.evidence || jsonb_build_object(
               'reconciler','powerhouse_reconcile_content_outcomes_v1',
               'provider_truth_verified',false,
               'reconciled_at',now(),
               'reconciliation_reason','PROVIDER_RECORD_MISSING'),
             last_error='PROVIDER_RECORD_MISSING',
             next_action='Provider record ontbreekt; re-enter canonieke loop na truth/idempotency preflight. Geen blinde replacement.',
             updated_at=now()
       where tenant_id='canonical' and publication_date=p_date and channel=v_ob_channel;
      v_blocked := v_blocked + 1;
      v_updated := v_updated + 1;
      continue;
    end if;

    if r.channel='linkedin_personal'
       and r.state in ('content_ready','scheduled','published')
       and coalesce((r.evidence->>'personal_truth_verified')::boolean,false) is not true then
      update public.content_publication_obligations
         set status='BLOCKED',
             evidence=coalesce(evidence,'{}'::jsonb) || jsonb_build_object(
               'reconciler','powerhouse_reconcile_content_outcomes_v1',
               'personal_truth_verified',false,
               'reconciled_at',now()),
             last_error='PERSONAL_TRUTH_UNVERIFIED',
             next_action='Persoonlijk LinkedIn blijft fail-closed tot expliciete personal_truth_verified=true evidence bestaat.',
             updated_at=now()
       where tenant_id='canonical' and publication_date=p_date and channel=v_ob_channel;
      v_blocked := v_blocked + 1;
      v_updated := v_updated + 1;
      continue;
    end if;

    if coalesce((r.evidence->>'provider_truth_verified')::boolean,false) is true then
      v_provider_verified := v_provider_verified + 1;
      if r.state='published' then
        v_status := 'PUBLISHED';
      elsif r.state='scheduled' then
        v_status := 'DISPATCHED';
      else
        v_status := null;
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

  update public.content_publication_obligations
     set status='BLOCKED',
         evidence=coalesce(evidence,'{}'::jsonb) || jsonb_build_object(
           'reconciler','powerhouse_reconcile_content_outcomes_v1',
           'provider_truth_verified',coalesce((evidence->>'provider_truth_verified')::boolean,false),
           'reconciled_at',now(),
           'reconciliation_reason','EXACT_FINAL_MEDIA_PROOF_REQUIRED'),
         last_error='EXACT_FINAL_MEDIA_PROOF_REQUIRED',
         next_action='Bewijs immutable exact-final-media digest/frames + Mira PASS; transport sent alleen is onvoldoende.',
         updated_at=now()
   where tenant_id='canonical' and publication_date=p_date and channel='instagram'
     and coalesce(evidence->>'provider_status','')='sent'
     and not (
       coalesce((evidence->>'exact_final_media_proven')::boolean,false) is true
       and nullif(evidence->>'final_media_sha256','') is not null
       and coalesce(evidence->>'mira_gate_result','')='PASS'
     )
     and status not in ('MEASURED','LEARNED');
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

  select count(*) filter (where status in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED')),
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
    'truth_contract','GREEN MEANS OUTCOME VERIFIED',
    'missing_provider_fingerprint','PROVIDER_RECORD_MISSING'
  );
end;
$$;

create or replace function public.powerhouse_linkedin_personal_daily_guard_v1(p_now timestamptz default now())
returns jsonb language plpgsql security definer set search_path=public,pg_catalog as $$
declare v_date date := (p_now at time zone 'Europe/Amsterdam')::date; v_ob public.content_publication_obligations%rowtype; v_action text;
begin
  perform public.powerhouse_reconcile_content_outcomes_v1(v_date);
  select * into v_ob from public.content_publication_obligations where tenant_id='canonical' and publication_date=v_date and channel='linkedin_personal';
  if not found then return jsonb_build_object('ok',false,'action','NO_OBLIGATION'); end if;
  if v_ob.status='DISPATCHED' then perform public.bg_roep_functie('bg-buffer-sync'); v_action:='provider_reconcile_requested';
  elsif v_ob.status in ('PLANNED','GENERATED','APPROVED','BLOCKED','FAILED') then v_action:='canonical_loop_required';
  else v_action:='already_covered'; end if;
  return jsonb_build_object('ok',v_ob.status not in ('BLOCKED','FAILED'),'action',v_action,'status',v_ob.status,'publication_date',v_date,'external_id',v_ob.external_id,'provider_truth_verified',coalesce((v_ob.evidence->>'provider_truth_verified')::boolean,false));
end $$;

create or replace function public.powerhouse_linkedin_company_daily_guard_v1(p_now timestamptz default now())
returns jsonb language plpgsql security definer set search_path=public,pg_catalog as $$
declare v_date date := (p_now at time zone 'Europe/Amsterdam')::date; v_ob public.content_publication_obligations%rowtype; v_action text;
begin
  perform public.powerhouse_reconcile_content_outcomes_v1(v_date);
  select * into v_ob from public.content_publication_obligations where tenant_id='canonical' and publication_date=v_date and channel='linkedin_company';
  if not found then return jsonb_build_object('ok',false,'action','NO_OBLIGATION'); end if;
  if v_ob.status='DISPATCHED' then perform public.bg_roep_functie('bg-buffer-sync'); v_action:='provider_reconcile_requested';
  elsif v_ob.status in ('PLANNED','GENERATED','APPROVED','BLOCKED','FAILED') then v_action:='canonical_loop_required';
  else v_action:='already_covered'; end if;
  return jsonb_build_object('ok',v_ob.status not in ('BLOCKED','FAILED'),'action',v_action,'status',v_ob.status,'publication_date',v_date,'external_id',v_ob.external_id,'provider_truth_verified',coalesce((v_ob.evidence->>'provider_truth_verified')::boolean,false));
end $$;

create or replace function public.powerhouse_instagram_daily_guard_v1(p_now timestamptz default now())
returns jsonb language plpgsql security definer set search_path=public,pg_catalog as $$
declare v_date date := (p_now at time zone 'Europe/Amsterdam')::date; v_ob public.content_publication_obligations%rowtype; v_action text;
begin
  perform public.powerhouse_reconcile_content_outcomes_v1(v_date);
  select * into v_ob from public.content_publication_obligations where tenant_id='canonical' and publication_date=v_date and channel='instagram';
  if not found then return jsonb_build_object('ok',false,'action','NO_OBLIGATION'); end if;
  if v_ob.status='BLOCKED' then v_action:='exact_final_media_verification_required';
  elsif v_ob.status='DISPATCHED' then perform public.bg_roep_functie('bg-buffer-sync'); v_action:='provider_reconcile_requested';
  elsif v_ob.status in ('PLANNED','GENERATED','APPROVED','FAILED') then v_action:='canonical_loop_required';
  else v_action:='already_covered'; end if;
  return jsonb_build_object('ok',v_ob.status not in ('BLOCKED','FAILED'),'action',v_action,'status',v_ob.status,'publication_date',v_date,'external_id',v_ob.external_id,'provider_truth_verified',coalesce((v_ob.evidence->>'provider_truth_verified')::boolean,false));
end $$;

create or replace function public.powerhouse_blog_daily_guard_v1(p_now timestamptz default now())
returns jsonb language plpgsql security definer set search_path=public,pg_catalog as $$
declare v_date date := (p_now at time zone 'Europe/Amsterdam')::date; v_ob public.content_publication_obligations%rowtype; v_action text;
begin
  perform public.powerhouse_reconcile_content_outcomes_v1(v_date);
  select * into v_ob from public.content_publication_obligations where tenant_id='canonical' and publication_date=v_date and channel='blog';
  if not found then return jsonb_build_object('ok',false,'action','NO_OBLIGATION'); end if;
  if v_ob.status in ('PLANNED','GENERATED','APPROVED','BLOCKED','FAILED') then v_action:='canonical_loop_required'; else v_action:='already_covered'; end if;
  return jsonb_build_object('ok',v_ob.status not in ('BLOCKED','FAILED'),'action',v_action,'status',v_ob.status,'publication_date',v_date,'slug',v_ob.slug,'external_id',v_ob.external_id);
end $$;

create or replace function public.powerhouse_content_closed_loop_tick_v1(p_now timestamptz default now())
returns bigint language plpgsql security definer set search_path=public,pg_catalog,net,vault as $$
declare v_request bigint; v_date date := (p_now at time zone 'Europe/Amsterdam')::date;
begin
  perform public.powerhouse_reconcile_content_outcomes_v1(v_date);
  select net.http_post(
    url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-content-loop',
    headers := jsonb_build_object('content-type','application/json','x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)),
    body := jsonb_build_object('runDate',v_date::text),
    timeout_milliseconds := 120000
  ) into v_request;
  return v_request;
end $$;

-- Fail closed: all SECURITY DEFINER functions are internal-only.
revoke execute on function public.powerhouse_reconcile_content_outcomes_v1(date) from public, anon, authenticated;
revoke execute on function public.powerhouse_linkedin_personal_daily_guard_v1(timestamptz) from public, anon, authenticated;
revoke execute on function public.powerhouse_linkedin_company_daily_guard_v1(timestamptz) from public, anon, authenticated;
revoke execute on function public.powerhouse_instagram_daily_guard_v1(timestamptz) from public, anon, authenticated;
revoke execute on function public.powerhouse_blog_daily_guard_v1(timestamptz) from public, anon, authenticated;
revoke execute on function public.powerhouse_content_closed_loop_tick_v1(timestamptz) from public, anon, authenticated;

grant execute on function public.powerhouse_reconcile_content_outcomes_v1(date) to service_role;
grant execute on function public.powerhouse_linkedin_personal_daily_guard_v1(timestamptz) to service_role;
grant execute on function public.powerhouse_linkedin_company_daily_guard_v1(timestamptz) to service_role;
grant execute on function public.powerhouse_instagram_daily_guard_v1(timestamptz) to service_role;
grant execute on function public.powerhouse_blog_daily_guard_v1(timestamptz) to service_role;
grant execute on function public.powerhouse_content_closed_loop_tick_v1(timestamptz) to service_role;
