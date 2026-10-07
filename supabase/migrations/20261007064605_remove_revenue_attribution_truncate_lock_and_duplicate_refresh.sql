create or replace function public.powerhouse_refresh_revenue_attribution_snapshot_v1()
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $function$
declare
  v_rows integer := 0;
  v_deleted integer := 0;
  v_now timestamptz := clock_timestamp();
  v_locked boolean := false;
begin
  v_locked := pg_try_advisory_xact_lock(hashtextextended('powerhouse-revenue-attribution-snapshot-v1',0));

  if not v_locked then
    return jsonb_build_object(
      'contract','powerhouse-revenue-attribution-snapshot-v2',
      'state','SKIPPED_OVERLAP',
      'rows',(select count(*) from public.powerhouse_revenue_attribution_snapshot_v1),
      'refreshed_at',v_now
    );
  end if;

  drop table if exists pg_temp.powerhouse_revenue_attribution_stage_v1;
  create temporary table powerhouse_revenue_attribution_stage_v1
  on commit drop
  as
  select
    outcome_id,touch_type,touch_id,touch_at,conversion_at,channel,campaign_key,content_key,
    opportunity_key,person_key,company_key,revenue_eur,attribution_weight,
    attributed_revenue_eur,is_first_touch,is_conversion_touch,attribution_model,
    attribution_confidence,evidence
  from public.powerhouse_revenue_attribution_v2;

  insert into public.powerhouse_revenue_attribution_snapshot_v1(
    outcome_id,touch_type,touch_id,touch_at,conversion_at,channel,campaign_key,content_key,
    opportunity_key,person_key,company_key,revenue_eur,attribution_weight,
    attributed_revenue_eur,is_first_touch,is_conversion_touch,attribution_model,
    attribution_confidence,evidence,refreshed_at
  )
  select
    outcome_id,touch_type,touch_id,touch_at,conversion_at,channel,campaign_key,content_key,
    opportunity_key,person_key,company_key,revenue_eur,attribution_weight,
    attributed_revenue_eur,is_first_touch,is_conversion_touch,attribution_model,
    attribution_confidence,evidence,v_now
  from pg_temp.powerhouse_revenue_attribution_stage_v1
  on conflict(outcome_id,touch_type,touch_id) do update set
    touch_at=excluded.touch_at,
    conversion_at=excluded.conversion_at,
    channel=excluded.channel,
    campaign_key=excluded.campaign_key,
    content_key=excluded.content_key,
    opportunity_key=excluded.opportunity_key,
    person_key=excluded.person_key,
    company_key=excluded.company_key,
    revenue_eur=excluded.revenue_eur,
    attribution_weight=excluded.attribution_weight,
    attributed_revenue_eur=excluded.attributed_revenue_eur,
    is_first_touch=excluded.is_first_touch,
    is_conversion_touch=excluded.is_conversion_touch,
    attribution_model=excluded.attribution_model,
    attribution_confidence=excluded.attribution_confidence,
    evidence=excluded.evidence,
    refreshed_at=excluded.refreshed_at
  where (
    public.powerhouse_revenue_attribution_snapshot_v1.touch_at,
    public.powerhouse_revenue_attribution_snapshot_v1.conversion_at,
    public.powerhouse_revenue_attribution_snapshot_v1.channel,
    public.powerhouse_revenue_attribution_snapshot_v1.campaign_key,
    public.powerhouse_revenue_attribution_snapshot_v1.content_key,
    public.powerhouse_revenue_attribution_snapshot_v1.opportunity_key,
    public.powerhouse_revenue_attribution_snapshot_v1.person_key,
    public.powerhouse_revenue_attribution_snapshot_v1.company_key,
    public.powerhouse_revenue_attribution_snapshot_v1.revenue_eur,
    public.powerhouse_revenue_attribution_snapshot_v1.attribution_weight,
    public.powerhouse_revenue_attribution_snapshot_v1.attributed_revenue_eur,
    public.powerhouse_revenue_attribution_snapshot_v1.is_first_touch,
    public.powerhouse_revenue_attribution_snapshot_v1.is_conversion_touch,
    public.powerhouse_revenue_attribution_snapshot_v1.attribution_model,
    public.powerhouse_revenue_attribution_snapshot_v1.attribution_confidence,
    public.powerhouse_revenue_attribution_snapshot_v1.evidence
  ) is distinct from (
    excluded.touch_at,excluded.conversion_at,excluded.channel,excluded.campaign_key,
    excluded.content_key,excluded.opportunity_key,excluded.person_key,excluded.company_key,
    excluded.revenue_eur,excluded.attribution_weight,excluded.attributed_revenue_eur,
    excluded.is_first_touch,excluded.is_conversion_touch,excluded.attribution_model,
    excluded.attribution_confidence,excluded.evidence
  );
  get diagnostics v_rows = row_count;

  delete from public.powerhouse_revenue_attribution_snapshot_v1 s
  where not exists (
    select 1
    from pg_temp.powerhouse_revenue_attribution_stage_v1 x
    where x.outcome_id=s.outcome_id
      and x.touch_type=s.touch_type
      and x.touch_id=s.touch_id
  );
  get diagnostics v_deleted = row_count;

  return jsonb_build_object(
    'contract','powerhouse-revenue-attribution-snapshot-v2',
    'state','REFRESHED',
    'upserted_rows',v_rows,
    'deleted_rows',v_deleted,
    'rows',(select count(*) from public.powerhouse_revenue_attribution_snapshot_v1),
    'lock_mode','row_level_plus_advisory',
    'refreshed_at',v_now
  );
end
$function$;

revoke execute on function public.powerhouse_refresh_revenue_attribution_snapshot_v1()
  from public, anon, authenticated;
grant execute on function public.powerhouse_refresh_revenue_attribution_snapshot_v1()
  to service_role;

create or replace function public.powerhouse_one_commercial_decision_loop_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
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
 v_attribution:=coalesce(v_spine->'multi_touch_attribution','{}'::jsonb);
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
   'attribution_refresh_reused_from_spine',true,
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
     'nba_version','v5',
     'attribution_refresh_reused',true
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
end
$function$;
;
