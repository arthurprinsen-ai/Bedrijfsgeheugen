create or replace function public.powerhouse_reconcile_social_delivery(p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date))
returns jsonb
language plpgsql
as $function$
declare
  updated_decisions int := 0;
  updated_artifacts int := 0;
begin
  with matched as (
    select d.run_date,d.channel,d.delivery_ref,s.published_at,s.post_id,s.external_post_id
    from public.powerhouse_channel_decisions d
    join public.social_posts s on s.external_post_id=d.delivery_ref
    where d.run_date=p_run_date
      and d.decision='publish'
      and d.channel in ('linkedin_personal','linkedin_company','instagram_company')
      and s.published_at is not null
      and d.state in ('scheduled','content_ready')
  )
  update public.powerhouse_channel_decisions d
     set state='published',
         delivery_evidence=coalesce(d.delivery_evidence,'{}'::jsonb) || jsonb_build_object(
           'provider_readback',jsonb_build_object(
             'provider','buffer',
             'external_post_id',m.external_post_id,
             'social_post_id',m.post_id,
             'published_at',m.published_at,
             'reconciled_at',now()
           )
         ),
         updated_at=now()
    from matched m
   where d.run_date=m.run_date and d.channel=m.channel;
  get diagnostics updated_decisions = row_count;

  update public.powerhouse_content_artifacts a
     set status='published', updated_at=now()
    from public.powerhouse_channel_decisions d
   where a.run_date=p_run_date
     and d.run_date=a.run_date
     and d.channel=a.channel
     and d.state='published'
     and a.status in ('content_ready','scheduled');
  get diagnostics updated_artifacts = row_count;

  return jsonb_build_object('run_date',p_run_date,'updated_decisions',updated_decisions,'updated_artifacts',updated_artifacts);
end
$function$;

create or replace function public.powerhouse_daily_execution_guard(p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date))
returns jsonb
language plpgsql
as $function$
declare s jsonb; p jsonb; r jsonb; current_state text; combined jsonb; all_ok boolean;
begin
  r := public.powerhouse_reconcile_social_delivery(p_run_date);
  s := public.powerhouse_execution_status(p_run_date);
  p := public.powerhouse_predictive_health(p_run_date);
  all_ok := coalesce((s->>'execution_complete')::boolean,false) and coalesce((p->>'healthy')::boolean,false);
  combined := s || jsonb_build_object('predictive',p,'social_reconciliation',r,'execution_complete_with_predictive',all_ok);
  select state into current_state from public.powerhouse_daily_runs where run_date=p_run_date;

  if all_ok and current_state in ('started','degraded') then
    update public.powerhouse_daily_runs
       set state='completed', completed_at=coalesce(completed_at,now()), evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object('execution_contract','powerhouse-daily-execution-contract-v1','predictive_contract','predictive-first-mover-intelligence-v1','execution_status',combined,'completion_confirmed_at',now()), updated_at=now()
     where run_date=p_run_date;
  elsif current_state='completed' and not all_ok then
    update public.powerhouse_daily_runs
       set state='degraded', completed_at=null, evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object('execution_contract','powerhouse-daily-execution-contract-v1','predictive_contract','predictive-first-mover-intelligence-v1','execution_status',combined,'completion_reconciled_at',now()), updated_at=now()
     where run_date=p_run_date;
  end if;

  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(now(),'powerhouse-daily-execution-contract','execution-guard',case when all_ok then 'ok' else 'fout' end,case when all_ok then 'dagcyclus inclusief predictive intelligence en calibration obligations is execution-complete' else 'dagcyclus mist delivery, predictive run of heeft overdue calibration; completed blijft fail-closed' end,combined);
  return combined;
end
$function$;
