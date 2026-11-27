-- Original public relationship source false-green recovery. SAME existing
-- #116 hourly dispatcher, SAME Edge, SAME original action and ONE BRAIN owner.
-- Wakes the original worker only when a safely held source has a tracked Google
-- redirect; never grants outbound authorization, never queues a second worker.
CREATE OR REPLACE FUNCTION public.powerhouse_dispatch_relationship_public_research_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_token text;
  v_request_id bigint;
  v_pending integer := 0;
  v_first_party_researched integer := 0;
  v_first_party_due boolean := false;
  v_due_original_retry boolean := false;
  v_due_wrapped_source_review boolean := false;
begin
  if p_run_date is distinct from (now() at time zone 'Europe/Amsterdam')::date then
    return jsonb_build_object(
      'contract','powerhouse-relationship-public-research-dispatch-v1',
      'dispatched',false,'reason','NON_CURRENT_BUSINESS_DAY',
      'run_date',p_run_date,'new_scheduler',false);
  end if;

  select count(*)::int into v_pending
  from public.powerhouse_sales_actions
  where action_type='research_enrichment' and channel='internal'
    and status in ('suggested','prepared','waiting')
    and dedupe_key like 'relationship-research:%'
    and (due_at is null or due_at<=now());

  -- This tally represents the SAME original internal action queue; never
  -- allocate an unbounded or parallel job when no research is due.
  select count(*)::int into v_first_party_researched
  from public.powerhouse_sales_actions
  where dedupe_key like 'relationship-research:public-domain:'||p_run_date::text||':%';

  if v_first_party_researched < 8 then
    select exists(
      select 1
      from (
        select distinct lower(btrim(known.bedrijf)) company
        from public.bg_connecties known
        where known.email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$'
          and nullif(btrim(known.bedrijf),'') is not null
          and lower(split_part(known.email,'@',2)) not in
            ('gmail.com','outlook.com','hotmail.com','icloud.com',
             'live.nl','yahoo.com','proton.me','protonmail.com')
      ) known
      join public.bg_connecties missing
        on lower(btrim(missing.bedrijf))=known.company
      where missing.email is null
        and nullif(btrim(missing.naam),'') is not null
        and nullif(btrim(missing.sleutel),'') is not null
        and coalesce(missing.extra->>'approval_revoked','false')<>'true'
        and coalesce(missing.extra->>'do_not_contact','false')<>'true'
        and coalesce(missing.extra->>'opt_out','false')<>'true'
    ) into v_first_party_due;
  end if;

  -- Wake the SAME original worker for a source retry even if today's quota
  -- of eight new first-party research actions is already exhausted.
  select exists(
    select 1 from public.powerhouse_sales_actions a
    where a.action_type='research_enrichment'
      and a.channel='internal' and a.status='done'
      and a.dedupe_key like 'relationship-research:public-domain:%'
      and a.evidence->>'public_email_source_checked'='false'
      and case when a.evidence->>'public_email_next_attempt_at'
           ~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]+)?(Z|[+-][0-9]{2}:[0-9]{2})$'
        then (a.evidence->>'public_email_next_attempt_at')::timestamptz <= now()
        else false end
  ) into v_due_original_retry;

  -- Same original #116 research owner must wake for a prior false-VERIFIED
  -- tracked SERP redirect even when there are ZERO new/due search actions.
  -- The existing Edge safely replays only still-held exact recipients, and
  -- cannot create a second scheduler, email sender or paid provider request.
  select exists(
    select 1
    from public.powerhouse_sales_actions a
    join public.powerhouse_sales_actions o
      on o.action_id::text=a.evidence->>'original_outreach_action_id'
      and o.person_key=a.person_key
      and o.company_key=a.company_key
    where a.action_type='research_enrichment' and a.channel='internal'
      and a.status='done'
      and a.dedupe_key like 'relationship-research:outreach-source:%'
      and a.created_at>=now()-interval '7 days'
      and coalesce(a.evidence#>>'{public_research_execution,source_url}',a.source_url,'')
        ~* '^https://(www[.])?google[.][a-z.]+/(goto|url|aclk)([/?#]|$)'
      and o.action_type='autonomous_email' and o.channel='email'
      and o.status in ('prepared','waiting')
      and o.evidence#>>'{execution_gate,reason}'='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'
      and nullif(o.evidence#>>'{autonomous_outbound,provider_message_id}','') is null
      and nullif(o.evidence#>>'{native_gmail_executor,provider_message_id}','') is null
      and nullif(o.evidence->>'provider_message_id','') is null
      and coalesce(o.evidence#>>'{autonomous_outbound,needs_readback}','false')<>'true'
      and coalesce(o.evidence#>>'{autonomous_outbound,republish_forbidden}','false')<>'true'
      and coalesce(o.evidence#>>'{provider_ambiguity_quarantine,external_resend_forbidden}','false')<>'true'
  ) into v_due_wrapped_source_review;

  if v_pending=0 and not v_first_party_due and not v_due_original_retry
     and not v_due_wrapped_source_review then
    return jsonb_build_object(
      'contract','powerhouse-relationship-public-research-dispatch-v1',
      'dispatched',false,'reason','NO_DUE_ORIGINAL_SOURCE_RESEARCH',
      'pending',0,'first_party_researched',v_first_party_researched,
      'due_original_retry',v_due_original_retry,
      'due_wrapped_source_review',v_due_wrapped_source_review,
      'new_scheduler',false,'external_send_executed',false);
  end if;

  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name='powerhouse_daily_scheduler_token'
  order by created_at desc limit 1;
  if nullif(v_token,'') is null then
    return jsonb_build_object(
      'contract','powerhouse-relationship-public-research-dispatch-v1',
      'dispatched',false,'reason','SCHEDULER_TOKEN_MISSING',
      'pending',v_pending,'first_party_due',v_first_party_due,
      'due_original_retry',v_due_original_retry,
      'due_wrapped_source_review',v_due_wrapped_source_review);
  end if;

  -- SAME Edge and private x-powerhouse-token; never a new endpoint.
  select net.http_post(
    url:='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-relationship-public-research',
    headers:=jsonb_build_object('content-type','application/json',
      'x-powerhouse-token',v_token),
    body:=jsonb_build_object('run_date',p_run_date),
    timeout_milliseconds:=120000
  ) into v_request_id;

  return jsonb_build_object(
    'contract','powerhouse-relationship-public-research-dispatch-v1',
    'dispatched',true,'pending',v_pending,
    'first_party_due',v_first_party_due,
    'due_original_retry',v_due_original_retry,
    'due_wrapped_source_review',v_due_wrapped_source_review,
    'first_party_researched_today',v_first_party_researched,
    'request_id',v_request_id,'run_date',p_run_date,
    'new_scheduler',false,'external_send_executed',false);
end
$function$
;
-- Preserve the original service_role-only gateway.
revoke execute on function public.powerhouse_dispatch_relationship_public_research_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_dispatch_relationship_public_research_v1(date) to service_role;
comment on function public.powerhouse_dispatch_relationship_public_research_v1(date) is
'Original #116 relationship research dispatch, including safe wake for held Google tracking redirect source correction, no new scheduler or send.';
