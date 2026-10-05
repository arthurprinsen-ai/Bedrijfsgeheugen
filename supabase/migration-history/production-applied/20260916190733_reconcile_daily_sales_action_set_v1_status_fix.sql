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
  v_selected int := 0;
  v_demoted int := 0;
  v_reactivated int := 0;
  v_result jsonb;
begin
  v_refresh := public.powerhouse_refresh_linkedin_sales_intelligence_v1(p_run_date);
  if not coalesce((v_refresh->>'healthy')::boolean,false) then
    raise exception 'linkedin sales intelligence refresh failed: %', coalesce(v_refresh->>'error','unknown');
  end if;

  with ranked as (
    select n.opportunity_key,
           row_number() over(order by n.expected_commercial_value_eur desc,n.action_confidence desc,n.buying_window_score desc,n.updated_at desc,n.opportunity_key) rn
    from public.powerhouse_commercial_next_best_action_v2 n
    where n.buying_window_score>=0.30 and n.buying_window_confidence>=0.25
  ), selected as (select opportunity_key from ranked where rn<=20)
  update public.powerhouse_sales_actions psa
     set status='expired',updated_at=now(),
         evidence=coalesce(psa.evidence,'{}'::jsonb)||jsonb_build_object('daily_action_set',jsonb_build_object('contract','powerhouse-daily-action-set-v1','run_date',p_run_date,'state','superseded','reconciled_at',now()))
   where psa.dedupe_key like 'autonomy:'||p_run_date::text||':%'
     and psa.status='suggested'
     and not exists(select 1 from selected s where s.opportunity_key=psa.opportunity_key);
  get diagnostics v_demoted=row_count;

  with ranked as (
    select n.opportunity_key,
           row_number() over(order by n.expected_commercial_value_eur desc,n.action_confidence desc,n.buying_window_score desc,n.updated_at desc,n.opportunity_key) rn
    from public.powerhouse_commercial_next_best_action_v2 n
    where n.buying_window_score>=0.30 and n.buying_window_confidence>=0.25
  ), selected as (select opportunity_key from ranked where rn<=20)
  update public.powerhouse_sales_actions psa
     set status='suggested',updated_at=now(),
         evidence=coalesce(psa.evidence,'{}'::jsonb)||jsonb_build_object('daily_action_set',jsonb_build_object('contract','powerhouse-daily-action-set-v1','run_date',p_run_date,'state','active','reconciled_at',now()))
   where psa.dedupe_key like 'autonomy:'||p_run_date::text||':%'
     and exists(select 1 from selected s where s.opportunity_key=psa.opportunity_key)
     and psa.status='expired';
  get diagnostics v_reactivated=row_count;

  select count(*) into v_selected from public.powerhouse_sales_actions psa
   where psa.dedupe_key like 'autonomy:'||p_run_date::text||':%' and psa.status='suggested';
  if v_selected>20 then raise exception 'daily action set contract violated: % active actions for %',v_selected,p_run_date; end if;

  v_result:=jsonb_build_object('contract','powerhouse-daily-action-set-v1','run_date',p_run_date,'healthy',true,'active_count',v_selected,'demoted_count',v_demoted,'reactivated_count',v_reactivated,'source_refresh',v_refresh);
  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(now(),'powerhouse-daily-action-set','daily-action-reconciliation','ok','Canonical daily action set reconciled to the current top-20 commercial selection.',v_result);
  return v_result;
exception when others then
  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(now(),'powerhouse-daily-action-set','daily-action-reconciliation','fout','Daily action reconciliation failed closed: '||sqlerrm,jsonb_build_object('contract','powerhouse-daily-action-set-v1','run_date',p_run_date,'healthy',false,'sqlstate',sqlstate));
  return jsonb_build_object('contract','powerhouse-daily-action-set-v1','run_date',p_run_date,'healthy',false,'error',sqlerrm,'sqlstate',sqlstate);
end;
$$;
