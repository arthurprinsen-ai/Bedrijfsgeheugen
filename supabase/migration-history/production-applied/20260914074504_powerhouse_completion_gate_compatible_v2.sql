create or replace function public.powerhouse_enforce_completion()
returns trigger
language plpgsql
as $$
declare s jsonb;
begin
  if new.state='completed' then
    s := public.powerhouse_execution_status(new.run_date);
    if coalesce((s->>'execution_complete')::boolean,false)=false then
      new.state := 'degraded';
      new.completed_at := null;
      new.evidence := coalesce(new.evidence,'{}'::jsonb) || jsonb_build_object('execution_contract','powerhouse-daily-execution-contract-v1','execution_status',s,'completion_blocked_at',now());
    else
      new.evidence := coalesce(new.evidence,'{}'::jsonb) || jsonb_build_object('execution_contract','powerhouse-daily-execution-contract-v1','execution_status',s);
    end if;
  end if;
  return new;
end;
$$;
create or replace function public.powerhouse_daily_execution_guard(p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date))
returns jsonb
language plpgsql
as $$
declare s jsonb; current_state text;
begin
  s := public.powerhouse_execution_status(p_run_date);
  select state into current_state from public.powerhouse_daily_runs where run_date=p_run_date;
  if current_state='completed' and coalesce((s->>'execution_complete')::boolean,false)=false then
    update public.powerhouse_daily_runs set state='degraded', completed_at=null, evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object('execution_contract','powerhouse-daily-execution-contract-v1','execution_status',s,'completion_reconciled_at',now()), updated_at=now() where run_date=p_run_date;
  end if;
  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(now(),'powerhouse-daily-execution-contract','execution-guard',case when coalesce((s->>'execution_complete')::boolean,false) then 'ok' else 'fout' end,case when coalesce((s->>'execution_complete')::boolean,false) then 'dagcyclus heeft beslissingen en delivery-evidence' else 'dagcyclus is niet execution-complete; geen groene status zonder bewijs' end,s);
  return s;
end;
$$;
