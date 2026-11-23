-- Source-anchored original #116 dispatcher repair, after applied native migration 864.
-- Wake existing due source actions independent of daily new-action quota;
-- same original Edge, same 4h source retries, no new scheduler, queue, paid provider,
-- address promotion, sender, authorization or RLS expansion.
create or replace function public.powerhouse_dispatch_relationship_public_research_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_token text;
  v_request_id bigint;
  v_pending integer := 0;
  v_first_party_researched integer := 0;
  v_first_party_due boolean := false;
  v_due_original_retry boolean := false;
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

  if v_pending=0 and not v_first_party_due and not v_due_original_retry then
    return jsonb_build_object(
      'contract','powerhouse-relationship-public-research-dispatch-v1',
      'dispatched',false,'reason','NO_DUE_ORIGINAL_SOURCE_RESEARCH',
      'pending',0,'first_party_researched',v_first_party_researched,
      'due_original_retry',v_due_original_retry,
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
      'due_original_retry',v_due_original_retry);
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
    'first_party_researched_today',v_first_party_researched,
    'request_id',v_request_id,'run_date',p_run_date,
    'new_scheduler',false,'external_send_executed',false);
end
$function$;

revoke execute on function public.powerhouse_dispatch_relationship_public_research_v1(date)
  from public,anon,authenticated;
grant execute on function public.powerhouse_dispatch_relationship_public_research_v1(date)
  to service_role;
comment on function public.powerhouse_dispatch_relationship_public_research_v1(date) is
'Original #116 dispatches source research and prior due source retries independently of eight new actions daily; all through same original Edge, unchanged recipient and provider gates.';
