create or replace function public.powerhouse_one_commercial_decision_loop_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb
language plpgsql
security definer
set search_path='public','pg_catalog'
as $$
declare
 v_spine jsonb;
 v_intel jsonb;
 v_reconcile jsonb;
 v_li_prepare jsonb;
 v_email_prepare jsonb;
 v_plans jsonb;
 v_no_response jsonb;
 v_learning jsonb;
 v_attribution jsonb;
 v_closure jsonb;
 v_result jsonb;
begin
 v_spine:=public.powerhouse_revenue_event_spine_cycle_v1(p_run_date);
 v_intel:=public.powerhouse_commercial_intelligence_heartbeat_v1(p_run_date);
 v_reconcile:=public.powerhouse_reconcile_daily_sales_action_set_v1(p_run_date);
 v_li_prepare:=public.powerhouse_prepare_linkedin_sales_machine_v1(p_run_date);
 v_email_prepare:=public.powerhouse_prepare_autonomous_outreach_v1(p_run_date);
 v_plans:=public.powerhouse_refresh_message_plans_v1(200);
 v_no_response:=public.powerhouse_reconcile_no_response_outcomes_v1(now());
 v_learning:=public.powerhouse_refresh_outbound_learning_v1();
 v_attribution:=public.powerhouse_refresh_revenue_attribution_snapshot_v1();
 v_closure:=public.powerhouse_commercial_action_closure_watchdog_v1(now());

 v_result:=jsonb_build_object(
   'contract','powerhouse-one-commercial-decision-loop-v1',
   'run_date',p_run_date,
   'lineage','event->identity->intent/opportunity->nba-v5->pressure/cooldown->action->play/psychology->message-plan->quality/executor-owner->outcome->revenue->attribution->learning->next-nba',
   'revenue_spine',v_spine,
   'commercial_intelligence',v_intel,
   'daily_action_set',v_reconcile,
   'linkedin_prepare',v_li_prepare,
   'email_prepare',v_email_prepare,
   'message_plans',v_plans,
   'composer_owner','powerhouse-human-sales-composer existing scheduler',
   'provider_owner','existing canonical channel executors only',
   'external_dispatch_executed_by_this_loop',false,
   'terminal_outcomes',v_no_response,
   'outbound_learning',v_learning,
   'attribution',v_attribution,
   'closure_watchdog',v_closure,
   'executed_at',now()
 );

 insert into public.powerhouse_runtime_events(
   dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
 ) values(
   'one-commercial-decision-loop:'||p_run_date::text,
   'one_commercial_decision_loop',
   'powerhouse-one-commercial-decision-loop-v1',
   'growth-revenue-os',
   now(),
   v_result,
   jsonb_build_object(
     'existing_state_first',true,
     'single_canonical_lineage',true,
     'no_external_http_dispatch',true,
     'nba_version','v5'
   ),
   'actioned',
   'VERIFIED',
   1
 )
 on conflict(dedupe_key) do update set
   occurred_at=excluded.occurred_at,
   evidence=excluded.evidence,
   context=excluded.context,
   state=excluded.state,
   updated_at=now();

 return v_result;
end $$;

revoke execute on function public.powerhouse_one_commercial_decision_loop_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_one_commercial_decision_loop_v1(date) to service_role;
