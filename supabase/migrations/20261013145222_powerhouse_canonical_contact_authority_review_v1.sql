-- Existing POWERHOUSE Heartbeat contact-authority review. No new sender, queue or scheduler.
-- A missing approval is NEVER inferred from an existing LinkedIn relationship or email.
create or replace function public.powerhouse_contact_authority_review_batch_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date,
  p_limit integer default 500
) returns jsonb
language plpgsql security invoker set search_path = pg_catalog, public
as $$
declare v_reviewed integer := 0; v_approved integer := 0; v_suppressed integer := 0;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('powerhouse_contact_authority_review_batch_v1',0)) then
    return jsonb_build_object('state','BUSY','run_date',p_run_date);
  end if;
  with candidates as (
    select s.person_key, lower(btrim(coalesce(c.email,''))) email,
      coalesce(c.extra,'{}'::jsonb) extra,
      case
        when exists (
          select 1 from public.powerhouse_email_contact_suppressions x
          where x.active=true and lower(x.email)=lower(btrim(coalesce(c.email,'')))
            and nullif(btrim(coalesce(c.email,'')),'') is not null
        ) then 'SUPPRESSED'
        when nullif(btrim(coalesce(c.email,'')),'') is null then 'NO_EMAIL'
        when c.email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$' then 'INVALID_EMAIL'
        when coalesce(c.extra->>'human_approved','') <> 'true' then 'AUTHORITY_REVIEW_REQUIRED'
        when exists (
          select 1 from public.powerhouse_sales_actions a
          where a.person_key=s.person_key and a.channel in ('email','linkedin_dm')
            and a.executed_at >= now()-interval '14 days' and a.status='done'
        ) then 'CONTACT_PRESSURE_COOLDOWN'
        else 'APPROVED_FURTHER_GATES_REQUIRED'
      end authority_state,
      s.linkedin_events_30d,s.external_signals_90d,s.company_news_120d
    from public.powerhouse_connection_enrichment_state_v1 s
    join public.bg_connecties c
      on (c.sleutel=s.person_key or c.linkedin_url=s.person_key)
    where s.source_snapshot #>> '{email_authority,run_date}' is distinct from p_run_date::text
    order by s.enriched_at asc nulls first,s.person_key
    limit greatest(1,least(coalesce(p_limit,500),500))
  ), updated as (
    update public.powerhouse_connection_enrichment_state_v1 s
    set source_snapshot=jsonb_set(coalesce(s.source_snapshot,'{}'::jsonb),'{email_authority}',
      jsonb_build_object(
        'run_date',p_run_date::text,
        'reviewed_at',now(),
        'state',t.authority_state,
        'email_present',t.email<>'',
        'contact_authority_evidenced',t.extra->>'human_approved'='true',
        'signal_counts',jsonb_build_object(
          'linkedin_30d',t.linkedin_events_30d,
          'external_90d',t.external_signals_90d,
          'company_news_120d',t.company_news_120d),
        'sender_authority','existing_powerhouse_email_and_social_provider_gates',
        'direct_send_performed',false,
        'consent_inferred',false
      ),true),
      updated_at=now()
    from candidates t where s.person_key=t.person_key
    returning t.authority_state
  )
  select count(*), count(*) filter(where authority_state='APPROVED_FURTHER_GATES_REQUIRED'),
      count(*) filter(where authority_state='SUPPRESSED')
  into v_reviewed,v_approved,v_suppressed from updated;
  return jsonb_build_object('contract','powerhouse-contact-authority-review-v1',
    'run_date',p_run_date,'reviewed_batch',v_reviewed,
    'approved_subject_to_existing_gates',v_approved,
    'suppressed_batch',v_suppressed,'external_messages_sent',0,
    'note','Missing approval never implies send eligibility');
end;
$$;
revoke all on function public.powerhouse_contact_authority_review_batch_v1(date,integer)
  from public,anon,authenticated;
