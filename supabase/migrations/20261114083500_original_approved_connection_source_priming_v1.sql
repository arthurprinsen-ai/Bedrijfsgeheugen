
-- 14 November 2026: expand the original source-first research funnel without a second scheduler
-- or any email side effects. Existing hourly commercial stage #116 calls the existing research
-- function; max five newly researched approved business relationships per Amsterdam day.
create or replace function public.powerhouse_prime_approved_connection_research_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $prime$
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
          and a.created_at>=v_now-interval '30 days'
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
$prime$;

revoke all on function public.powerhouse_prime_approved_connection_research_v1(date)
  from public,anon,authenticated;
grant execute on function public.powerhouse_prime_approved_connection_research_v1(date)
  to service_role;

-- Preserve the original approved research/dispatch/consumer evidence path.
-- Only add a bounded source-only feed at the top of its existing stage.

CREATE OR REPLACE FUNCTION public.powerhouse_execute_relationship_research_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_now timestamptz:=now();
  v_executed integer:=0;
  v_events integer:=0;
  v_result jsonb;
begin
  -- Feed the EXISTING research stage with no more than five approved, uncontacted company probes/day.
  -- The helper only creates internal source-research work. It never grants email permission.
  perform public.powerhouse_prime_approved_connection_research_v1(p_run_date);
  with candidates as (
    select a.*
    from public.powerhouse_sales_actions a
    where a.action_type='research_enrichment'
      and a.channel='internal'
      and a.status in ('suggested','prepared','waiting')
      and a.dedupe_key like 'relationship-research:%'
    order by a.priority desc,a.created_at asc
    limit 25
  ), evidence_match as (
    select c.action_id,c.dedupe_key,c.person_key,c.company_key,c.company_name,c.person_name,c.role,
      coalesce(n.url,s.url,p.source_ref) as source_url,
      coalesce(n.titel,s.titel,p.evidence->>'headline',p.evidence->>'title') as headline,
      coalesce(n.haak,s.samenvatting,p.evidence->>'summary',p.evidence->>'signal') as summary,
      greatest(coalesce(n.zekerheid,0),coalesce(s.vertrouwen,0),least(1,0.7*coalesce(p.strength,0)+0.3*coalesce(p.novelty,0))) as evidence_confidence,
      greatest(coalesce(n.gepubliceerd_op,n.opgehaald_op,'epoch'::timestamptz),coalesce(s.gepubliceerd_op,s.opgehaald_op,'epoch'::timestamptz),coalesce(p.observed_at,'epoch'::timestamptz)) as observed_at
    from candidates c
    left join lateral (
      select b.* from public.bg_bedrijfsnieuws b
      where b.over_dit_bedrijf is true and coalesce(b.afgewezen_reden,'')=''
        and b.gepubliceerd_op>=v_now-interval '120 days'
        and (lower(trim(b.bedrijf))=lower(trim(coalesce(c.company_name,c.company_key,'')))
          or lower(trim(b.bedrijf))=lower(trim(coalesce(c.company_key,''))))
      order by b.gepubliceerd_op desc nulls last,b.opgehaald_op desc limit 1
    ) n on true
    left join lateral (
      select x.* from public.bg_externe_signalen x
      where x.toegestaan is true and coalesce(x.ruis_reden,'')=''
        and coalesce(x.gepubliceerd_op,x.opgehaald_op)>=v_now-interval '120 days'
        and nullif(trim(coalesce(c.company_name,c.company_key,'')),'') is not null
        and lower(concat_ws(' ',x.titel,x.samenvatting,x.onderwerp,x.domein))
              like '%'||lower(trim(coalesce(c.company_name,c.company_key,'')))||'%'
      order by coalesce(x.gepubliceerd_op,x.opgehaald_op) desc limit 1
    ) s on n.url is null
    left join lateral (
      select ps.* from public.powerhouse_predictive_signals ps
      where ps.entity_scope='company' and ps.observed_at>=v_now-interval '120 days'
        and lower(trim(ps.entity_key))=lower(trim(coalesce(c.company_key,c.company_name,'')))
      order by ps.observed_at desc limit 1
    ) p on n.url is null and s.url is null
  ), usable as (
    select * from evidence_match
    where nullif(trim(coalesce(source_url,'')),'') is not null
       or nullif(trim(coalesce(headline,'')),'') is not null
       or nullif(trim(coalesce(summary,'')),'') is not null
  )
  update public.powerhouse_sales_actions a
  set status='done',executed_at=v_now,
      evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'public_research_execution',jsonb_build_object(
          'contract','powerhouse-relationship-research-auto-enrichment-v1','source_url',u.source_url,
          'headline',u.headline,'summary',u.summary,'confidence',u.evidence_confidence,
          'observed_at',u.observed_at,'executed_at',v_now,'vendor_used',false,'evidence_only',true)),
      source_url=coalesce(nullif(u.source_url,''),a.source_url),updated_at=v_now
  from usable u where a.action_id=u.action_id;
  get diagnostics v_executed=row_count;

  with executed as (
    select a.* from public.powerhouse_sales_actions a
    where a.action_type='research_enrichment' and a.dedupe_key like 'relationship-research:%' and a.executed_at=v_now
  )
  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,person_key,company_key,occurred_at,evidence,context,state,data_quality,confidence
  )
  select 'relationship-research-evidence:'||a.action_id::text,'relationship_public_research_evidence',
    'powerhouse-relationship-research-auto-enrichment-v1',a.subject_key,a.person_key,a.company_key,v_now,
    jsonb_build_object('action_id',a.action_id,'headline',a.evidence#>>'{public_research_execution,headline}',
      'summary',a.evidence#>>'{public_research_execution,summary}','source_url',a.evidence#>>'{public_research_execution,source_url}',
      'trigger',a.evidence#>>'{public_research_execution,headline}','evidence_only',true,'vendor_used',false),
    jsonb_build_object('person_name',a.person_name,'company_name',a.company_name,'role',a.role,
      'research_contract','powerhouse-relationship-research-auto-enrichment-v1','external_side_effects',false),
    'observed','VERIFIED',least(1,greatest(0,coalesce((a.evidence#>>'{public_research_execution,confidence}')::numeric,0.5)))
  from executed a
  on conflict(dedupe_key) do update set occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
    state=excluded.state,data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=v_now;
  get diagnostics v_events=row_count;

  v_result:=jsonb_build_object('contract','powerhouse-relationship-research-auto-enrichment-v1','run_date',p_run_date,
    'executed_at',v_now,'research_actions_executed',v_executed,'runtime_evidence_events_touched',v_events,
    'vendor_used',false,'external_outreach_executed',false);
  return v_result;
end;
$function$;

