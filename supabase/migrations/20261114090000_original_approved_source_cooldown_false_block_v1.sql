-- Original research priming cooldown corrected from production evidence, 14 Nov 2026.
-- All 123 previously approved contacts had some generic internal "research_enrichment"
-- within 30 days, many 14-30 days ago. The previous 30d predicate rejected all 123
-- and thus caused zero new source-only research. 10 contacts have activity in 7d;
-- the 7-day freshness guard preserves bounded source costs and excludes active research.
-- NO new send, consent, queue, scheduler or original research-composer ownership.
-- Replaces ONLY existing original approved-source priming helper.
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
      row_number() over(partition by lower(btrim(c.bedrijf))
        order by md5(p_run_date::text||':'||c.sleutel)) as company_rank
    from public.bg_connecties c
    where nullif(btrim(coalesce(c.sleutel,'')),'') is not null
      and nullif(btrim(coalesce(c.bedrijf,'')),'') is not null
      and nullif(btrim(coalesce(c.email,'')),'') is not null
      and c.email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$'
      and coalesce(c.extra->>'human_approved','') = 'true'
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
      and not exists (
        select 1 from public.powerhouse_sales_actions a
        where a.person_key=c.sleutel
          and a.action_type='research_enrichment'
          and a.created_at>=v_now-interval '7 days'
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
      'research_need','source_specific_evidence',
      'research_channel','internal',
      'approval_is_not_provider_authority',true,
      'delivery_not_attempted',true,
      'external_side_effect_allowed',false,
      'recipient_authority_not_inferred',true,
      'source_evidence_required_before_composer',true,
      'daily_source_query_cap',v_daily_cap),
    '','suggested',v_now,0,c.person_name,c.company_name,c.role
  from candidates c
  where c.company_rank=1
  order by md5(p_run_date::text||':'||c.person_key)
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

revoke all on function public.powerhouse_prime_approved_connection_research_v1(date)
  from public,anon,authenticated;
grant execute on function public.powerhouse_prime_approved_connection_research_v1(date)
  to service_role;
