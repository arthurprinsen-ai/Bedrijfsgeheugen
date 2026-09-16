create or replace function public.powerhouse_enforce_completion()
returns trigger
language plpgsql
as $$
declare s jsonb;
begin
  if new.state='completed' then
    s := public.powerhouse_execution_status(new.run_date);
    if coalesce((s->>'execution_complete')::boolean,false)=false then
      new.state := 'needs_execution';
      new.completed_at := null;
      new.evidence := coalesce(new.evidence,'{}'::jsonb) || jsonb_build_object('execution_contract','powerhouse-daily-execution-contract-v1','execution_status',s,'completion_blocked_at',now());
    else
      new.evidence := coalesce(new.evidence,'{}'::jsonb) || jsonb_build_object('execution_contract','powerhouse-daily-execution-contract-v1','execution_status',s);
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_powerhouse_enforce_completion on public.powerhouse_daily_runs;
create trigger trg_powerhouse_enforce_completion before insert or update of state on public.powerhouse_daily_runs for each row execute function public.powerhouse_enforce_completion();
