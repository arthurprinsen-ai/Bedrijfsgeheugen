-- Runtime hardening for the canonical content supervisor.

create or replace function public.powerhouse_jsonb_true(p_value jsonb, p_key text)
returns boolean
language sql
immutable
parallel safe
set search_path = public, pg_temp
as $$
  select lower(coalesce(p_value ->> p_key, 'false')) = 'true'
$$;

revoke all on function public.powerhouse_jsonb_true(jsonb,text) from public,anon,authenticated;
grant execute on function public.powerhouse_jsonb_true(jsonb,text) to service_role;

-- Patch legacy evidence casts to be safe even when historical JSON contains malformed strings.
do $patch$
declare
  v_oid oid;
  v_sql text;
  v_name text;
begin
  foreach v_name in array array[
    'powerhouse_reconcile_content_outcomes_v1',
    'powerhouse_linkedin_personal_daily_guard_v1',
    'powerhouse_linkedin_company_daily_guard_v1',
    'powerhouse_instagram_daily_guard_v1'
  ] loop
    select p.oid into v_oid
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' and p.proname=v_name
     order by p.oid desc limit 1;
    if v_oid is null then raise exception 'CONTENT_LOOP_FUNCTION_NOT_FOUND:%',v_name; end if;
    select pg_get_functiondef(v_oid) into v_sql;
    v_sql := replace(v_sql, 'coalesce((r.evidence->>''stale_delivery_ref'')::boolean,false)', 'public.powerhouse_jsonb_true(r.evidence,''stale_delivery_ref'')');
    v_sql := replace(v_sql, 'coalesce((r.evidence->>''personal_truth_verified'')::boolean,false)', 'public.powerhouse_jsonb_true(r.evidence,''personal_truth_verified'')');
    v_sql := replace(v_sql, 'coalesce((r.evidence->>''provider_truth_verified'')::boolean,false)', 'public.powerhouse_jsonb_true(r.evidence,''provider_truth_verified'')');
    v_sql := replace(v_sql, 'coalesce((evidence->>''provider_truth_verified'')::boolean,false)', 'public.powerhouse_jsonb_true(evidence,''provider_truth_verified'')');
    v_sql := replace(v_sql, 'coalesce((evidence->>''exact_final_media_proven'')::boolean,false)', 'public.powerhouse_jsonb_true(evidence,''exact_final_media_proven'')');
    v_sql := replace(v_sql, 'coalesce((v_ob.evidence->>''provider_truth_verified'')::boolean,false)', 'public.powerhouse_jsonb_true(v_ob.evidence,''provider_truth_verified'')');
    execute v_sql;
  end loop;
end
$patch$;

-- One control loop only. Source ingestion, analytics, learning and compliance watchdogs remain separate.
do $cron$
declare
  r record;
begin
  for r in
    select jobid,jobname from cron.job
     where jobname in (
       'powerhouse-content-orchestrator-daily',
       'powerhouse-social-publisher-daytime',
       'bg-buffer-sync-daily',
       'bg-buffer-sync-hourly-daytime',
       'powerhouse-linkedin-company-daily-guard-v1',
       'powerhouse-linkedin-personal-daily-guard-v1',
       'powerhouse-blog-daily-guard-v1',
       'powerhouse-instagram-daily-guard-v1'
     )
  loop
    perform cron.alter_job(r.jobid, active => false);
  end loop;

  if exists(select 1 from cron.job where jobname='powerhouse-content-closed-loop-v1') then
    perform cron.unschedule('powerhouse-content-closed-loop-v1');
  end if;

  perform cron.schedule(
    'powerhouse-content-closed-loop-v1',
    '*/5 * * * *',
    'select public.powerhouse_content_closed_loop_tick_v1();'
  );
end
$cron$;

-- Regression assertions: exactly one content control scheduler is active.
do $verify$
declare
  v_active integer;
  v_old_active integer;
begin
  select count(*) into v_active from cron.job where jobname='powerhouse-content-closed-loop-v1' and active;
  if v_active <> 1 then raise exception 'CANONICAL_CONTENT_LOOP_CRON_NOT_ACTIVE'; end if;

  select count(*) into v_old_active from cron.job
   where active and jobname in (
     'powerhouse-content-orchestrator-daily','powerhouse-social-publisher-daytime','bg-buffer-sync-daily','bg-buffer-sync-hourly-daytime',
     'powerhouse-linkedin-company-daily-guard-v1','powerhouse-linkedin-personal-daily-guard-v1','powerhouse-blog-daily-guard-v1','powerhouse-instagram-daily-guard-v1'
   );
  if v_old_active <> 0 then raise exception 'LEGACY_CONTENT_CONTROL_CRONS_STILL_ACTIVE:%',v_old_active; end if;
end
$verify$;
