-- 2026-11-14 P0 #4198. Existing original #116 source-priming function only.
-- Two B2B warm no-email public research records + three existing approved source records
-- SHARED hard cap five/day; no extra scheduler, research queue, external sender or vendor.
-- Research-only is not a permission to send; downstream source must stay non-sendable.
CREATE OR REPLACE FUNCTION public.powerhouse_prime_approved_connection_research_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_now timestamptz := now();
  v_daily_cap integer := 5;
  v_already integer := 0;
  v_created integer := 0;
begin
  if p_run_date is distinct from (v_now at time zone 'Europe/Amsterdam')::date then
    return jsonb_build_object('ok',true,'created',0,'reason','non_current_business_day','external_send_executed',false);
  end if;

  if not pg_try_advisory_xact_lock(hashtextextended(
    'powerhouse-approved-source-prime:'||p_run_date::text,0)) then
    return jsonb_build_object('ok',true,'created',0,'reason','canonical_stage_busy','external_send_executed',false);
  end if;

  select count(*) into v_already
  from public.powerhouse_sales_actions a
  where a.dedupe_key like 'relationship-research:approved-source:'||p_run_date::text||':%';

  if v_already >= v_daily_cap then
    return jsonb_build_object('ok',true,'created',0,'daily_cap',v_daily_cap,
      'reason','daily_source_budget_exhausted','external_send_executed',false);
  end if;

  with candidates as (
    select
      c.sleutel as person_key,
      lower(btrim(c.bedrijf)) as company_key,
      btrim(c.bedrijf) as company_name,
      c.naam as person_name,
      c.rol as role,
      c.prioriteit as source_priority,
      case when nullif(btrim(coalesce(c.email,'')),'') is null
        then 'PUBLIC_WORK_EMAIL_CANDIDATE'
        else 'APPROVED_SOURCE' end as research_mode,
      row_number() over(partition by lower(btrim(c.bedrijf))
        order by md5(p_run_date::text||':'||c.sleutel)) as company_rank
    from public.bg_connecties c
    where nullif(btrim(coalesce(c.sleutel,'')),'') is not null
      and nullif(btrim(coalesce(c.bedrijf,'')),'') is not null
      -- Research-only public business evidence is distinct from send consent.
      -- Allocate 2 of the ORIGINAL 5/day research slots to warm no-email contacts.
      and (
        (nullif(btrim(coalesce(c.email,'')),'') is not null
          and c.email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$'
          and coalesce(c.extra->>'human_approved','') = 'true')
        or
        (nullif(btrim(coalesce(c.email,'')),'') is null
          and c.status in ('in_gesprek','aangeboden','rust')
          and c.prioriteit >= 75
          and nullif(btrim(coalesce(c.linkedin_url,'')),'') is not null
          and nullif(btrim(coalesce(c.naam,'')),'') is not null
          and nullif(btrim(coalesce(c.rol,'')),'') is not null
          and not (coalesce(c.extra,'{}'::jsonb) ? 'do_not_contact')
          and not (coalesce(c.extra,'{}'::jsonb) ? 'opt_out')
        )
      )
      and not (coalesce(c.extra,'{}'::jsonb) ? 'approval_revoked')
      and not exists (
        select 1 from public.powerhouse_email_contact_suppressions s
        where s.active=true and lower(s.email)=lower(btrim(c.email))
      )
      and not exists (
        select 1 from public.powerhouse_sales_outcomes o
        where o.person_key=c.sleutel
        and lower(coalesce(o.outcome_type,'')) in
          ('unsubscribe','opt_out','do_not_contact','complaint','negative_reply')
      )
      -- Research cooldown applies only to provider-attempted or dedicated
      -- original research, not empty legacy research_enrichment placeholders.
      -- Match same person OR company to avoid duplicate public-source queries.
      and not exists (
        select 1 from public.powerhouse_sales_actions a
        where a.action_type='research_enrichment'
          and a.created_at>=v_now-interval '30 days'
          and (a.person_key=c.sleutel
            or lower(btrim(coalesce(a.company_key,'')))=lower(btrim(c.bedrijf)))
          and (
            a.dedupe_key like 'relationship-research:approved-source:%'
            or a.dedupe_key like 'relationship-research:outreach-source:%'
            or nullif(a.evidence#>>'{public_research_execution,researched_at}','') is not null
          )
      )
      and not exists (
        select 1 from public.powerhouse_sales_actions a
        where a.person_key=c.sleutel
          and a.status in ('prepared','waiting')
          and public.powerhouse_normalize_sales_channel_v1(a.channel)
            in ('email','linkedin_dm')
      )
      and not exists (
        select 1 from public.powerhouse_sales_actions a
        where a.person_key=c.sleutel
          and a.status='done'
          and a.executed_at >= v_now-interval '90 days'
          and public.powerhouse_normalize_sales_channel_v1(a.channel)
            in ('email','linkedin_dm')
      )
  ), ranked as (
    select c.*,row_number() over(
      partition by c.research_mode
      order by c.source_priority desc nulls last,
               md5(p_run_date::text||':'||c.person_key)
    ) as cohort_rank
    from candidates c
    where c.company_rank=1
  )
  insert into public.powerhouse_sales_actions (
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,
    reason,evidence,message_draft,status,due_at,expected_value_eur,
    person_name,company_name,role
  )
  select
    'relationship-research:approved-source:'||p_run_date::text||':'||md5(c.person_key),
    'relationship:'||c.person_key,c.person_key,c.company_key,
    'research_enrichment','internal',0,
    'Bounded public company research for an already approved relationship; no send authority.',
    jsonb_build_object(
      'contract','powerhouse-approved-connection-source-priming-v1',
      'research_need',case
        when c.research_mode='PUBLIC_WORK_EMAIL_CANDIDATE'
        then 'public_work_email_source'
        else 'source_specific_evidence' end,
      'research_only_no_outbound',c.research_mode='PUBLIC_WORK_EMAIL_CANDIDATE',
      'research_person_key',c.person_key,
      'research_send_authority',false,
      'research_channel','internal',
      'approval_is_not_provider_authority',true,
      'delivery_not_attempted',true,
      'external_side_effect_allowed',false,
      'recipient_authority_not_inferred',true,
      'source_evidence_required_before_composer',true,
      'daily_source_query_cap',v_daily_cap),
    '','suggested',v_now,0,c.person_name,c.company_name,c.role
  from ranked c
  where (c.research_mode='PUBLIC_WORK_EMAIL_CANDIDATE' and c.cohort_rank<=2)
     or (c.research_mode='APPROVED_SOURCE' and c.cohort_rank<=3)
  order by case when c.research_mode='PUBLIC_WORK_EMAIL_CANDIDATE' then 0 else 1 end,
           md5(p_run_date::text||':'||c.person_key)
  limit greatest(0,v_daily_cap-v_already)
  on conflict (dedupe_key) do nothing;

  get diagnostics v_created=row_count;
  return jsonb_build_object('ok',true,'contract',
    'powerhouse-approved-connection-source-priming-v1',
    'run_date',p_run_date,'daily_source_query_cap',v_daily_cap,
    'created',v_created,'existing_today',v_already,
    'external_send_executed',false,'provider_delivery_proven',false);
end;
$function$;

REVOKE ALL ON FUNCTION public.powerhouse_prime_approved_connection_research_v1(date) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_prime_approved_connection_research_v1(date) TO service_role;
