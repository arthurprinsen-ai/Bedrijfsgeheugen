create or replace function powerhouse_ops.enqueue(p_task text,p_event text,p_payload jsonb default '{}'::jsonb)
returns bigint language plpgsql security invoker set search_path=pg_catalog,powerhouse_ops as $$
declare v_id bigint;
begin
 insert into powerhouse_ops.recovery_queue(task_key,event_key,payload)
 values(p_task,p_event,p_payload)
 on conflict(task_key,event_key) do update set task_key=excluded.task_key
 returning id into v_id;
 return v_id;
end $$;
create or replace function powerhouse_ops.claim(p_limit integer default 10)
returns setof powerhouse_ops.recovery_queue language plpgsql security invoker set search_path=pg_catalog,powerhouse_ops as $$
begin
 return query
 with chosen as (
  select id from powerhouse_ops.recovery_queue
  where (status in ('pending','failed') and next_attempt_at<=now())
     or (status='running' and locked_until<now())
  and attempts<max_attempts
  order by next_attempt_at,id limit least(greatest(p_limit,1),100)
  for update skip locked
 )
 update powerhouse_ops.recovery_queue q set status='running',attempts=q.attempts+1,locked_until=now()+interval '5 minutes'
 from chosen where q.id=chosen.id returning q.*;
end $$;
create or replace function powerhouse_ops.finish(p_id bigint,p_success boolean,p_error text default null)
returns boolean language plpgsql security invoker set search_path=pg_catalog,powerhouse_ops as $$
declare v_n int;
begin
 update powerhouse_ops.recovery_queue
 set status=case when p_success then 'succeeded' when attempts>=max_attempts then 'dead' else 'failed' end,
 locked_until=null,
 last_error=case when p_success then null else left(coalesce(p_error,'unspecified'),1000) end,
 next_attempt_at=case when p_success then next_attempt_at else now()+make_interval(secs => least(3600,30*power(2,least(attempts,7))::int)) end
 where id=p_id and status='running' and locked_until>now();
 get diagnostics v_n=row_count;
 return v_n=1;
end $$;
revoke all on all functions in schema powerhouse_ops from public,anon,authenticated;
