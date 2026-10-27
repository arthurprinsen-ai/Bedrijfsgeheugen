create or replace function public.powerhouse_reconcile_daily_sales_action_set_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_refresh jsonb;
  v_selected_ids uuid[] := array[]::uuid[];
  v_selected int := 0;
  v_total int := 0;
  v_demoted int := 0;
  v_reactivated int := 0;
  v_result jsonb;
begin
  v_refresh := public.powerhouse_refresh_linkedin_sales_intelligence_v1(p_run_date);
  if not coalesce((v_refresh->>'healthy')::boolean,false) then
    raise exception 'linkedin sales intelligence refresh failed: %', coalesce(v_refresh->>'error','unknown');
  end if;

  select coalesce(array_agg(x.action_id order by x.updated_at desc,x.priority desc,x.action_id),array[]::uuid[])
    into v_selected_ids
  from (
    select action_id,updated_at,priority
    from public.powerhouse_sales_actions
    where dedupe_key like 'autonomy:'||p_run_date::text||':%'
    order by updated_at desc,priority desc,action_id
    limit 20
  ) x;

  update public.powerhouse_sales_actions psa
     set status='expired',
         evidence=coalesce(psa.evidence,'{}'::jsonb)||jsonb_build_object('daily_action_set',jsonb_build_object('contract','powerhouse-daily-action-set-v1','run_date',p_run_date,'state','superseded','reconciled_at',now()))
   where psa.dedupe_key like 'autonomy:'||p_run_date::text||':%'
     and psa.status='suggested'
     and not (psa.action_id=any(v_selected_ids));
  get diagnostics v_demoted=row_count;

  update public.powerhouse_sales_actions psa
     set status='suggested',
         evidence=coalesce(psa.evidence,'{}'::jsonb)||jsonb_build_object('daily_action_set',jsonb_build_object('contract','powerhouse-daily-action-set-v1','run_date',p_run_date,'state','active','reconciled_at',now()))
   where psa.action_id=any(v_selected_ids)
     and psa.status='expired';
  get diagnostics v_reactivated=row_count;

  select count(*) into v_selected
  from public.powerhouse_sales_actions psa
  where psa.dedupe_key like 'autonomy:'||p_run_date::text||':%' and psa.status='suggested';
  select count(*) into v_total
  from public.powerhouse_sales_actions psa
  where psa.dedupe_key like 'autonomy:'||p_run_date::text||':%';

  if v_selected<>least(20,v_total) then
    raise exception 'daily action set contract violated: active=% total=% for %',v_selected,v_total,p_run_date;
  end if;

  v_result:=jsonb_build_object('contract','powerhouse-daily-action-set-v1','run_date',p_run_date,'healthy',true,'active_count',v_selected,'total_day_identities',v_total,'demoted_count',v_demoted,'reactivated_count',v_reactivated,'source_refresh',v_refresh);
  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(now(),'powerhouse-daily-action-set','daily-action-reconciliation','ok','Canonical daily action set reconciled to one immutable latest materialized top-20 identity set.',v_result);
  return v_result;
exception when others then
  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(now(),'powerhouse-daily-action-set','daily-action-reconciliation','fout','Daily action reconciliation failed closed: '||sqlerrm,jsonb_build_object('contract','powerhouse-daily-action-set-v1','run_date',p_run_date,'healthy',false,'sqlstate',sqlstate));
  return jsonb_build_object('contract','powerhouse-daily-action-set-v1','run_date',p_run_date,'healthy',false,'error',sqlerrm,'sqlstate',sqlstate);
end;
$$;
