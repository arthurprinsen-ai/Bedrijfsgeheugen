create or replace function public.powerhouse_commercial_intelligence_heartbeat_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb language plpgsql security definer set search_path='public','pg_catalog' as $$
declare
 v_res jsonb; v_enrich jsonb; v_now timestamptz:=now(); v_actions int:=0; v_forecasts int:=0;
begin
 v_res:=public.powerhouse_resolve_company_person_signals_v1(p_run_date);
 v_enrich:=public.powerhouse_refresh_all_connection_enrichment_v1(p_run_date,0);

 with ranked as (
  select n.*,
    row_number() over(order by n.expected_commercial_value_eur desc,n.action_confidence desc,n.buying_window_score desc,n.updated_at desc) rn
  from public.powerhouse_commercial_next_best_action_v5 n
  where n.buying_window_score>=.30
    and n.buying_window_confidence>=.25
    and coalesce(n.pending_response,false)=false
    and (n.cooldown_until is null or n.cooldown_until<=v_now)
    and coalesce(n.pressure_state,'ready') not in ('cooldown','wait','suppressed','do_not_contact')
 )
 insert into public.powerhouse_sales_actions(
   dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,message_draft,status,due_at,
   content_key,topic_key,campaign_key,opportunity_key,expected_value_eur,person_name,company_name,role
 )
 select
   'autonomy:'||p_run_date::text||':'||r.opportunity_key,
   r.subject_key,r.person_key,r.company_key,
   case when r.recommended_channel='linkedin_comment' then 'expert_comment'
        when r.recommended_channel in ('linkedin_dm','email') then 'commercial_outreach'
        else 'research_enrichment' end,
   r.recommended_channel,
   round(least(100,greatest(0,100*r.commercial_progression_probability))::numeric,2),
   'Current-v5 contextual next-best-action from canonical company/person/predictive/revenue evidence.',
   coalesce(r.evidence,'{}'::jsonb)||jsonb_build_object(
     'commercial_intelligence',
     coalesce(r.commercial_intelligence,'{}'::jsonb)||jsonb_build_object(
       'contract','powerhouse-commercial-intelligence-heartbeat-v2',
       'source_nba','powerhouse_commercial_next_best_action_v5',
       'buying_window_score',r.buying_window_score,
       'buying_window_confidence',r.buying_window_confidence,
       'commercial_progression',r.commercial_progression_probability,
       'recommended_channel',r.recommended_channel,
       'message_strategy',r.message_strategy,
       'recommended_asset',r.effective_recommended_asset,
       'recommended_cta',r.recommended_cta,
       'best_context',r.best_context,
       'pressure_state',r.pressure_state,
       'cooldown_until',r.cooldown_until,
       'pending_response',r.pending_response,
       'prediction_reply',r.prediction_reply,
       'prediction_meeting',r.prediction_meeting,
       'prediction_proposal',r.prediction_proposal,
       'prediction_win',r.prediction_win,
       'prediction_model_version',r.prediction_model_version,
       'prediction_confidence',r.prediction_confidence,
       'policy','Suggested only; provider execution remains separately governed and exact-message-quality gated.'
     )
   ),
   '', 'suggested', v_now, r.content_key,r.topic_key,r.campaign_key,r.opportunity_key,
   r.expected_commercial_value_eur,r.person_name,coalesce(r.person_company_name,r.company_key),r.role
 from ranked r where r.rn<=20
 on conflict(dedupe_key) do update set
   channel=excluded.channel,priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,
   expected_value_eur=excluded.expected_value_eur,
   person_name=coalesce(excluded.person_name,powerhouse_sales_actions.person_name),
   company_name=coalesce(excluded.company_name,powerhouse_sales_actions.company_name),
   role=coalesce(excluded.role,powerhouse_sales_actions.role),updated_at=v_now
 where powerhouse_sales_actions.status in ('suggested','prepared','waiting');
 get diagnostics v_actions=row_count;

 with ranked as (
  select n.*,row_number() over(order by n.expected_commercial_value_eur desc,n.action_confidence desc) rn
  from public.powerhouse_commercial_next_best_action_v5 n
  where n.buying_window_confidence>=.25 and n.buying_window_score>=.30
    and coalesce(n.pending_response,false)=false
    and (n.cooldown_until is null or n.cooldown_until<=v_now)
    and coalesce(n.pressure_state,'ready') not in ('cooldown','wait','suppressed','do_not_contact')
 )
 insert into public.powerhouse_forecasts(
   forecast_key,horizon_start,horizon_end,expected_by,scope,scope_key,topic_key,predicted_event,predicted_problem,
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
   coalesce(r.person_key,r.company_key,r.opportunity_key),r.topic_key,'commercial_progression',
   nullif(r.best_context,''),'Will this relationship progress to an observed positive commercial outcome inside the horizon?',
   'commercial_intent',r.recommended_cta,
   coalesce(r.prediction_win,r.commercial_progression_probability),
   greatest(r.buying_window_confidence,coalesce(r.prediction_confidence,0)),
   case when r.buying_window_score>=.72 then 7 when r.buying_window_score>=.55 then 14 else 30 end,
   round(100*r.buying_window_score,2),r.buying_window_score,
   least(1,coalesce(r.expected_commercial_value_eur,0)/25000.0),
   least(1,greatest(0,r.company_intent_score)),greatest(0,1-r.company_intent_score),
   least(1,greatest(0,r.evidence_density)),'anticipatory',
   jsonb_build_object(
     'contract','powerhouse-commercial-intelligence-heartbeat-v2',
     'source_nba','powerhouse_commercial_next_best_action_v5',
     'opportunity_key',r.opportunity_key,'person_key',r.person_key,'company_key',r.company_key,
     'buying_window_score',r.buying_window_score,'message_strategy',r.message_strategy,
     'recommended_channel',r.recommended_channel,'recommended_cta',r.recommended_cta,
     'prediction_model_version',r.prediction_model_version,'prediction_confidence',r.prediction_confidence
   ),
   'active',v_now,v_now
 from ranked r where r.rn<=20
 on conflict(forecast_key) do update set
   probability=excluded.probability,confidence=excluded.confidence,predicted_problem=excluded.predicted_problem,
   predicted_buying_trigger=excluded.predicted_buying_trigger,evidence=excluded.evidence,last_scored_at=v_now,updated_at=v_now;
 get diagnostics v_forecasts=row_count;

 insert into public.powerhouse_runtime_events(
   dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
 ) values(
   'commercial-intelligence-heartbeat:'||p_run_date,
   'commercial_intelligence_heartbeat','powerhouse-commercial-intelligence-heartbeat-v2','company-person-commercial',v_now,
   jsonb_build_object('resolution',v_res,'enrichment',v_enrich,'actions_upserted',v_actions,'forecasts_upserted',v_forecasts,'source_nba','v5'),
   jsonb_build_object('bounded',true,'no_provider_send',true,'same_canonical_lineage',true,'pressure_gated',true),
   'actioned','VERIFIED',1
 )
 on conflict(dedupe_key) do update set occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,state=excluded.state,updated_at=now();

 return jsonb_build_object('contract','powerhouse-commercial-intelligence-heartbeat-v2','healthy',true,'source_nba','v5',
   'resolution',v_res,'enrichment',v_enrich,'actions_upserted',v_actions,'forecasts_upserted',v_forecasts,
   'provider_send_executed',false,'executed_at',v_now);
exception when others then
 return jsonb_build_object('contract','powerhouse-commercial-intelligence-heartbeat-v2','healthy',false,'error',sqlerrm,'sqlstate',sqlstate,'executed_at',now());
end $$;
revoke execute on function public.powerhouse_commercial_intelligence_heartbeat_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_commercial_intelligence_heartbeat_v1(date) to service_role;

create or replace function public.powerhouse_reconcile_no_response_outcomes_v1(p_now timestamptz default now())
returns jsonb language plpgsql security definer set search_path='public','pg_catalog' as $$
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
end $$;
revoke execute on function public.powerhouse_reconcile_no_response_outcomes_v1(timestamptz) from public,anon,authenticated;
grant execute on function public.powerhouse_reconcile_no_response_outcomes_v1(timestamptz) to service_role;

create or replace view public.powerhouse_one_commercial_loop_health_v1 with(security_invoker=true) as
select
 now() measured_at,
 count(*) filter(where a.created_at>=now()-interval '30 days') actions_30d,
 count(*) filter(where a.status='done' and a.executed_at>=now()-interval '30 days') executed_30d,
 count(*) filter(where a.status='done' and a.executed_at>=now()-interval '30 days'
   and (coalesce(a.evidence#>>'{autonomous_outbound,provider_ack_verified}','false')='true'
     or coalesce(a.evidence#>>'{salesrobot_execution,provider_ack_verified}','false')='true'
     or coalesce(a.evidence->>'provider_ack_verified','false')='true')) provider_ack_30d,
 count(*) filter(where a.status='done' and a.executed_at>=now()-interval '30 days'
   and exists(select 1 from public.powerhouse_sales_outcomes o where o.action_id=a.action_id)) terminal_outcome_linked_30d,
 count(*) filter(where a.status in ('suggested','prepared','waiting')
   and coalesce(a.evidence#>>'{commercial_intelligence,message_strategy}','')<>'') pending_strategy_labeled,
 count(*) filter(where a.status in ('suggested','prepared','waiting')
   and coalesce(a.message_draft,'')<>''
   and public.powerhouse_outbound_message_quality_ready_v1(a.action_id)) pending_quality_ready,
 count(*) filter(where a.status in ('suggested','prepared','waiting')
   and coalesce(a.evidence#>>'{commercial_intelligence,source_nba}','')='powerhouse_commercial_next_best_action_v5') pending_from_nba_v5
from public.powerhouse_sales_actions a;
revoke all on public.powerhouse_one_commercial_loop_health_v1 from public,anon,authenticated;
grant select on public.powerhouse_one_commercial_loop_health_v1 to service_role;

create or replace function public.powerhouse_one_commercial_closed_loop_v1(
 p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb language plpgsql security definer set search_path='public','pg_catalog' as $$
declare
 v_spine jsonb; v_intel jsonb; v_reconcile jsonb; v_li_prepare jsonb; v_email_prepare jsonb;
 v_plans jsonb; v_compose jsonb; v_email_dispatch jsonb; v_li_dispatch jsonb;
 v_no_response jsonb; v_learning jsonb; v_attribution jsonb; v_closure jsonb; v_health jsonb;
 v_quality_ready int:=0; v_result jsonb;
begin
 v_spine:=public.powerhouse_revenue_event_spine_cycle_v1(p_run_date);
 v_intel:=public.powerhouse_commercial_intelligence_heartbeat_v1(p_run_date);
 v_reconcile:=public.powerhouse_reconcile_daily_sales_action_set_v1(p_run_date);

 v_li_prepare:=public.powerhouse_prepare_linkedin_sales_machine_v1(p_run_date);
 v_email_prepare:=public.powerhouse_prepare_autonomous_outreach_v1(p_run_date);

 v_plans:=public.powerhouse_refresh_message_plans_v1(200);
 v_compose:=public.powerhouse_dispatch_human_sales_composer_v2(20);

 select count(*)::int into v_quality_ready
 from public.powerhouse_sales_actions a
 where a.status in ('prepared','waiting')
   and public.powerhouse_outbound_message_quality_ready_v1(a.action_id);

 if v_quality_ready>0 then
   v_email_dispatch:=public.powerhouse_dispatch_autonomous_outreach_v1(p_run_date);
   v_li_dispatch:=public.powerhouse_dispatch_linkedin_sales_machine_v1(p_run_date);
 else
   v_email_dispatch:=jsonb_build_object('dispatched',false,'reason','NO_QUALITY_READY_ACTIONS');
   v_li_dispatch:=jsonb_build_object('dispatched',false,'reason','NO_QUALITY_READY_ACTIONS');
 end if;

 v_no_response:=public.powerhouse_reconcile_no_response_outcomes_v1(now());
 v_learning:=public.powerhouse_refresh_outbound_learning_v1();
 v_attribution:=public.powerhouse_refresh_revenue_attribution_snapshot_v1();
 v_closure:=public.powerhouse_commercial_action_closure_watchdog_v1(now());
 select to_jsonb(h) into v_health from public.powerhouse_one_commercial_loop_health_v1 h;

 v_result:=jsonb_build_object(
   'contract','powerhouse-one-commercial-closed-loop-v1',
   'run_date',p_run_date,
   'lineage','event->identity->intent/opportunity->nba-v5->pressure/cooldown->action->play/psychology->message->quality->provider->outcome->revenue->attribution->learning->next-nba',
   'revenue_spine',v_spine,'commercial_intelligence',v_intel,'daily_action_set',v_reconcile,
   'linkedin_prepare',v_li_prepare,'email_prepare',v_email_prepare,'message_plans',v_plans,'composer_dispatch',v_compose,
   'quality_ready_actions',v_quality_ready,'email_provider_dispatch',v_email_dispatch,'linkedin_provider_dispatch',v_li_dispatch,
   'terminal_outcomes',v_no_response,'outbound_learning',v_learning,'attribution',v_attribution,'closure_watchdog',v_closure,
   'health',v_health,'executed_at',now()
 );

 insert into public.powerhouse_runtime_events(
   dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
 ) values(
   'one-commercial-closed-loop:'||p_run_date::text,
   'one_commercial_closed_loop',
   'powerhouse-one-commercial-closed-loop-v1',
   'growth-revenue-os',now(),v_result,
   jsonb_build_object('existing_state_first',true,'single_canonical_lineage',true,'provider_gates_preserved',true,'nba_version','v5'),
   'actioned','VERIFIED',1
 )
 on conflict(dedupe_key) do update set occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,state=excluded.state,updated_at=now();

 return v_result;
end $$;
revoke execute on function public.powerhouse_one_commercial_closed_loop_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_one_commercial_closed_loop_v1(date) to service_role;
