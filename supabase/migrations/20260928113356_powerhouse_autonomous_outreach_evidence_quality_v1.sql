-- Powerhouse autonomous relationship outreach v1
-- User-authorized bounded outbound for existing relationships with fresh evidence-backed triggers.

create or replace function public.powerhouse_prepare_autonomous_outreach_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz:=now();
  v_inserted integer:=0;
begin
  with daily_sent as (
    select count(*)::int n
    from public.powerhouse_sales_actions
    where action_type='autonomous_email'
      and status='done'
      and executed_at >= date_trunc('day',now() at time zone 'Europe/Amsterdam') at time zone 'Europe/Amsterdam'
  ), candidates as (
    select
      r.person_key,r.person_name,r.company_key,r.company_name,r.role,r.email,
      r.relationship_revenue_score,r.relationship_status,
      t.trigger_key,t.trigger_type,t.confidence,t.observed_at,t.trigger_evidence_ref,
      row_number() over(partition by r.person_key order by t.confidence desc,t.observed_at desc) person_rn
    from public.powerhouse_relationship_revenue_intelligence_v1 r
    join public.powerhouse_mkb_trigger_intelligence_v1 t on t.company_key=r.company_key
    where r.relationship_revenue_score>=.55
      and r.actions_30d<2
      and r.relationship_status in ('in_gesprek','aangeboden','rust')
      and nullif(trim(r.email),'') is not null
      and r.email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$'
      and t.do_not_contact_reason is null
      and t.observed_at>=v_now-interval '30 days'
      and t.confidence>=.60
      and lower(concat_ws(' ',t.evidence#>>'{raw_evidence,evidence,headline}',t.evidence#>>'{raw_evidence,evidence,source_url}')) like '%'||lower(trim(r.company_name))||'%'
      and not exists (
        select 1 from public.powerhouse_sales_outcomes o
        where o.person_key=r.person_key
          and lower(coalesce(o.outcome_type,'')) in ('unsubscribe','opt_out','do_not_contact','complaint','negative_reply')
      )
      and not exists (
        select 1 from public.powerhouse_sales_actions a
        where a.person_key=r.person_key
          and a.channel='email'
          and a.status='done'
          and a.executed_at>=v_now-interval '30 days'
      )
  ), ranked as (
    select c.*,row_number() over(order by c.relationship_revenue_score desc,c.confidence desc,c.observed_at desc,c.person_key) rn
    from candidates c
    where c.person_rn=1
  ), budget as (
    select greatest(0,5-(select n from daily_sent))::int slots
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,
    message_draft,source_url,status,due_at,expected_value_eur,person_name,company_name,role
  )
  select
    'relationship-auto-email:'||md5(r.person_key)||':'||md5(r.trigger_key),
    'relationship:'||r.person_key,r.person_key,r.company_key,
    'autonomous_email','email',
    round((100*(.65*r.relationship_revenue_score+.35*r.confidence))::numeric,2),
    'Existing relationship plus fresh evidence-backed company trigger; user-authorized bounded autonomous follow-up.',
    jsonb_build_object(
      'contract','powerhouse-autonomous-relationship-outreach-v1',
      'recipient_email',r.email,
      'email_subject',coalesce(nullif(r.company_name,''),'Even bijpraten')||' — even sparren over '||case r.trigger_type when 'erp_afas_change' then 'ERP/AFAS' when 'regulation' then 'wet- en regelgeving' when 'ai_data_digitalisation' then 'AI, data en digitalisering' when 'growth' then 'groei en schaalbaarheid' when 'new_management' then 'verandering in management' when 'post_merger_integration' then 'integratie na overname' when 'buy_sell_ma' then 'overname of fusie' when 'margin_cost_cashflow_pressure' then 'marge, kosten en cashflow' when 'talent_shortage_key_person_risk' then 'personeel en sleutelafhankelijkheid' when 'financing' then 'financiering en groei' when 'turnaround' then 'reorganisatie en verandering' when 'investor_pe' then 'investering en participatie' else 'een actuele ontwikkeling' end||'?',
      'trigger_key',r.trigger_key,
      'trigger_type',r.trigger_type,
      'trigger_confidence',r.confidence,
      'trigger_observed_at',r.observed_at,
      'trigger_evidence_ref',r.trigger_evidence_ref,
      'relationship_status',r.relationship_status,
      'relationship_revenue_score',r.relationship_revenue_score,
      'authorization','user_authorized_autonomous_outbound_2026-09-28',
      'guardrails',jsonb_build_object(
        'existing_relationship_only',true,
        'fresh_evidence_required',true,
        'max_daily_sends',5,
        'per_person_cooldown_days',30,
        'respect_opt_out',true,
        'linkedin_dm_not_fabricated',true
      )
    ),
    'Hoi '||coalesce(nullif(split_part(trim(r.person_name),' ',1),''),'daar')||','||chr(10)||chr(10)
      ||'Ik zag dat er bij '||coalesce(nullif(r.company_name,''),'jullie organisatie')||' beweging is rond '
      ||case r.trigger_type when 'erp_afas_change' then 'ERP/AFAS en de informatiehuishouding' when 'regulation' then 'nieuwe wet- en regelgeving' when 'ai_data_digitalisation' then 'AI, data en digitalisering' when 'growth' then 'groei en schaalbaarheid' when 'new_management' then 'verandering in management' when 'post_merger_integration' then 'integratie na overname' when 'buy_sell_ma' then 'overname of fusie' when 'margin_cost_cashflow_pressure' then 'marge, kosten en cashflow' when 'talent_shortage_key_person_risk' then 'personeel en sleutelafhankelijkheid' when 'financing' then 'financiering en groei' when 'turnaround' then 'reorganisatie en verandering' when 'investor_pe' then 'investering en participatie' else 'een actuele ontwikkeling' end||'. We kennen elkaar al, daarom stuur ik je rechtstreeks even een bericht.'||chr(10)||chr(10)
      ||'Met Bedrijfsgeheugen help ik organisaties om bedrijfskennis, processen, data en AI praktisch beter te benutten. '
      ||'Als dit onderwerp nu speelt, kijk ik graag 15 minuten mee waar de grootste hefboom zit.'||chr(10)||chr(10)
      ||'Zal ik je twee concrete observaties sturen, of zullen we kort bellen?'||chr(10)||chr(10)
      ||'Groet,'||chr(10)||'Arthur'||chr(10)||'Bedrijfsgeheugen.nl'||chr(10)||chr(10)
      ||'PS Als dit nu niet relevant is, laat het gerust weten; dan stuur ik je hierover niet opnieuw.',
    coalesce(r.trigger_evidence_ref,''),'prepared',v_now,0,r.person_name,r.company_name,r.role
  from ranked r cross join budget b
  where r.rn<=b.slots
  on conflict(dedupe_key) do nothing;

  get diagnostics v_inserted=row_count;

  return jsonb_build_object(
    'contract','powerhouse-autonomous-relationship-outreach-v1',
    'prepared',v_inserted,
    'daily_cap',5,
    'cooldown_days',30,
    'channel','email',
    'user_authorized',true,
    'run_date',p_run_date,
    'executed_at',v_now
  );
end;
$$;

revoke execute on function public.powerhouse_prepare_autonomous_outreach_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_prepare_autonomous_outreach_v1(date) to service_role;

create or replace function public.powerhouse_dispatch_autonomous_outreach_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_token text;
  v_request_id bigint;
begin
  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name='powerhouse_daily_scheduler_token'
  order by created_at desc
  limit 1;

  if nullif(v_token,'') is null then
    return jsonb_build_object('contract','powerhouse-autonomous-outreach-dispatch-v1','dispatched',false,'reason','scheduler_token_missing');
  end if;

  select net.http_post(
    url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-autonomous-outreach',
    headers := jsonb_build_object('content-type','application/json','x-powerhouse-token',v_token),
    body := jsonb_build_object('run_date',p_run_date),
    timeout_milliseconds := 120000
  ) into v_request_id;

  return jsonb_build_object(
    'contract','powerhouse-autonomous-outreach-dispatch-v1',
    'dispatched',true,'request_id',v_request_id,'run_date',p_run_date
  );
end;
$$;

revoke execute on function public.powerhouse_dispatch_autonomous_outreach_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_dispatch_autonomous_outreach_v1(date) to service_role;

create or replace function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_relationship jsonb;
  v_existing_research jsonb;
  v_public_research_dispatch jsonb;
  v_trigger jsonb;
  v_outreach_prepare jsonb;
  v_outreach_dispatch jsonb;
  v_learning jsonb;
begin
  v_relationship:=public.powerhouse_refresh_relationship_revenue_v1(p_run_date);
  v_existing_research:=public.powerhouse_execute_relationship_research_v1(p_run_date);
  v_public_research_dispatch:=public.powerhouse_dispatch_relationship_public_research_v1(p_run_date);
  v_trigger:=public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(p_run_date);
  v_outreach_prepare:=public.powerhouse_prepare_autonomous_outreach_v1(p_run_date);
  v_outreach_dispatch:=public.powerhouse_dispatch_autonomous_outreach_v1(p_run_date);
  v_learning:=public.powerhouse_commercial_learning_cycle_v1(p_run_date);

  return jsonb_build_object(
    'contract','powerhouse-trigger-based-mkb-acquisition-cycle-v1',
    'relationship_revenue',v_relationship,
    'existing_evidence_research',v_existing_research,
    'public_research_dispatch',v_public_research_dispatch,
    'trigger_acquisition',v_trigger,
    'autonomous_outreach_prepare',v_outreach_prepare,
    'autonomous_outreach_dispatch',v_outreach_dispatch,
    'commercial_learning',v_learning,
    'run_date',p_run_date,
    'executed_at',now()
  );
end;
$$;

revoke execute on function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date) to service_role;
