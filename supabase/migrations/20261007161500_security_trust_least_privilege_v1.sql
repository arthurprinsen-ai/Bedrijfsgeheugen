-- Security Trust least-privilege hardening v1
-- Source-first hardening for privileged internal RPCs and intelligence views.

do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname = any(array[
        'powerhouse_backfill_autonomous_email_economics_v1',
        'powerhouse_backfill_internal_research_economics_v1',
        'powerhouse_backfill_social_learning_applications_v1',
        'powerhouse_capture_notion_projection_observation_v1',
        'powerhouse_commercial_intelligence_actions_stage_v1',
        'powerhouse_commercial_intelligence_context_stage_v1',
        'powerhouse_email_execution_watchdog_v1',
        'powerhouse_email_provider_preflight_dispatch_v1',
        'powerhouse_email_provider_preflight_reconcile_v1',
        'powerhouse_email_reply_followup_v1',
        'powerhouse_linkedin_dm_capability_v1',
        'powerhouse_materialize_source_backed_channel_candidates_v2',
        'powerhouse_mira_lineage_on_learning_v1',
        'powerhouse_mira_lineage_on_metric_v1',
        'powerhouse_mira_lineage_on_social_post_v1',
        'powerhouse_one_brain_runtime_authority_gate_v1',
        'powerhouse_refresh_outbound_learning_v1',
        'powerhouse_refresh_predictive_commercial_brief_cache_v1',
        'powerhouse_refresh_regression_stage_evidence_v1',
        'powerhouse_refresh_seo_assurance_v1',
        'powerhouse_require_source_for_direct_outreach_v1',
        'powerhouse_resolve_company_person_signals_v1',
        'powerhouse_route_linkedin_leadmagnet_comment_v1',
        'powerhouse_run_linkedin_company_platform_publisher_v1',
        'powerhouse_runtime_scheduler_mux_v2',
        'powerhouse_runtime_scheduler_mux_v3',
        'powerhouse_sales_machine_core_v1',
        'powerhouse_sales_message_plan_after_insert_v1'
      ]::text[])
  loop
    execute format('revoke execute on function %s from public, anon, authenticated',r.signature);
    execute format('grant execute on function %s to service_role',r.signature);
  end loop;
end $$;

do $$
declare
  v_name text;
begin
  foreach v_name in array array[
    'powerhouse_predictive_commercial_brief_cache_v1',
    'powerhouse_commercial_memory_v1',
    'powerhouse_company_signal_people_v1',
    'powerhouse_company_signal_resolution_v1',
    'powerhouse_intelligence_fabric_health_v1',
    'powerhouse_intelligence_fabric_v1',
    'powerhouse_predictive_commercial_brief_v1',
    'powerhouse_revenue_learning_provenance_v1',
    'powerhouse_sales_machine_decision_context_v1'
  ]::text[]
  loop
    execute format('revoke select on table public.%I from public, anon, authenticated',v_name);
    execute format('grant select on table public.%I to service_role',v_name);
  end loop;
end $$;

create or replace function public.security_database_posture_v1()
returns jsonb
language plpgsql
security definer
set search_path='public','pg_catalog'
as $$
declare
  v_anon_sd integer:=0;
  v_auth_sd integer:=0;
  v_mutable integer:=0;
  v_rls_no_policy integer:=0;
  v_view_definer integer:=0;
  v_private_view_definer integer:=0;
  v_mat_api integer:=0;
begin
  select count(*) into v_anon_sd
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.prosecdef
    and has_function_privilege('anon',p.oid,'EXECUTE');

  select count(*) into v_auth_sd
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.prosecdef
    and has_function_privilege('authenticated',p.oid,'EXECUTE');

  select count(*) into v_mutable
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.prosecdef
    and coalesce(array_to_string(p.proconfig,','),'') not like '%search_path=%';

  select count(*) into v_rls_no_policy
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind in('r','p') and c.relrowsecurity
    and not exists(select 1 from pg_policy pol where pol.polrelid=c.oid);

  select count(*) into v_view_definer
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='v'
    and not(coalesce(c.reloptions,'{}'::text[]) @> array['security_invoker=true'])
    and (
      has_table_privilege('anon',c.oid,'SELECT')
      or has_table_privilege('authenticated',c.oid,'SELECT')
    );

  select count(*) into v_private_view_definer
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='v'
    and not(coalesce(c.reloptions,'{}'::text[]) @> array['security_invoker=true'])
    and not (
      has_table_privilege('anon',c.oid,'SELECT')
      or has_table_privilege('authenticated',c.oid,'SELECT')
    );

  select count(*) into v_mat_api
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='m'
    and (
      has_table_privilege('anon',c.oid,'SELECT')
      or has_table_privilege('authenticated',c.oid,'SELECT')
    );

  return jsonb_build_object(
    'anonSecurityDefinerFunctions',v_anon_sd,
    'authenticatedSecurityDefinerFunctions',v_auth_sd,
    'securityDefinerMutableSearchPath',v_mutable,
    'rlsNoPolicy',v_rls_no_policy,
    'rlsDenyAllTables',v_rls_no_policy,
    'viewsWithoutSecurityInvoker',v_view_definer,
    'privateViewsWithoutSecurityInvoker',v_private_view_definer,
    'materializedViewsApiReadable',v_mat_api,
    'highRiskCount',v_anon_sd+v_view_definer+v_mat_api,
    'observedAt',now(),
    'truthPolicy','client_exposed_measured_or_evidence_backed_else_unknown'
  );
end $$;

revoke all on function public.security_database_posture_v1() from public,anon,authenticated;
grant execute on function public.security_database_posture_v1() to service_role;

do $$
declare
  v_remaining_rpc integer;
  v_remaining_views integer;
begin
  select count(*) into v_remaining_rpc
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.prosecdef
    and p.proname = any(array[
      'powerhouse_backfill_autonomous_email_economics_v1',
      'powerhouse_backfill_internal_research_economics_v1',
      'powerhouse_backfill_social_learning_applications_v1',
      'powerhouse_capture_notion_projection_observation_v1',
      'powerhouse_commercial_intelligence_actions_stage_v1',
      'powerhouse_commercial_intelligence_context_stage_v1',
      'powerhouse_email_execution_watchdog_v1',
      'powerhouse_email_provider_preflight_dispatch_v1',
      'powerhouse_email_provider_preflight_reconcile_v1',
      'powerhouse_email_reply_followup_v1',
      'powerhouse_linkedin_dm_capability_v1',
      'powerhouse_materialize_source_backed_channel_candidates_v2',
      'powerhouse_mira_lineage_on_learning_v1',
      'powerhouse_mira_lineage_on_metric_v1',
      'powerhouse_mira_lineage_on_social_post_v1',
      'powerhouse_one_brain_runtime_authority_gate_v1',
      'powerhouse_refresh_outbound_learning_v1',
      'powerhouse_refresh_predictive_commercial_brief_cache_v1',
      'powerhouse_refresh_regression_stage_evidence_v1',
      'powerhouse_refresh_seo_assurance_v1',
      'powerhouse_require_source_for_direct_outreach_v1',
      'powerhouse_resolve_company_person_signals_v1',
      'powerhouse_route_linkedin_leadmagnet_comment_v1',
      'powerhouse_run_linkedin_company_platform_publisher_v1',
      'powerhouse_runtime_scheduler_mux_v2',
      'powerhouse_runtime_scheduler_mux_v3',
      'powerhouse_sales_machine_core_v1',
      'powerhouse_sales_message_plan_after_insert_v1'
    ]::text[])
    and (
      has_function_privilege('anon',p.oid,'EXECUTE')
      or has_function_privilege('authenticated',p.oid,'EXECUTE')
    );

  select count(*) into v_remaining_views
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public'
    and c.relname = any(array[
      'powerhouse_predictive_commercial_brief_cache_v1',
      'powerhouse_commercial_memory_v1',
      'powerhouse_company_signal_people_v1',
      'powerhouse_company_signal_resolution_v1',
      'powerhouse_intelligence_fabric_health_v1',
      'powerhouse_intelligence_fabric_v1',
      'powerhouse_predictive_commercial_brief_v1',
      'powerhouse_revenue_learning_provenance_v1',
      'powerhouse_sales_machine_decision_context_v1'
    ]::text[])
    and (
      has_table_privilege('anon',c.oid,'SELECT')
      or has_table_privilege('authenticated',c.oid,'SELECT')
    );

  if v_remaining_rpc<>0 then
    raise exception 'SECURITY_TRUST_RPC_PRIVILEGE_HARDENING_FAILED:%',v_remaining_rpc;
  end if;
  if v_remaining_views<>0 then
    raise exception 'SECURITY_TRUST_VIEW_PRIVILEGE_HARDENING_FAILED:%',v_remaining_views;
  end if;
end $$;

select public.powerhouse_refresh_data_sovereignty_v1();
