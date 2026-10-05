create or replace function public.powerhouse_commercial_intelligence_heartbeat_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb language plpgsql security definer set search_path='public','pg_catalog' as $$
declare
  v_res jsonb; v_enrich jsonb; v_now timestamptz:=now(); v_forecasts int:=0; v_snapshot_at timestamptz;
begin
  v_res:=public.powerhouse_resolve_company_person_signals_v1(p_run_date);
  v_enrich:=public.powerhouse_refresh_connection_enrichment_batch_v1(p_run_date,200);
  select max(refreshed_at) into v_snapshot_at from public.powerhouse_revenue_command_center_snapshot_v1;

  with ranked as (
    select s.*
    from public.powerhouse_revenue_command_center_snapshot_v1 s
    where s.revenue_rank<=20
      and s.buying_window_score>=.30 and s.buying_window_confidence>=.25
      and coalesce(s.pressure_state,'ready') not in ('cooldown','wait','suppressed','do_not_contact')
      and (s.cooldown_until is null or s.cooldown_until<=v_now)
      and coalesce(s.identity_conflict,false)=false
      and coalesce(s.structural_lineage_gap,false)=false
    order by s.revenue_rank
  )
  insert into public.powerhouse_forecasts(
    forecast_key,horizon_start,horizon_end,expected_by,scope,scope_key,predicted_event,predicted_problem,
    predicted_question,predicted_search_intent,predicted_buying_trigger,probability,confidence,expected_lead_days,
    first_mover_score,strategic_fit,revenue_potential,signal_acceleration,market_saturation,whitespace_score,
    prediction_mode,evidence,status,last_scored_at,updated_at
  )
  select
    'commercial:'||p_run_date::text||':'||r.opportunity_key,
    p_run_date,
    p_run_date+(case when r.buying_window_score>=.72 then 7 when r.buying_window_score>=.55 then 14 else 30 end),
    p_run_date+(case when r.buying_window_score>=.72 then 7 when r.buying_window_score>=.55 then 14 else 30 end),
    case when r.person_key is not null then 'person' else 'company' end,
    coalesce(r.person_key,r.company_key,r.opportunity_key),
    'commercial_progression',nullif(r.why_now,''),
    'Will this relationship progress to an observed positive commercial outcome inside the horizon?',
    'commercial_intent',r.recommended_cta,
    coalesce(r.prediction_win,r.buying_window_score),
    greatest(r.buying_window_confidence,coalesce(r.prediction_confidence,0)),
    case when r.buying_window_score>=.72 then 7 when r.buying_window_score>=.55 then 14 else 30 end,
    round(100*r.buying_window_score,2),r.buying_window_score,
    least(1,coalesce(r.expected_commercial_value_eur,0)/25000.0),
    least(1,greatest(0,r.evidence_density)),greatest(0,1-r.evidence_density),least(1,greatest(0,r.evidence_density)),
    'anticipatory',
    jsonb_build_object(
      'contract','powerhouse-commercial-intelligence-heartbeat-v4',
      'source_nba','powerhouse_commercial_next_best_action_v5',
      'runtime_read_model','powerhouse_revenue_command_center_snapshot_v1',
      'snapshot_refreshed_at',r.refreshed_at,
      'opportunity_key',r.opportunity_key,'person_key',r.person_key,'company_key',r.company_key,
      'message_strategy',r.message_strategy,'recommended_channel',r.recommended_channel,'recommended_cta',r.recommended_cta,
      'prediction_model_version',r.prediction_model_version,'prediction_confidence',r.prediction_confidence
    ),
    'active',v_now,v_now
  from ranked r
  on conflict(forecast_key) do update set
    probability=excluded.probability,confidence=excluded.confidence,predicted_problem=excluded.predicted_problem,
    predicted_buying_trigger=excluded.predicted_buying_trigger,evidence=excluded.evidence,last_scored_at=v_now,updated_at=v_now;
  get diagnostics v_forecasts=row_count;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values(
    'commercial-intelligence-heartbeat:'||p_run_date,'commercial_intelligence_heartbeat',
    'powerhouse-commercial-intelligence-heartbeat-v4','company-person-commercial',v_now,
    jsonb_build_object('resolution',v_res,'enrichment',v_enrich,'forecasts_upserted',v_forecasts,
      'source_nba','v5','runtime_read_model','revenue_command_center_snapshot_v1','snapshot_refreshed_at',v_snapshot_at),
    jsonb_build_object('bounded',true,'no_provider_send',true,'single_action_materializer',true,
      'incremental_enrichment',true,'heavy_nba_view_out_of_critical_path',true),
    'actioned','VERIFIED',1
  )
  on conflict(dedupe_key) do update set occurred_at=excluded.occurred_at,evidence=excluded.evidence,
    context=excluded.context,state=excluded.state,updated_at=now();

  return jsonb_build_object('contract','powerhouse-commercial-intelligence-heartbeat-v4','healthy',true,
    'source_nba','v5','runtime_read_model','powerhouse_revenue_command_center_snapshot_v1',
    'snapshot_refreshed_at',v_snapshot_at,'resolution',v_res,'enrichment',v_enrich,
    'actions_upserted',0,'forecasts_upserted',v_forecasts,'provider_send_executed',false,'executed_at',v_now);
exception when others then
  return jsonb_build_object('contract','powerhouse-commercial-intelligence-heartbeat-v4','healthy',false,
    'error',sqlerrm,'sqlstate',sqlstate,'executed_at',now());
end $$;

create or replace function public.powerhouse_materialize_command_center_actions_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb language plpgsql security definer set search_path='public','pg_catalog' as $$
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
      '',r.source_url,
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
end $$;
revoke execute on function public.powerhouse_materialize_command_center_actions_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_materialize_command_center_actions_v1(date) to service_role;

create or replace function public.powerhouse_prepare_autonomous_outreach_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb language plpgsql security definer set search_path='public','pg_catalog' as $$
declare v_n int;
begin
  select count(*)::int into v_n from public.powerhouse_sales_actions
  where action_type='autonomous_email' and channel='email' and status='prepared'
    and due_at<=now();
  return jsonb_build_object('contract','powerhouse-autonomous-outreach-canonical-adapter-v1',
    'prepared',v_n,'candidate_owner','powerhouse-command-center-action-materializer-v1',
    'duplicate_candidate_generation',false,'run_date',p_run_date,'executed_at',now());
end $$;

create or replace function public.powerhouse_prepare_linkedin_sales_machine_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb language plpgsql security definer set search_path='public','pg_catalog' as $$
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
end $$;

create or replace function public.powerhouse_dispatch_relationship_public_research_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb language plpgsql security definer set search_path='pg_catalog','public' as $$
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
end $$;
revoke execute on function public.powerhouse_dispatch_relationship_public_research_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_dispatch_relationship_public_research_v1(date) to service_role;

create or replace function public.powerhouse_promote_research_to_social_v1()
returns jsonb language plpgsql security definer set search_path='public','pg_catalog' as $$
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
end $$;
revoke execute on function public.powerhouse_promote_research_to_social_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_promote_research_to_social_v1() to service_role;

create or replace function public.powerhouse_one_commercial_closed_loop_v1(
 p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb language plpgsql security definer set search_path='public','pg_catalog' as $$
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
   and public.powerhouse_outbound_message_quality_ready_v1(a.action_id);

 select count(*)::int into v_dm_ready
 from public.powerhouse_sales_actions a
 where a.channel='linkedin_dm' and a.status in ('prepared','suggested')
   and public.powerhouse_outbound_message_quality_ready_v1(a.action_id);

 select count(*)::int into v_comment_ready
 from public.powerhouse_sales_actions a
 where a.action_type='reply_post' and a.channel='linkedin_personal' and a.status='prepared'
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
end $$;
