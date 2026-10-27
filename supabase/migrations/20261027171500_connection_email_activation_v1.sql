-- Approved-email connections are activated through the canonical autonomous email transport.
-- Before this, every connection (all have a LinkedIn URL) was routed to linkedin_dm, which has no executor,
-- so the daily actions expired unused. Recipient authority, suppression, cooldown, composer quality gate
-- and provider readback are unchanged; nothing is sent here.
create or replace function public.powerhouse_prepare_connection_email_activation_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date,
  p_cap integer default 5
) returns jsonb
language plpgsql
set search_path to 'public','pg_catalog'
as $$
declare v_now timestamptz:=now(); v_inserted int:=0; v_cap int:=greatest(0,least(coalesce(p_cap,5),5));
begin
  with approved as (
    select b.person_key,b.company_key,b.person_name,b.company_name,b.role,b.linkedin_url,
      b.commercial_state,b.commercial_heat,b.intelligence_confidence,b.predictive_brief,b.trigger_key,b.forecast_key,
      b.trigger_evidence_ref,c.email,
      row_number() over(order by case b.commercial_state when 'HOT_TRIGGER' then 1 when 'PREDICTIVE_TRIGGER' then 2 else 3 end,
        b.commercial_heat desc,b.intelligence_confidence desc,b.person_key) rn
    from public.powerhouse_predictive_commercial_brief_cache_v1 b
    join public.bg_connecties c on (c.sleutel=b.person_key or c.linkedin_url=b.person_key)
    where b.commercial_state in ('HOT_TRIGGER','PREDICTIVE_TRIGGER','WARM_SIGNAL')
      and b.actions_30d<3 and b.channel_ready=1
      and nullif(btrim(coalesce(c.email,'')),'') is not null
      and c.email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$'
      and coalesce(c.extra->>'human_approved','')='true'
      and not exists(select 1 from public.powerhouse_email_contact_suppressions x
        where x.active=true and lower(x.email)=lower(btrim(c.email)))
      and not exists(select 1 from public.powerhouse_sales_outcomes o where o.person_key=b.person_key
        and lower(coalesce(o.outcome_type,'')) in ('unsubscribe','opt_out','do_not_contact','complaint','negative_reply'))
      and not exists(select 1 from public.powerhouse_sales_actions a where a.person_key=b.person_key
        and a.status in ('prepared','waiting') and public.powerhouse_normalize_sales_channel_v1(a.channel) in ('email','linkedin_dm'))
      and not exists(select 1 from public.powerhouse_sales_actions a where a.person_key=b.person_key
        and a.status='done' and a.executed_at>=v_now-interval '30 days'
        and public.powerhouse_normalize_sales_channel_v1(a.channel) in ('email','linkedin_dm'))
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,message_draft,
    source_url,status,due_at,expected_value_eur,person_name,company_name,role)
  select 'connection-email-activation:'||p_run_date::text||':'||md5(a.person_key),'relationship:'||a.person_key,
    a.person_key,a.company_key,'autonomous_email','email',round((100*a.commercial_heat)::numeric,2),
    'Approved-recipient connection activation via the canonical autonomous email transport.',
    jsonb_build_object('contract','powerhouse-connection-email-activation-v1','commercial_state',a.commercial_state,
      'commercial_heat',a.commercial_heat,'intelligence_confidence',a.intelligence_confidence,
      'predictive_brief',a.predictive_brief,'trigger_key',a.trigger_key,'forecast_key',a.forecast_key,
      'source_ref',coalesce(a.trigger_evidence_ref,a.trigger_key,a.forecast_key),
      'recipient_email',lower(btrim(a.email)),
      'email_subject',coalesce(nullif(a.company_name,''),'Bedrijfsgeheugen')||': een concrete observatie',
      'human_approved',true,
      'authorization','recipient_segment_approved_by_arthur_2026-10-27',
      'message_requirements',jsonb_build_object('lead_with_specific_insight',true,'observed_fact_required',true,
        'prediction_must_be_labeled',true,'generic_pitch_forbidden',true),
      'guardrails',jsonb_build_object('canonical_email_executor',true,'suppression_required',true,'cooldown_required',true,
        'provider_ack_required',true,'duplicate_send_forbidden',true,'max_daily_sends',v_cap)),
    '',coalesce(a.linkedin_url,''),'prepared',v_now,0,a.person_name,a.company_name,a.role
  from approved a where a.rn<=v_cap
  on conflict(dedupe_key) do nothing;
  get diagnostics v_inserted=row_count;
  return jsonb_build_object('contract','powerhouse-connection-email-activation-v1','run_date',p_run_date,
    'prepared',v_inserted,'cap',v_cap,'external_send_executed',false,'executed_at',v_now);
end $$;
revoke all on function public.powerhouse_prepare_connection_email_activation_v1(date,integer) from public,anon,authenticated;

-- The existing daily activation job calls it, so there is no new scheduler.
create or replace function public.powerhouse_prepare_connection_activation_v1(p_run_date date default (now() at time zone 'Europe/Amsterdam')::date)
returns jsonb
language plpgsql
set search_path to 'public','pg_catalog'
as $$
declare v_now timestamptz:=now(); v_inserted int:=0; v_email jsonb;
begin
 v_email:=public.powerhouse_prepare_connection_email_activation_v1(p_run_date,5);
 with candidates as (
  select b.*,row_number() over(order by b.commercial_heat desc,b.intelligence_confidence desc,b.person_key) rn
  from public.powerhouse_predictive_commercial_brief_cache_v1 b
  where b.commercial_state in ('HOT_TRIGGER','PREDICTIVE_TRIGGER') and b.actions_30d<3 and b.channel_ready=1
   and (coalesce(b.linkedin_url,'')<>'' or coalesce(b.email,'')<>'')
   and not exists(select 1 from public.powerhouse_sales_outcomes o where o.person_key=b.person_key
    and lower(coalesce(o.outcome_type,'')) in ('unsubscribe','opt_out','do_not_contact','complaint','negative_reply'))
   and not exists(select 1 from public.powerhouse_sales_actions a where a.person_key=b.person_key
    and a.status in ('prepared','waiting') and public.powerhouse_normalize_sales_channel_v1(a.channel) in ('email','linkedin_dm'))
   and not exists(select 1 from public.powerhouse_sales_actions a where a.person_key=b.person_key
    and a.status='done' and a.executed_at>=v_now-interval '30 days'
    and public.powerhouse_normalize_sales_channel_v1(a.channel) in ('email','linkedin_dm'))
 )
 insert into public.powerhouse_sales_actions(
  dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,message_draft,
  source_url,status,due_at,expected_value_eur,person_name,company_name,role)
 select 'predictive-activation:'||p_run_date::text||':'||md5(c.person_key),'relationship:'||c.person_key,c.person_key,c.company_key,
  'activate_connection',case when coalesce(c.linkedin_url,'')<>'' then 'linkedin_dm' else 'email' end,
  round((100*c.commercial_heat)::numeric,2),'Predictive-first activation; generic outreach forbidden.',
  jsonb_build_object('contract','powerhouse-predictive-commercial-activation-v2','commercial_state',c.commercial_state,
   'commercial_heat',c.commercial_heat,'intelligence_confidence',c.intelligence_confidence,
   'predictive_brief',c.predictive_brief,'trigger_key',c.trigger_key,'forecast_key',c.forecast_key,
   'source_ref',coalesce(c.trigger_evidence_ref,c.trigger_key,c.forecast_key),
   'message_requirements',jsonb_build_object('lead_with_specific_insight',true,'observed_fact_required',true,
    'prediction_required',true,'business_consequence_required',true,'generic_pitch_forbidden',true,
    'prediction_must_be_labeled',true,'human_approval_before_external_send',true)),
  '',coalesce(c.linkedin_url,''),'suggested',v_now,0,c.person_name,c.company_name,c.role
 from candidates c where c.rn<=10 on conflict(dedupe_key) do nothing;
 get diagnostics v_inserted=row_count;
 return jsonb_build_object('contract','powerhouse-predictive-commercial-activation-v2','run_date',p_run_date,
 'prepared',v_inserted,'candidate_cap',10,'predictive_first',true,'email_activation',v_email,
 'external_send_executed',false,'executed_at',v_now);
end $$;
