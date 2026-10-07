
create or replace function public.powerhouse_backfill_autonomous_email_economics_v1(p_now timestamptz default now())
returns integer
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare r record; v_count integer:=0;
begin
  for r in
    select a.action_id,a.executed_at,a.evidence
    from public.powerhouse_sales_actions a
    where a.status='done'
      and a.executed_at is not null
      and a.action_type='autonomous_email'
      and a.channel='email'
      and coalesce((a.evidence->>'provider_ack_verified')::boolean,false)=true
      and (
        coalesce((a.evidence->'autonomous_outbound'->>'provider_ack_verified')::boolean,false)=true
        or coalesce((a.evidence->'native_gmail_executor'->>'provider_ack_verified')::boolean,false)=true
      )
      and not exists(select 1 from public.powerhouse_action_economics e where e.action_id=a.action_id)
  loop
    perform public.powerhouse_record_action_economics_v1(
      'economics:'||r.action_id::text,
      r.action_id,
      null,
      null,
      0,
      jsonb_build_object(
        'contract','powerhouse-autonomous-email-economics-v1',
        'human_minutes',0,
        'human_minutes_basis','provider-verified autonomous outbound path',
        'provider_cost_eur','UNOBSERVED',
        'external_cost_eur','UNOBSERVED',
        'provider_ack_verified',true,
        'no_zero_cost_claim',true,
        'truth_boundary','zero human minutes does not imply zero provider or external monetary cost; unknown costs remain unknown',
        'recorded_at',p_now
      ),
      r.executed_at
    );
    v_count:=v_count+1;
  end loop;
  return v_count;
end;
$$;

create or replace function public.powerhouse_runtime_scheduler_mux_v3(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare v jsonb; v_email integer:=0;
begin
  v:=public.powerhouse_runtime_scheduler_mux_v2(p_now);
  if extract(minute from p_now)::integer=38 then
    v_email:=public.powerhouse_backfill_autonomous_email_economics_v1(p_now);
  end if;
  return coalesce(v,'{}'::jsonb)||jsonb_build_object(
    'contract','powerhouse-runtime-scheduler-mux-v4',
    'autonomous_email_economics_backfilled',v_email,
    'executed_at',p_now
  );
end;
$$;

do $$
begin
  if exists(select 1 from cron.job where jobname='powerhouse-runtime-scheduler-mux-v1') then
    perform cron.unschedule('powerhouse-runtime-scheduler-mux-v1');
  end if;
  perform cron.schedule(
    'powerhouse-runtime-scheduler-mux-v1',
    '1,3,4,6,8,9,11,13,14,16,18,19,21,23,24,26,28,29,31,33,34,36,38,39,41,43,44,46,48,49,51,53,54,56,58,59 * * * *',
    'select public.powerhouse_runtime_scheduler_mux_v3(now());'
  );
end $$;

select public.powerhouse_backfill_autonomous_email_economics_v1(now());
