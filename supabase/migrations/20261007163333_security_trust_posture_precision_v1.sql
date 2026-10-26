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
  v_browser_definer_views integer:=0;
  v_mat_api integer:=0;
begin
  select count(*) into v_anon_sd
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.prosecdef
    and has_function_privilege('anon',p.oid,'EXECUTE');

  select count(*) into v_auth_sd
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.prosecdef
    and has_function_privilege('authenticated',p.oid,'EXECUTE');

  select count(*) into v_mutable
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.prosecdef
    and coalesce(array_to_string(p.proconfig,','),'') not like '%search_path=%';

  select count(*) into v_rls_no_policy
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public'
    and c.relkind in('r','p')
    and c.relrowsecurity
    and not exists(select 1 from pg_policy pol where pol.polrelid=c.oid);

  select count(*) into v_browser_definer_views
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public'
    and c.relkind='v'
    and not(coalesce(c.reloptions,'{}'::text[]) @> array['security_invoker=true'])
    and (
      has_table_privilege('anon',c.oid,'SELECT')
      or has_table_privilege('authenticated',c.oid,'SELECT')
    );

  select count(*) into v_mat_api
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public'
    and c.relkind='m'
    and (
      has_table_privilege('anon',c.oid,'SELECT')
      or has_table_privilege('authenticated',c.oid,'SELECT')
    );

  return jsonb_build_object(
    'anonSecurityDefinerFunctions',v_anon_sd,
    'authenticatedSecurityDefinerFunctions',v_auth_sd,
    'privilegedRpcReviewCount',greatest(v_anon_sd,v_auth_sd),
    'securityDefinerMutableSearchPath',v_mutable,
    'rlsNoPolicy',v_rls_no_policy,
    'viewsWithoutSecurityInvoker',v_browser_definer_views,
    'browserReadableDefinerViews',v_browser_definer_views,
    'materializedViewsApiReadable',v_mat_api,
    'highRiskCount',v_browser_definer_views+v_mat_api,
    'observedAt',now(),
    'truthPolicy','database_catalog_observed_browser_exposure_only'
  );
end $$;

revoke all on function public.security_database_posture_v1() from public,anon,authenticated;
grant execute on function public.security_database_posture_v1() to service_role;

create or replace function public.refresh_security_trust_snapshot_v1(p_tenant_id text)
returns jsonb
language plpgsql
security definer
set search_path='public'
as $$
declare
 v_tenant text:=nullif(trim(p_tenant_id),'');
 v_db jsonb;
 v_assurance jsonb:='[]'::jsonb;
 v_obs jsonb:='[]'::jsonb;
 v_frameworks jsonb:='[]'::jsonb;
 v_findings jsonb:='[]'::jsonb;
 v_summary jsonb;
 v_result jsonb;
 v_high integer:=0;
 v_total integer:=0;
 v_current integer:=0;
begin
 if v_tenant is null then raise exception 'tenant_id is required'; end if;

 v_db:=public.security_database_posture_v1();

 select coalesce(jsonb_agg(jsonb_build_object(
   'providerKey',provider_key,
   'assuranceScope',assurance_scope,
   'evidenceStatus',evidence_status,
   'evidenceUrls',evidence_urls,
   'notes',notes,
   'evidenceCheckedAt',evidence_checked_at
 ) order by provider_key),'[]'::jsonb)
 into v_assurance
 from public.security_provider_assurance_v1
 where customer_visible=true;

 select coalesce(jsonb_agg(jsonb_build_object(
   'frameworkKey',framework_key,
   'label',label,
   'applicability',applicability,
   'notes',notes,
   'evidenceUrls',evidence_urls
 ) order by label),'[]'::jsonb)
 into v_frameworks
 from public.security_framework_registry_v1
 where customer_visible=true;

 select coalesce(jsonb_agg(to_jsonb(x) order by x.provider_key,x.control_key),'[]'::jsonb)
 into v_obs
 from(
   select distinct on(provider_key,control_key)
     provider_key,
     control_key,
     case when expires_at is not null and expires_at<now() then 'STALE' else status end status,
     (evidence<>'{}'::jsonb) as evidence_available,
     source,
     observed_at,
     expires_at,
     observed_by
   from public.security_management_observation_v1
   where tenant_id in(v_tenant,'canonical')
   order by provider_key,control_key,observed_at desc
 )x;

 if coalesce((v_db->>'privilegedRpcReviewCount')::int,0)>0 then
   v_findings:=v_findings||jsonb_build_array(jsonb_build_object(
     'key','DB-PRIVILEGED-RPC-REVIEW',
     'severity','medium',
     'title','Browser-executable privileged RPCs require authorization review',
     'detail',(v_db->>'privilegedRpcReviewCount')||' SECURITY DEFINER-functies zijn browser-executable; dit is een review surface en niet automatisch een bewezen kwetsbaarheid.'
   ));
 end if;

 if coalesce((v_db->>'browserReadableDefinerViews')::int,0)>0 then
   v_findings:=v_findings||jsonb_build_array(jsonb_build_object(
     'key','DB-BROWSER-SECURITY-DEFINER-VIEWS',
     'severity','high',
     'title','Browserleesbare views zonder SECURITY INVOKER',
     'detail',(v_db->>'browserReadableDefinerViews')||' view(s) zijn browserleesbaar en draaien niet aantoonbaar als invoker.'
   ));
 end if;

 if coalesce((v_db->>'materializedViewsApiReadable')::int,0)>0 then
   v_findings:=v_findings||jsonb_build_array(jsonb_build_object(
     'key','DB-MATERIALIZED-API',
     'severity','high',
     'title','Materialized views via API leesbaar',
     'detail',(v_db->>'materializedViewsApiReadable')||' materialized view(s) zijn leesbaar voor anon/authenticated.'
   ));
 end if;

 if coalesce((v_db->>'securityDefinerMutableSearchPath')::int,0)>0 then
   v_findings:=v_findings||jsonb_build_array(jsonb_build_object(
     'key','DB-MUTABLE-SEARCH-PATH',
     'severity','medium',
     'title','Mutable search_path op SECURITY DEFINER',
     'detail',(v_db->>'securityDefinerMutableSearchPath')||' SECURITY DEFINER-functie(s) missen een vaste search_path.'
   ));
 end if;

 if coalesce((v_db->>'rlsNoPolicy')::int,0)>0 then
   v_findings:=v_findings||jsonb_build_array(jsonb_build_object(
     'key','DB-RLS-NO-POLICY',
     'severity','info',
     'title','RLS aan zonder policy',
     'detail',(v_db->>'rlsNoPolicy')||' tabel(len) hebben RLS aan zonder policy; deny-all kan bewust zijn en vereist classificatie.'
   ));
 end if;

 select count(*) into v_total from jsonb_array_elements(v_assurance);
 select count(*) into v_current from jsonb_array_elements(v_obs) o where o->>'status' in('VERIFIED','PASS');
 select count(*) into v_high from jsonb_array_elements(v_findings) f where f->>'severity' in('critical','high');

 v_summary:=jsonb_build_object(
   'postureStatus',case
     when v_high>0 then 'ACTION_REQUIRED'
     when jsonb_array_length(v_findings)>0 then 'EVIDENCE_PARTIAL'
     else 'OBSERVED_NO_HIGH_FINDINGS'
   end,
   'findingCount',jsonb_array_length(v_findings),
   'highRiskFindingCount',v_high,
   'providerAssuranceCount',v_total,
   'currentManagementEvidence',v_current,
   'evidenceCoverage',least(100,round((coalesce(v_current,0)+case when v_high=0 then 4 else 1 end)::numeric/greatest(1,v_total+6)*100)),
   'truthPolicy','measured_or_evidence_backed_else_unknown',
   'providerAssuranceIsOwnCertification',false
 );

 insert into public.security_trust_snapshot_v1(
   tenant_id,database_posture,provider_assurance,management_observations,frameworks,findings,summary,generated_at
 )
 values(v_tenant,v_db,v_assurance,v_obs,v_frameworks,v_findings,v_summary,now())
 on conflict(tenant_id) do update set
   database_posture=excluded.database_posture,
   provider_assurance=excluded.provider_assurance,
   management_observations=excluded.management_observations,
   frameworks=excluded.frameworks,
   findings=excluded.findings,
   summary=excluded.summary,
   generated_at=excluded.generated_at;

 select jsonb_build_object(
   'tenantId',tenant_id,
   'database',database_posture,
   'providerAssurance',provider_assurance,
   'managementObservations',management_observations,
   'frameworks',frameworks,
   'findings',findings,
   'summary',summary,
   'generatedAt',generated_at
 )
 into v_result
 from public.security_trust_snapshot_v1
 where tenant_id=v_tenant;

 return v_result;
end $$;

revoke all on function public.refresh_security_trust_snapshot_v1(text) from public,anon,authenticated;
grant execute on function public.refresh_security_trust_snapshot_v1(text) to service_role;

select public.refresh_security_trust_snapshot_v1('canonical');
