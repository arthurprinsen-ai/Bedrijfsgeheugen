CREATE OR REPLACE FUNCTION public.powerhouse_one_commercial_closed_loop_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
 v_spine jsonb; v_intel jsonb; v_materialize jsonb; v_promote jsonb; v_plans jsonb; v_compose jsonb;
 v_social_gate jsonb; v_comment_dispatch jsonb; v_research_dispatch jsonb; v_email_dispatch jsonb; v_li_dispatch jsonb;
 v_no_response jsonb; v_learning jsonb; v_attribution jsonb; v_closure jsonb; v_health jsonb;
 v_email_ready int:=0; v_dm_ready int:=0; v_comment_ready int:=0; v_result jsonb;
begin
 v_spine:=public.powerhouse_revenue_event_spine_cycle_v1(p_run_date);
 v_intel:=public.powerhouse_commercial_intelligence_heartbeat_v1(p_run_date);
 v_materialize:=public.powerhouse_materialize_command_center_actions_v1(p_run_date);
 v_promote:=public.powerhouse_promote_research_to_social_v1();

 v_plans:=public.powerhouse_refresh_message_plans_v1(200);
 v_compose:=public.powerhouse_dispatch_human_sales_composer_v2(20);
 v_social_gate:=public.powerhouse_prepare_quality_social_comments_v1(p_run_date);
 v_comment_dispatch:=public.powerhouse_dispatch_linkedin_comment_autopilot_v1(p_run_date);

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
   and nullif(trim(coalesce(a.source_url,'')),'') is not null
   and (
     a.dedupe_key like 'command-social:'||p_run_date::text||':%'
     or (
       a.dedupe_key like 'research-social:%'
       and exists(
         select 1 from public.powerhouse_sales_actions r
         where r.action_id=nullif(a.evidence#>>'{commercial_intelligence,research_action_id}','')::uuid
           and r.executed_at>=now()-interval '24 hours'
       )
     )
   );

 v_research_dispatch:=public.powerhouse_dispatch_relationship_public_research_v1(p_run_date);

 if v_email_ready>0 then
   v_email_dispatch:=public.powerhouse_dispatch_autonomous_outreach_v1(p_run_date);
 else
   v_email_dispatch:=jsonb_build_object('dispatched',false,'reason','NO_QUALITY_READY_EMAIL_ACTIONS');
 end if;

 if v_dm_ready>0 then
   v_li_dispatch:=public.powerhouse_dispatch_linkedin_sales_machine_v1(p_run_date);
 else
   v_li_dispatch:=jsonb_build_object('dispatched',false,'reason','NO_CANONICAL_QUALITY_READY_LINKEDIN_DM_ACTIONS');
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
   'social_quality_gate',v_social_gate,'linkedin_comment_dispatch',v_comment_dispatch,
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
end $function$
