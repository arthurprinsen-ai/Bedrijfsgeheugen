-- Restore truthful same-day commercial action selection.
-- An updated_at heartbeat must never resurrect yesterday's expired action.
-- A due-today candidate remains eligible, with existing quality/pressure/provider gates unchanged.
CREATE OR REPLACE FUNCTION public.powerhouse_reconcile_current_commercial_action_set_v2(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_now timestamptz := now();
  v_active int := 0;
  v_superseded int := 0;
begin
  update public.powerhouse_sales_actions a
     set evidence = coalesce(a.evidence,'{}'::jsonb) || jsonb_build_object(
       'daily_action_set',jsonb_build_object(
         'contract','powerhouse-current-commercial-action-set-v2',
         'run_date',p_run_date,
         'state','superseded',
         'reconciled_at',v_now,
         'selector','nba-v5-external-current-day'
       )
     ),
     updated_at = v_now
   where a.evidence#>>'{daily_action_set,run_date}' = p_run_date::text
     and a.evidence#>>'{daily_action_set,state}' = 'active'
     and not (
       a.evidence#>>'{commercial_intelligence,source_nba}' = 'powerhouse_commercial_next_best_action_v5'
       and lower(replace(coalesce(a.channel,''),' ','_')) in (
         'email','linkedin_personal','linkedin_company','linkedin_comment','instagram','linkedin_dm'
       )
       and (
         (a.created_at at time zone 'Europe/Amsterdam')::date = p_run_date
         or (a.due_at at time zone 'Europe/Amsterdam')::date = p_run_date
         or (coalesce(a.executed_at,a.created_at) at time zone 'Europe/Amsterdam')::date = p_run_date
       )
     );
  get diagnostics v_superseded = row_count;

  with candidates as (
    select a.action_id
    from public.powerhouse_sales_actions a
    where a.evidence#>>'{commercial_intelligence,source_nba}' = 'powerhouse_commercial_next_best_action_v5'
      and lower(replace(coalesce(a.channel,''),' ','_')) in (
        'email','linkedin_personal','linkedin_company','linkedin_comment','instagram','linkedin_dm'
      )
      and a.status in ('suggested','prepared','waiting','done')
      and (
        (a.created_at at time zone 'Europe/Amsterdam')::date = p_run_date
        or (a.due_at at time zone 'Europe/Amsterdam')::date = p_run_date
        or (coalesce(a.executed_at,a.created_at) at time zone 'Europe/Amsterdam')::date = p_run_date
      )
    order by a.priority desc nulls last,a.updated_at desc,a.action_id
    limit 20
  )
  update public.powerhouse_sales_actions a
     set evidence = coalesce(a.evidence,'{}'::jsonb) || jsonb_build_object(
       'daily_action_set',jsonb_build_object(
         'contract','powerhouse-current-commercial-action-set-v2',
         'run_date',p_run_date,
         'state','active',
         'reconciled_at',v_now,
         'selector','nba-v5-external-current-day'
       )
     ),
     updated_at = v_now
    from candidates c
   where a.action_id = c.action_id;
  get diagnostics v_active = row_count;

  return jsonb_build_object(
    'contract','powerhouse-current-commercial-action-set-v2',
    'run_date',p_run_date,
    'active_count',v_active,
    'superseded_count',v_superseded,
    'selector','nba-v5-external-current-day',
    'status_mutation',false,
    'executed_at',v_now
  );
end;
$function$


