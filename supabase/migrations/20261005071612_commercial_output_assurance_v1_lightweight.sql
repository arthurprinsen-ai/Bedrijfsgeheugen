create or replace function public.powerhouse_commercial_output_assurance_v1(p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date))
returns jsonb language plpgsql security invoker set search_path='public','pg_catalog' as $$
declare v_now timestamptz:=now(); v_email int:=0; v_social int:=0; v_decisions int:=0; v_prepare jsonb; v_opt jsonb; v_email_dispatch jsonb; v_li_dispatch jsonb; v_result jsonb;
begin
 select count(*) into v_email from public.powerhouse_sales_actions where lower(channel)='email' and status='done' and (executed_at at time zone 'Europe/Amsterdam')::date=p_run_date;
 select count(*) into v_social from public.powerhouse_sales_actions where lower(channel) in ('linkedin_personal','linkedin_company','linkedin_comment','instagram','linkedin dm') and status='done' and (executed_at at time zone 'Europe/Amsterdam')::date=p_run_date;
 select count(*) into v_decisions from public.powerhouse_sales_actions where (updated_at at time zone 'Europe/Amsterdam')::date=p_run_date and coalesce(evidence#>>'{commercial_closure,decision}','') in ('WAIT','NURTURE','OBSERVE','SUPPRESS');

 if v_email+v_social=0 then
   v_prepare:=public.powerhouse_prepare_autonomous_outreach_v1(p_run_date);
   v_opt:=public.powerhouse_optimize_prepared_outreach_v1(p_run_date);
   v_email_dispatch:=public.powerhouse_dispatch_autonomous_outreach_v1(p_run_date);
   v_li_dispatch:=public.powerhouse_dispatch_linkedin_sales_machine_v1(p_run_date);
 end if;

 select count(*) into v_email from public.powerhouse_sales_actions where lower(channel)='email' and status='done' and (executed_at at time zone 'Europe/Amsterdam')::date=p_run_date;
 select count(*) into v_social from public.powerhouse_sales_actions where lower(channel) in ('linkedin_personal','linkedin_company','linkedin_comment','instagram','linkedin dm') and status='done' and (executed_at at time zone 'Europe/Amsterdam')::date=p_run_date;
 select count(*) into v_decisions from public.powerhouse_sales_actions where (updated_at at time zone 'Europe/Amsterdam')::date=p_run_date and coalesce(evidence#>>'{commercial_closure,decision}','') in ('WAIT','NURTURE','OBSERVE','SUPPRESS');

 v_result:=jsonb_build_object('contract','powerhouse-commercial-output-assurance-v1','run_date',p_run_date,'checked_at',v_now,
 'provider_proven_email',v_email,'provider_proven_social',v_social,'explicit_non_send_decisions',v_decisions,
 'recovery_invoked',v_prepare is not null,'healthy',(v_email+v_social)>0 or v_decisions>0,
 'recovery',jsonb_build_object('prepare_email',v_prepare,'optimize_email',v_opt,'email_dispatch',v_email_dispatch,'linkedin_dispatch',v_li_dispatch),
 'rule','zero provider output triggers same-day canonical channel recovery; zero sends are healthy only with explicit evidence-backed non-send decisions');
 insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens) values(v_now,'powerhouse-commercial-output-assurance','daily-output-sla',
 case when (v_email+v_social)>0 or v_decisions>0 then 'ok' else 'fout' end,
 case when (v_email+v_social)>0 then 'Provider-backed commercial output proven.' when v_decisions>0 then 'Zero-send day explicitly justified by commercial decisions.' else 'Zero-output remains unexplained after channel recovery.' end,v_result);
 return v_result;
end $$;
revoke execute on function public.powerhouse_commercial_output_assurance_v1(date) from public,anon,authenticated;
select cron.schedule('powerhouse-commercial-output-assurance-v1','5,35 7-20 * * *','select public.powerhouse_commercial_output_assurance_v1((now() at time zone ''Europe/Amsterdam'')::date);');
