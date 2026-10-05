-- Canonical sync of the production Powerhouse one-commercial closed loop.
-- Existing-state-first: reuses current event/identity/NBA/action/provider/outcome stores.
-- Generated from production readback on 2026-10-05.

CREATE OR REPLACE FUNCTION public.powerhouse_commercial_intelligence_heartbeat_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_now timestamptz:=now(); v_snapshot_at timestamptz; v_rows int:=0; v_age interval;
begin
  select max(refreshed_at),count(*)::int into v_snapshot_at,v_rows
  from public.powerhouse_revenue_command_center_snapshot_v1;
  v_age := case when v_snapshot_at is null then null else v_now-v_snapshot_at end;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values(
    'commercial-intelligence-heartbeat:'||p_run_date,
    'commercial_intelligence_heartbeat',
    'powerhouse-commercial-intelligence-heartbeat-v5',
    'company-person-commercial',
    v_now,
    jsonb_build_object(
      'source_nba','powerhouse_commercial_next_best_action_v5',
      'runtime_read_model','powerhouse_revenue_command_center_snapshot_v1',
      'snapshot_refreshed_at',v_snapshot_at,
      'snapshot_rows',v_rows,
      'snapshot_age_seconds',case when v_age is null then null else extract(epoch from v_age)::bigint end
    ),
    jsonb_build_object(
      'critical_path_mode','read_only_snapshot',
      'heavy_intelligence_refresh_inline',false,
      'reason','prevent lock contention/deadlocks with asynchronous research/composer/provider writebacks',
      'existing_refresh_owners_preserved',true,
      'single_action_materializer',true
    ),
    case when v_snapshot_at is not null and v_snapshot_at>=v_now-interval '6 hours' and v_rows>0 then 'actioned' else 'degraded' end,
    case when v_snapshot_at is not null and v_rows>0 then 'VERIFIED' else 'INCOMPLETE' end,
    case when v_snapshot_at is not null and v_snapshot_at>=v_now-interval '6 hours' and v_rows>0 then 1 else .4 end
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
    state=excluded.state,data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=now();

  return jsonb_build_object(
    'contract','powerhouse-commercial-intelligence-heartbeat-v5',
    'healthy',v_snapshot_at is not null and v_snapshot_at>=v_now-interval '6 hours' and v_rows>0,
    'source_nba','v5',
    'runtime_read_model','powerhouse_revenue_command_center_snapshot_v1',
    'snapshot_refreshed_at',v_snapshot_at,
    'snapshot_rows',v_rows,
    'snapshot_age_seconds',case when v_age is null then null else extract(epoch from v_age)::bigint end,
    'critical_path','read-only',
    'heavy_refresh_inline',false,
    'executed_at',v_now
  );
end $function$;

CREATE OR REPLACE FUNCTION public.powerhouse_dispatch_relationship_public_research_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare v_token text; v_request_id bigint; v_pending int;
begin
  select count(*)::int into v_pending
  from public.powerhouse_sales_actions
  where action_type='research_enrichment' and channel='internal'
    and status in ('suggested','prepared','waiting')
    and dedupe_key like 'relationship-research:%';

  if v_pending=0 then
    return jsonb_build_object('contract','powerhouse-relationship-public-research-dispatch-v1',
      'dispatched',false,'reason','NO_PENDING_RESEARCH');
  end if;

  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name='powerhouse_daily_scheduler_token'
  order by created_at desc limit 1;

  if nullif(v_token,'') is null then
    return jsonb_build_object('contract','powerhouse-relationship-public-research-dispatch-v1',
      'dispatched',false,'reason','SCHEDULER_TOKEN_MISSING','pending',v_pending);
  end if;

  select net.http_post(
    url:='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-relationship-public-research',
    headers:=jsonb_build_object('content-type','application/json','x-powerhouse-token',v_token),
    body:=jsonb_build_object('run_date',p_run_date),
    timeout_milliseconds:=120000
  ) into v_request_id;

  return jsonb_build_object('contract','powerhouse-relationship-public-research-dispatch-v1',
    'dispatched',true,'pending',v_pending,'request_id',v_request_id,'run_date',p_run_date);
end $function$;

CREATE OR REPLACE FUNCTION public.powerhouse_materialize_command_center_actions_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare v_now timestamptz:=now(); v_touched int:=0; v_research int:=0; v_social int:=0; v_email int:=0; v_dm int:=0;
begin
  with base as (
    select s.*,
      coalesce(
        nullif(s.command_evidence->>'source_url',''),
        nullif(s.command_evidence#>>'{evidence,source_url}',''),
        nullif(s.command_evidence#>>'{public_source_evidence,evidence,source_url}','')
      ) source_url,
      coalesce(
        nullif(s.command_evidence->>'headline',''),
        nullif(s.command_evidence#>>'{evidence,headline}',''),
        nullif(s.command_evidence#>>'{public_source_evidence,evidence,headline}','')
      ) headline,
      coalesce(
        nullif(s.command_evidence->>'summary',''),
        nullif(s.command_evidence#>>'{evidence,summary}',''),
        nullif(s.command_evidence#>>'{public_source_evidence,evidence,summary}','')
      ) summary
    from public.powerhouse_revenue_command_center_snapshot_v1 s
    where s.revenue_rank<=20
      and s.buying_window_score>=.30 and s.buying_window_confidence>=.25
      and coalesce(s.pressure_state,'ready') not in ('cooldown','wait','suppressed','do_not_contact')
      and (s.cooldown_until is null or s.cooldown_until<=v_now)
      and coalesce(s.identity_conflict,false)=false
      and coalesce(s.structural_lineage_gap,false)=false
  ), enriched as (
    select b.*,c.email,c.linkedin_url,c.extra contact_extra,
      (b.source_url ~* '^https?://') and nullif(trim(coalesce(b.headline,b.summary,'')),'') is not null social_source_ready,
      (c.email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$') email_ready,
      (
        coalesce(c.extra->>'salesrobot_prospect_uuid','')<>'' or coalesce(c.extra->>'prospect_uuid','')<>'' or
        coalesce(c.extra->>'salesrobot_thread_id','')<>'' or coalesce(c.extra->>'thread_id','')<>'' or
        coalesce(c.extra->>'salesrobot_unipile_chat_id','')<>'' or coalesce(c.extra->>'unipile_chat_id','')<>'' or
        coalesce(c.extra->>'salesrobot_sales_nav_chat_id','')<>'' or coalesce(c.extra->>'unipile_sales_nav_chat_id','')<>''
      ) dm_ready
    from base b
    left join lateral (
      select x.email,x.linkedin_url,x.extra
      from public.bg_connecties x
      where x.sleutel=b.person_key or x.linkedin_url=b.person_key
      order by (x.sleutel=b.person_key) desc,x.bijgewerkt_op desc nulls last
      limit 1
    ) c on true
  ), routed as (
    select e.*,
      case
        when e.recommended_channel='email' and e.email_ready then 'autonomous_email'
        when e.recommended_channel='linkedin_dm' and e.dm_ready then 'activate_connection'
        when e.recommended_channel='linkedin_comment' and e.social_source_ready then 'reply_post'
        else 'research_enrichment'
      end action_type_final,
      case
        when e.recommended_channel='email' and e.email_ready then 'email'
        when e.recommended_channel='linkedin_dm' and e.dm_ready then 'linkedin_dm'
        when e.recommended_channel='linkedin_comment' and e.social_source_ready then 'linkedin_personal'
        else 'internal'
      end channel_final
    from enriched e
  ), up as (
    insert into public.powerhouse_sales_actions(
      dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,message_draft,
      source_url,status,due_at,opportunity_key,expected_value_eur,person_name,company_name,role
    )
    select
      case
        when r.action_type_final='research_enrichment' then 'relationship-research:'||p_run_date::text||':'||r.opportunity_key
        when r.action_type_final='reply_post' then 'command-social:'||p_run_date::text||':'||r.opportunity_key
        when r.action_type_final='autonomous_email' then 'command-email:'||p_run_date::text||':'||r.opportunity_key
        else 'command-dm:'||p_run_date::text||':'||r.opportunity_key
      end,
      coalesce(r.person_key,r.company_key,r.opportunity_key),r.person_key,r.company_key,
      r.action_type_final,r.channel_final,
      round(least(100,greatest(0,100*coalesce(r.action_confidence,r.buying_window_score)))::numeric,2),
      case
        when r.action_type_final='research_enrichment' then 'NBA requires verified human-readable source context before external outreach.'
        else 'Executable action materialized from canonical revenue command-center decision.'
      end,
      coalesce(r.command_evidence,'{}'::jsonb) ||
      jsonb_build_object(
        'source_ref',case when r.source_url is not null then r.source_url else null end,
        'headline',r.headline,'summary',r.summary,
        'recipient_email',case when r.action_type_final='autonomous_email' then r.email else null end,
        'salesrobot_prospect_uuid',coalesce(r.contact_extra->>'salesrobot_prospect_uuid',r.contact_extra->>'prospect_uuid'),
        'salesrobot_thread_id',coalesce(r.contact_extra->>'salesrobot_thread_id',r.contact_extra->>'thread_id'),
        'salesrobot_unipile_chat_id',coalesce(r.contact_extra->>'salesrobot_unipile_chat_id',r.contact_extra->>'unipile_chat_id'),
        'salesrobot_sales_nav_chat_id',coalesce(r.contact_extra->>'salesrobot_sales_nav_chat_id',r.contact_extra->>'unipile_sales_nav_chat_id'),
        'human_approved',lower(coalesce(r.contact_extra->>'human_approved','false'))='true',
        'commercial_intelligence',jsonb_build_object(
          'contract','powerhouse-command-center-action-materializer-v1',
          'source_nba','powerhouse_commercial_next_best_action_v5',
          'runtime_read_model','powerhouse_revenue_command_center_snapshot_v1',
          'snapshot_refreshed_at',r.refreshed_at,
          'why_now',r.why_now,'account_thesis',r.account_thesis,'recommended_account_move',r.recommended_account_move,
          'recommended_action',r.recommended_action,'message_strategy',r.message_strategy,
          'recommended_asset',r.effective_recommended_asset,'verified_asset_reference',r.verified_asset_reference,
          'recommended_cta',r.recommended_cta,'pressure_state',r.pressure_state,'cooldown_until',r.cooldown_until,
          'prediction_reply',r.prediction_reply,'prediction_meeting',r.prediction_meeting,
          'prediction_proposal',r.prediction_proposal,'prediction_win',r.prediction_win,
          'prediction_model_version',r.prediction_model_version,'prediction_confidence',r.prediction_confidence,
          'route_decision',r.action_type_final,'source_context_ready',r.social_source_ready,
          'policy','One canonical candidate decision; research before outreach whenever human-readable evidence is insufficient.'
        )
      ),
      '',coalesce(r.source_url,''),
      case when r.action_type_final='research_enrichment' then 'suggested' else 'prepared' end,
      v_now,r.opportunity_key,r.expected_commercial_value_eur,r.person_name,r.company_key,r.role
    from routed r
    on conflict(dedupe_key) do update set
      action_type=excluded.action_type,channel=excluded.channel,priority=excluded.priority,reason=excluded.reason,
      evidence=excluded.evidence,source_url=excluded.source_url,expected_value_eur=excluded.expected_value_eur,
      person_name=coalesce(excluded.person_name,powerhouse_sales_actions.person_name),
      company_name=coalesce(excluded.company_name,powerhouse_sales_actions.company_name),
      role=coalesce(excluded.role,powerhouse_sales_actions.role),updated_at=v_now
    where powerhouse_sales_actions.status in ('suggested','prepared','waiting')
    returning action_type,channel
  )
  select count(*),
    count(*) filter(where action_type='research_enrichment'),
    count(*) filter(where action_type='reply_post'),
    count(*) filter(where action_type='autonomous_email'),
    count(*) filter(where channel='linkedin_dm')
  into v_touched,v_research,v_social,v_email,v_dm from up;

  return jsonb_build_object('contract','powerhouse-command-center-action-materializer-v1','run_date',p_run_date,
    'actions_touched',v_touched,'research_actions',v_research,'linkedin_comments',v_social,
    'email_actions',v_email,'linkedin_dm_actions',v_dm,'executed_at',v_now);
end $function$;

CREATE OR REPLACE FUNCTION public.powerhouse_one_commercial_closed_loop_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
 v_spine jsonb; v_intel jsonb; v_materialize jsonb; v_promote jsonb; v_plans jsonb; v_compose jsonb;
 v_research_dispatch jsonb; v_email_dispatch jsonb; v_li_dispatch jsonb;
 v_no_response jsonb; v_learning jsonb; v_attribution jsonb; v_closure jsonb; v_health jsonb;
 v_email_ready int:=0; v_dm_ready int:=0; v_comment_ready int:=0; v_result jsonb;
begin
 v_spine:=public.powerhouse_revenue_event_spine_cycle_v1(p_run_date);
 v_intel:=public.powerhouse_commercial_intelligence_heartbeat_v1(p_run_date);
 v_materialize:=public.powerhouse_materialize_command_center_actions_v1(p_run_date);
 v_promote:=public.powerhouse_promote_research_to_social_v1();

 v_plans:=public.powerhouse_refresh_message_plans_v1(200);
 v_compose:=public.powerhouse_dispatch_human_sales_composer_v2(20);

 select count(*)::int into v_email_ready
 from public.powerhouse_sales_actions a
 where a.action_type='autonomous_email' and a.channel='email' and a.status='prepared'
   and a.dedupe_key like 'command-email:'||p_run_date::text||':%'
   and public.powerhouse_outbound_message_quality_ready_v1(a.action_id);

 select count(*)::int into v_dm_ready
 from public.powerhouse_sales_actions a
 where a.channel='linkedin_dm' and a.status in ('prepared','suggested')
   and a.dedupe_key like 'command-dm:'||p_run_date::text||':%'
   and public.powerhouse_outbound_message_quality_ready_v1(a.action_id);

 select count(*)::int into v_comment_ready
 from public.powerhouse_sales_actions a
 where a.action_type='reply_post' and a.channel='linkedin_personal' and a.status='prepared'
   and (a.dedupe_key like 'command-social:'||p_run_date::text||':%' or a.dedupe_key like 'research-social:%')
   and nullif(trim(coalesce(a.source_url,'')),'') is not null;

 v_research_dispatch:=public.powerhouse_dispatch_relationship_public_research_v1(p_run_date);

 if v_email_ready>0 then
   v_email_dispatch:=public.powerhouse_dispatch_autonomous_outreach_v1(p_run_date);
 else
   v_email_dispatch:=jsonb_build_object('dispatched',false,'reason','NO_QUALITY_READY_EMAIL_ACTIONS');
 end if;

 if v_dm_ready>0 or v_comment_ready>0 then
   v_li_dispatch:=public.powerhouse_dispatch_linkedin_sales_machine_v1(p_run_date);
 else
   v_li_dispatch:=jsonb_build_object('dispatched',false,'reason','NO_EXECUTABLE_LINKEDIN_ACTIONS');
 end if;

 v_no_response:=public.powerhouse_reconcile_no_response_outcomes_v1(now());
 v_learning:=public.powerhouse_refresh_outbound_learning_v1();
 v_attribution:=public.powerhouse_refresh_revenue_attribution_snapshot_v1();
 v_closure:=public.powerhouse_commercial_action_closure_watchdog_v1(now());
 select to_jsonb(h) into v_health from public.powerhouse_one_commercial_loop_health_v1 h;

 v_result:=jsonb_build_object(
   'contract','powerhouse-one-commercial-closed-loop-v2','run_date',p_run_date,
   'lineage','event->identity->intent/opportunity->nba-v5-snapshot->pressure/cooldown->single-materializer->research-if-needed->play/psychology->message/quality->provider->outcome->revenue->attribution->learning->next-nba',
   'revenue_spine',v_spine,'commercial_intelligence',v_intel,'action_materialization',v_materialize,
   'research_to_social_promotion',v_promote,'message_plans',v_plans,'composer_dispatch',v_compose,
   'email_quality_ready',v_email_ready,'linkedin_dm_quality_ready',v_dm_ready,'linkedin_comment_ready',v_comment_ready,
   'research_dispatch',v_research_dispatch,'email_provider_dispatch',v_email_dispatch,'linkedin_provider_dispatch',v_li_dispatch,
   'terminal_outcomes',v_no_response,'outbound_learning',v_learning,'attribution',v_attribution,'closure_watchdog',v_closure,
   'health',v_health,'executed_at',now()
 );

 insert into public.powerhouse_runtime_events(
   dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
 ) values(
   'one-commercial-closed-loop:'||p_run_date::text,'one_commercial_closed_loop',
   'powerhouse-one-commercial-closed-loop-v2','growth-revenue-os',now(),v_result,
   jsonb_build_object('existing_state_first',true,'single_candidate_owner',true,'provider_gates_preserved',true,
     'nba_version','v5','runtime_read_model','revenue_command_center_snapshot_v1','heavy_steps_async',true),
   'actioned','VERIFIED',1
 )
 on conflict(dedupe_key) do update set occurred_at=excluded.occurred_at,evidence=excluded.evidence,
   context=excluded.context,state=excluded.state,updated_at=now();

 return v_result;
end $function$;

CREATE OR REPLACE FUNCTION public.powerhouse_prepare_autonomous_outreach_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare v_n int;
begin
  select count(*)::int into v_n from public.powerhouse_sales_actions
  where action_type='autonomous_email' and channel='email' and status='prepared'
    and due_at<=now();
  return jsonb_build_object('contract','powerhouse-autonomous-outreach-canonical-adapter-v1',
    'prepared',v_n,'candidate_owner','powerhouse-command-center-action-materializer-v1',
    'duplicate_candidate_generation',false,'run_date',p_run_date,'executed_at',now());
end $function$;

CREATE OR REPLACE FUNCTION public.powerhouse_prepare_linkedin_sales_machine_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare v_comments int; v_dm int;
begin
  select count(*)::int into v_comments from public.powerhouse_sales_actions
  where action_type='reply_post' and channel='linkedin_personal' and status='prepared';
  select count(*)::int into v_dm from public.powerhouse_sales_actions
  where channel='linkedin_dm' and status in ('prepared','suggested');
  return jsonb_build_object('contract','powerhouse-linkedin-sales-canonical-adapter-v1',
    'comment_candidates',v_comments,'dm_candidates',v_dm,
    'candidate_owner','powerhouse-command-center-action-materializer-v1',
    'duplicate_candidate_generation',false,'run_date',p_run_date,'executed_at',now());
end $function$;

CREATE OR REPLACE FUNCTION public.powerhouse_promote_research_to_social_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare v_n int:=0;
begin
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,message_draft,
    source_url,status,due_at,opportunity_key,expected_value_eur,person_name,company_name,role
  )
  select
    'research-social:'||a.action_id::text,a.subject_key,a.person_key,a.company_key,
    'reply_post','linkedin_personal',a.priority,
    'Verified public research promoted into a value-adding LinkedIn context action.',
    coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
      'headline',a.evidence#>>'{public_research_execution,headline}',
      'summary',a.evidence#>>'{public_research_execution,summary}',
      'source_ref','powerhouse_sales_action:'||a.action_id::text,
      'commercial_intelligence',
        coalesce(a.evidence->'commercial_intelligence','{}'::jsonb)||
        jsonb_build_object('research_promoted',true,'research_action_id',a.action_id,'source_context_ready',true)
    ),
    '',a.source_url,'prepared',now(),a.opportunity_key,a.expected_value_eur,a.person_name,a.company_name,a.role
  from public.powerhouse_sales_actions a
  where a.action_type='research_enrichment' and a.channel='internal' and a.status='done'
    and nullif(trim(coalesce(a.source_url,'')),'') is not null
    and nullif(trim(coalesce(a.evidence#>>'{public_research_execution,headline}',a.evidence#>>'{public_research_execution,summary}','')),'') is not null
  on conflict(dedupe_key) do nothing;
  get diagnostics v_n=row_count;
  return jsonb_build_object('contract','powerhouse-research-to-social-promotion-v1','promoted',v_n,'executed_at',now());
end $function$;

CREATE OR REPLACE FUNCTION public.powerhouse_provider_ack_outcome_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare v_ack boolean:=false;
begin
  if new.status='done' and new.executed_at is not null
     and (old.status is distinct from new.status or old.executed_at is distinct from new.executed_at) then
    v_ack :=
      coalesce((new.evidence#>>'{autonomous_outbound,provider_ack_verified}')::boolean,false)
      or coalesce((new.evidence#>>'{salesrobot_execution,provider_ack_verified}')::boolean,false)
      or coalesce((new.evidence->>'provider_ack_verified')::boolean,false);

    if v_ack and not exists(select 1 from public.powerhouse_sales_outcomes o where o.action_id=new.action_id) then
      insert into public.powerhouse_sales_outcomes(
        action_id,dedupe_key,outcome_type,subject_key,person_key,company_key,revenue_eur,evidence,occurred_at,
        content_key,topic_key,campaign_key,opportunity_key,channel
      ) values(
        new.action_id,'provider-ack:'||new.action_id::text,'provider_ack',
        new.subject_key,new.person_key,new.company_key,0,
        jsonb_build_object(
          'contract','powerhouse-provider-ack-outcome-v1',
          'truth_class','provider_acknowledged_execution',
          'provider_ack_verified',true,
          'message_hash',coalesce(new.evidence#>>'{commercial_intelligence,message_hash}',new.evidence->>'sent_message_hash'),
          'message_strategy',new.evidence#>>'{commercial_intelligence,message_strategy}',
          'learning_key',new.evidence#>>'{commercial_intelligence,learning_key}'
        ),
        new.executed_at,new.content_key,new.topic_key,new.campaign_key,new.opportunity_key,new.channel
      )
      on conflict(dedupe_key) do nothing;
    end if;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.powerhouse_reconcile_no_response_outcomes_v1(p_now timestamp with time zone DEFAULT now())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare v_inserted int:=0;
begin
 insert into public.powerhouse_sales_outcomes(
   action_id,dedupe_key,outcome_type,subject_key,person_key,company_key,revenue_eur,evidence,occurred_at,
   content_key,topic_key,campaign_key,opportunity_key,channel
 )
 select
   a.action_id,'no-response-72h:'||a.action_id::text,'no_response',
   a.subject_key,a.person_key,a.company_key,0,
   jsonb_build_object(
     'contract','powerhouse-terminal-action-outcome-v1',
     'truth_class','observed_absence_window',
     'window_hours',72,
     'interpretation','No observed response within 72h; this is response-rate evidence, not rejection.',
     'message_hash',coalesce(a.evidence#>>'{commercial_intelligence,message_hash}',a.evidence->>'sent_message_hash'),
     'message_strategy',a.evidence#>>'{commercial_intelligence,message_strategy}',
     'learning_key',a.evidence#>>'{commercial_intelligence,learning_key}'
   ),
   a.executed_at+interval '72 hours',
   a.content_key,a.topic_key,a.campaign_key,a.opportunity_key,a.channel
 from public.powerhouse_sales_actions a
 where a.status='done'
   and a.executed_at is not null
   and a.executed_at<=p_now-interval '72 hours'
   and lower(replace(a.channel,' ','_')) in ('email','e-mail','linkedin_dm','linkedin')
   and not exists(select 1 from public.powerhouse_sales_outcomes o where o.action_id=a.action_id)
   and not exists(select 1 from public.powerhouse_email_reply_events e where e.action_id=a.action_id);
 get diagnostics v_inserted=row_count;
 return jsonb_build_object('contract','powerhouse-terminal-action-outcome-v1','no_response_outcomes_inserted',v_inserted,'observed_at',p_now);
end $function$;

CREATE OR REPLACE FUNCTION public.powerhouse_refresh_connection_enrichment_batch_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date, p_batch_size integer DEFAULT 200)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare v_now timestamptz:=now(); v_touched int:=0; v_total int:=0; v_done int:=0;
begin
 with candidates as (
   select
     coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) person_key,
     c.linkedin_url,c.naam,c.bedrijf,c.rol,c.segment,c.status,c.prioriteit,c.email,c.bron,
     lower(regexp_replace(trim(coalesce(c.bedrijf,'')),'\s+',' ','g')) company_key
   from public.bg_connecties c
   left join public.powerhouse_connection_enrichment_state_v1 s
     on s.person_key=coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),''))
   where coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) is not null
   order by (s.enrichment_date is distinct from p_run_date) desc,s.enriched_at asc nulls first,c.bijgewerkt_op desc nulls last
   limit greatest(1,least(coalesce(p_batch_size,200),500))
 ), rolled as (
   select c.*,
     coalesce(li.events_30d,0) linkedin_events_30d,
     coalesce(ps.signals_90d,0)+coalesce(cs.signals_90d,0) external_signals_90d,
     coalesce(n.news_120d,0) company_news_120d,
     greatest(coalesce(rp.evidence_90d,0),coalesce(rc.evidence_90d,0)) runtime_evidence_90d,
     greatest(li.latest_at,ps.latest_at,cs.latest_at,n.latest_at,rp.latest_at,rc.latest_at) latest_external_at
   from candidates c
   left join lateral (
     select count(*) filter(where le.occurred_at>=v_now-interval '30 days')::int events_30d,max(le.occurred_at) latest_at
     from public.linkedin_engagement_events le
     where coalesce(le.is_test,false)=false and nullif(c.linkedin_url,'') is not null
       and lower(trim(le.actor_linkedin_url))=lower(trim(c.linkedin_url))
   ) li on true
   left join lateral (
     select count(*) filter(where ps.observed_at>=v_now-interval '90 days')::int signals_90d,max(ps.observed_at) latest_at
     from public.powerhouse_predictive_signals ps
     where ps.entity_scope='person' and ps.entity_key in (c.person_key,c.linkedin_url)
   ) ps on true
   left join lateral (
     select count(*) filter(where ps.observed_at>=v_now-interval '90 days')::int signals_90d,max(ps.observed_at) latest_at
     from public.powerhouse_predictive_signals ps
     where ps.entity_scope='company' and c.company_key<>'' and lower(regexp_replace(trim(ps.entity_key),'\s+',' ','g'))=c.company_key
   ) cs on true
   left join lateral (
     select count(*) filter(where coalesce(bn.gepubliceerd_op,bn.opgehaald_op)>=v_now-interval '120 days')::int news_120d,
       max(coalesce(bn.gepubliceerd_op,bn.opgehaald_op)) latest_at
     from public.bg_bedrijfsnieuws bn
     where c.company_key<>'' and bn.over_dit_bedrijf is true and coalesce(bn.afgewezen_reden,'')=''
       and lower(regexp_replace(trim(bn.bedrijf),'\s+',' ','g'))=c.company_key
   ) n on true
   left join lateral (
     select count(*) filter(where re.occurred_at>=v_now-interval '90 days')::int evidence_90d,max(re.occurred_at) latest_at
     from public.powerhouse_runtime_events re where re.person_key=c.person_key
   ) rp on true
   left join lateral (
     select count(*) filter(where re.occurred_at>=v_now-interval '90 days')::int evidence_90d,max(re.occurred_at) latest_at
     from public.powerhouse_runtime_events re
     where c.company_key<>'' and lower(regexp_replace(trim(coalesce(re.company_key,'')),'\s+',' ','g'))=c.company_key
   ) rc on true
 ), ins as (
   insert into public.powerhouse_connection_enrichment_state_v1(
     person_key,linkedin_url,enrichment_date,enriched_at,data_completeness,
     linkedin_events_30d,external_signals_90d,company_news_120d,runtime_evidence_90d,
     latest_external_at,source_snapshot,updated_at
   )
   select r.person_key,r.linkedin_url,p_run_date,v_now,
     round(((case when nullif(trim(coalesce(r.naam,'')),'') is not null then 1 else 0 end)+
            (case when nullif(trim(coalesce(r.bedrijf,'')),'') is not null then 1 else 0 end)+
            (case when nullif(trim(coalesce(r.rol,'')),'') is not null then 1 else 0 end)+
            (case when nullif(trim(coalesce(r.linkedin_url,'')),'') is not null then 1 else 0 end)+
            (case when nullif(trim(coalesce(r.email,'')),'') is not null then 1 else 0 end))::numeric/5,4),
     r.linkedin_events_30d,r.external_signals_90d,r.company_news_120d,r.runtime_evidence_90d,r.latest_external_at,
     jsonb_build_object(
       'contract','powerhouse-connection-enrichment-batch-v1',
       'core',jsonb_build_object('name',r.naam,'company',r.bedrijf,'role',r.rol,'segment',r.segment,'status',r.status,'priority',r.prioriteit,'source',r.bron),
       'metrics',jsonb_build_object('linkedin_events_30d',r.linkedin_events_30d,'external_signals_90d',r.external_signals_90d,
         'company_news_120d',r.company_news_120d,'runtime_evidence_90d',r.runtime_evidence_90d,'latest_external_at',r.latest_external_at),
       'bounded',true,'sensitive_inference_allowed',false
     ),v_now
   from rolled r
   on conflict(person_key) do update set
     linkedin_url=excluded.linkedin_url,enrichment_date=excluded.enrichment_date,enriched_at=excluded.enriched_at,
     data_completeness=excluded.data_completeness,linkedin_events_30d=excluded.linkedin_events_30d,
     external_signals_90d=excluded.external_signals_90d,company_news_120d=excluded.company_news_120d,
     runtime_evidence_90d=excluded.runtime_evidence_90d,latest_external_at=excluded.latest_external_at,
     source_snapshot=excluded.source_snapshot,updated_at=excluded.updated_at
   returning person_key
 )
 select count(*) into v_touched from ins;

 select count(*) into v_total
 from public.bg_connecties c
 where coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) is not null;

 select count(*) into v_done
 from public.powerhouse_connection_enrichment_state_v1 s
 where s.enrichment_date=p_run_date;

 return jsonb_build_object(
   'contract','powerhouse-connection-enrichment-batch-v1','run_date',p_run_date,'batch_size',p_batch_size,
   'connections_total',v_total,'connections_touched',v_touched,'connections_enriched_today',v_done,
   'connections_remaining_today',greatest(0,v_total-v_done),
   'daily_completion_ratio',case when v_total=0 then 1 else round(v_done::numeric/v_total,4) end,
   'full_graph_daily_refresh',v_done>=v_total,'bounded_incremental',true,'executed_at',v_now
 );
end $function$;

drop trigger if exists trg_powerhouse_provider_ack_outcome_v1 on public.powerhouse_sales_actions;
create trigger trg_powerhouse_provider_ack_outcome_v1 after update of status,executed_at,evidence on public.powerhouse_sales_actions for each row execute function public.powerhouse_provider_ack_outcome_v1();

create or replace view public.powerhouse_one_commercial_loop_health_v1 with (security_invoker=true) as
SELECT now() AS measured_at,
    count(*) FILTER (WHERE created_at >= (now() - '30 days'::interval)) AS actions_30d,
    count(*) FILTER (WHERE status = 'done'::text AND executed_at >= (now() - '30 days'::interval)) AS executed_30d,
    count(*) FILTER (WHERE status = 'done'::text AND executed_at >= (now() - '30 days'::interval) AND (COALESCE(evidence #>> '{autonomous_outbound,provider_ack_verified}'::text[], 'false'::text) = 'true'::text OR COALESCE(evidence #>> '{salesrobot_execution,provider_ack_verified}'::text[], 'false'::text) = 'true'::text OR COALESCE(evidence ->> 'provider_ack_verified'::text, 'false'::text) = 'true'::text)) AS provider_ack_30d,
    count(*) FILTER (WHERE status = 'done'::text AND executed_at >= (now() - '30 days'::interval) AND (EXISTS ( SELECT 1
           FROM powerhouse_sales_outcomes o
          WHERE o.action_id = a.action_id))) AS terminal_outcome_linked_30d,
    count(*) FILTER (WHERE (status = ANY (ARRAY['suggested'::text, 'prepared'::text, 'waiting'::text])) AND COALESCE(evidence #>> '{commercial_intelligence,message_strategy}'::text[], ''::text) <> ''::text) AS pending_strategy_labeled,
    count(*) FILTER (WHERE (status = ANY (ARRAY['suggested'::text, 'prepared'::text, 'waiting'::text])) AND COALESCE(message_draft, ''::text) <> ''::text AND powerhouse_outbound_message_quality_ready_v1(action_id)) AS pending_quality_ready,
    count(*) FILTER (WHERE (status = ANY (ARRAY['suggested'::text, 'prepared'::text, 'waiting'::text])) AND COALESCE(evidence #>> '{commercial_intelligence,source_nba}'::text[], ''::text) = 'powerhouse_commercial_next_best_action_v5'::text) AS pending_from_nba_v5,
    count(*) FILTER (WHERE status = 'done'::text AND executed_at >= (now() - '30 days'::interval) AND (COALESCE(evidence #>> '{autonomous_outbound,provider_ack_verified}'::text[], 'false'::text) = 'true'::text OR COALESCE(evidence #>> '{salesrobot_execution,provider_ack_verified}'::text[], 'false'::text) = 'true'::text OR COALESCE(evidence ->> 'provider_ack_verified'::text, 'false'::text) = 'true'::text) AND (EXISTS ( SELECT 1
           FROM powerhouse_sales_outcomes o
          WHERE o.action_id = a.action_id))) AS provider_ack_outcome_linked_30d
   FROM powerhouse_sales_actions a;;

revoke all on public.powerhouse_one_commercial_loop_health_v1 from public,anon,authenticated;
grant select on public.powerhouse_one_commercial_loop_health_v1 to service_role;


-- Fail-closed execution boundary for SECURITY DEFINER functions.
-- Browser/public roles never receive direct EXECUTE; trusted server execution stays on service_role.
revoke execute on function public.powerhouse_commercial_intelligence_heartbeat_v1(date) from public, anon, authenticated;
revoke execute on function public.powerhouse_dispatch_relationship_public_research_v1(date) from public, anon, authenticated;
revoke execute on function public.powerhouse_materialize_command_center_actions_v1(date) from public, anon, authenticated;
revoke execute on function public.powerhouse_one_commercial_closed_loop_v1(date) from public, anon, authenticated;
revoke execute on function public.powerhouse_prepare_autonomous_outreach_v1(date) from public, anon, authenticated;
revoke execute on function public.powerhouse_prepare_linkedin_sales_machine_v1(date) from public, anon, authenticated;
revoke execute on function public.powerhouse_promote_research_to_social_v1() from public, anon, authenticated;
revoke execute on function public.powerhouse_reconcile_no_response_outcomes_v1(timestamp with time zone) from public, anon, authenticated;
revoke execute on function public.powerhouse_refresh_connection_enrichment_batch_v1(date, integer) from public, anon, authenticated;

grant execute on function public.powerhouse_commercial_intelligence_heartbeat_v1(date) to service_role;
grant execute on function public.powerhouse_dispatch_relationship_public_research_v1(date) to service_role;
grant execute on function public.powerhouse_materialize_command_center_actions_v1(date) to service_role;
grant execute on function public.powerhouse_one_commercial_closed_loop_v1(date) to service_role;
grant execute on function public.powerhouse_prepare_autonomous_outreach_v1(date) to service_role;
grant execute on function public.powerhouse_prepare_linkedin_sales_machine_v1(date) to service_role;
grant execute on function public.powerhouse_promote_research_to_social_v1() to service_role;
grant execute on function public.powerhouse_reconcile_no_response_outcomes_v1(timestamp with time zone) to service_role;
grant execute on function public.powerhouse_refresh_connection_enrichment_batch_v1(date, integer) to service_role;
