
create or replace function public.powerhouse_email_execution_watchdog_v1(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_requeued int := 0;
  v_overdue int := 0;
  v_waiting int := 0;
  v_sent_24h int := 0;
  v_status text;
begin
  update public.powerhouse_sales_actions a
     set status='prepared',
         updated_at=p_now,
         evidence=coalesce(a.evidence,'{}'::jsonb) ||
           jsonb_build_object(
             'email_executor_watchdog',
             jsonb_build_object(
               'contract','powerhouse-email-execution-watchdog-v1',
               'requeued_at',p_now,
               'reason','stale_waiting_without_provider_ack'
             )
           )
   where a.action_type='autonomous_email'
     and lower(a.channel)='email'
     and a.status='waiting'
     and a.updated_at < p_now - interval '20 minutes'
     and not coalesce((a.evidence->>'provider_ack_verified')::boolean,false)
     and not coalesce((a.evidence#>>'{autonomous_outbound,provider_ack_verified}')::boolean,false)
     and not coalesce((a.evidence#>>'{native_gmail_executor,provider_ack_verified}')::boolean,false);
  get diagnostics v_requeued=row_count;

  select count(*) into v_overdue
  from public.powerhouse_sales_actions a
  where a.action_type='autonomous_email'
    and lower(a.channel)='email'
    and a.status='prepared'
    and a.due_at <= p_now - interval '15 minutes';

  select count(*) into v_waiting
  from public.powerhouse_sales_actions a
  where a.action_type='autonomous_email'
    and lower(a.channel)='email'
    and a.status='waiting';

  select count(*) into v_sent_24h
  from public.powerhouse_sales_actions a
  where a.action_type='autonomous_email'
    and lower(a.channel)='email'
    and a.status='done'
    and a.executed_at >= p_now - interval '24 hours'
    and (
      coalesce((a.evidence->>'provider_ack_verified')::boolean,false)
      or coalesce((a.evidence#>>'{autonomous_outbound,provider_ack_verified}')::boolean,false)
      or coalesce((a.evidence#>>'{native_gmail_executor,provider_ack_verified}')::boolean,false)
    );

  v_status := case when v_overdue>0 then 'fout' else 'ok' end;

  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(
    p_now,
    'powerhouse-email-executor',
    'autonomous-email-execution',
    v_status,
    case when v_overdue>0
      then 'Prepared outreach is overdue and requires canonical executor consumption.'
      else 'Autonomous email queue has no overdue prepared actions.'
    end,
    jsonb_build_object(
      'contract','powerhouse-email-execution-watchdog-v1',
      'requeued_stale_waiting',v_requeued,
      'overdue_prepared',v_overdue,
      'waiting',v_waiting,
      'provider_verified_sent_24h',v_sent_24h,
      'checked_at',p_now
    )
  );

  return jsonb_build_object(
    'contract','powerhouse-email-execution-watchdog-v1',
    'healthy',v_overdue=0,
    'requeued_stale_waiting',v_requeued,
    'overdue_prepared',v_overdue,
    'waiting',v_waiting,
    'provider_verified_sent_24h',v_sent_24h,
    'checked_at',p_now
  );
end;
$$;

do $$
begin
  if not exists (
    select 1 from cron.job where jobname='powerhouse-email-execution-watchdog-v1'
  ) then
    perform cron.schedule(
      'powerhouse-email-execution-watchdog-v1',
      '*/10 * * * *',
      'select public.powerhouse_email_execution_watchdog_v1(now());'
    );
  end if;
end $$;
