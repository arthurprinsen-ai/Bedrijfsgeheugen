-- powerhouse-autonomous-outreach-loop-assurance-v1
-- Projects existing source-bound Gmail execution/reply/outcome evidence into continuous Loop Assurance.

create or replace function public.powerhouse_refresh_autonomous_outreach_assurance_v1(
  p_now timestamptz default now()
) returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  v_inputs integer:=0;
  v_decisions integer:=0;
  v_sent integer:=0;
  v_readbacks integer:=0;
  v_outcomes integer:=0;
  v_replies integer:=0;
  v_learning integer:=0;
  v_guard_fail integer:=0;
begin
  select count(*) into v_inputs
  from public.powerhouse_sales_actions a
  where lower(a.channel) in ('email','e-mail')
    and a.created_at >= p_now-interval '48 hours'
    and (
      coalesce(nullif(a.source_url,''),nullif(a.opportunity_key,''),nullif(a.subject_key,'')) is not null
      or coalesce(a.evidence,'{}'::jsonb) ?| array['source_lineage','source_ref','predictive_signal_id']
    )
    and (coalesce(a.person_key,'')<>'' or coalesce(a.company_key,'')<>'');

  select count(*) into v_decisions
  from public.powerhouse_sales_actions a
  where lower(a.channel) in ('email','e-mail')
    and a.created_at >= p_now-interval '48 hours'
    and a.status in ('prepared','waiting','done','skipped','expired')
    and (
      coalesce(nullif(a.source_url,''),nullif(a.opportunity_key,''),nullif(a.subject_key,'')) is not null
      or coalesce(a.evidence,'{}'::jsonb) ?| array['source_lineage','source_ref','predictive_signal_id']
    );

  select count(*) into v_sent
  from public.powerhouse_sales_actions a
  where lower(a.channel) in ('email','e-mail')
    and a.status='done'
    and a.executed_at >= p_now-interval '48 hours';

  select count(*) into v_readbacks
  from public.powerhouse_sales_actions a
  where lower(a.channel) in ('email','e-mail')
    and a.status='done'
    and a.executed_at >= p_now-interval '48 hours'
    and (
      coalesce((a.evidence#>>'{autonomous_outbound,provider_ack_verified}')::boolean,false)=true
      or coalesce((a.evidence->>'provider_ack_verified')::boolean,false)=true
    );

  select count(*) into v_outcomes
  from public.powerhouse_sales_outcomes o
  where lower(coalesce(o.channel,''))='email'
    and o.occurred_at >= p_now-interval '48 hours';

  select count(*) into v_replies
  from public.powerhouse_email_reply_events e
  where e.occurred_at >= p_now-interval '48 hours';

  select count(*) into v_learning
  from public.powerhouse_outbound_source_lineage_v1 l
  where l.channel='email'
    and l.updated_at >= p_now-interval '2 hours'
    and l.learning_evidence <> '{}'::jsonb;

  select count(*) into v_guard_fail
  from public.powerhouse_sales_actions a
  where lower(a.channel) in ('email','e-mail')
    and a.status in ('suggested','prepared','waiting','queued','ready')
    and (
      (
        coalesce(nullif(a.source_url,''),nullif(a.opportunity_key,''),nullif(a.subject_key,'')) is null
        and not (coalesce(a.evidence,'{}'::jsonb) ?| array['source_lineage','source_ref','predictive_signal_id'])
      )
      or (coalesce(a.person_key,'')='' and coalesce(a.company_key,'')='')
      or a.evidence->>'source_gate'='FAIL'
    );

  if v_inputs>0 then
    perform public.powerhouse_record_loop_stage_v1('autonomous-outreach','input',
      jsonb_build_object('source_bound_email_actions_48h',v_inputs,'contract','powerhouse-source-backed-all-channels-v1'),p_now);
  end if;
  if v_decisions>0 then
    perform public.powerhouse_record_loop_stage_v1('autonomous-outreach','decision',
      jsonb_build_object('eligible_or_terminal_source_bound_decisions_48h',v_decisions),p_now);
  end if;
  if v_sent>0 then
    perform public.powerhouse_record_loop_stage_v1('autonomous-outreach','action',
      jsonb_build_object('sent_actions_48h',v_sent),p_now);
  end if;
  if v_readbacks>0 then
    perform public.powerhouse_record_loop_stage_v1('autonomous-outreach','readback',
      jsonb_build_object('provider_ack_verified_48h',v_readbacks),p_now);
  end if;
  if v_outcomes>0 then
    perform public.powerhouse_record_loop_stage_v1('autonomous-outreach','outcome',
      jsonb_build_object('sales_outcomes_48h',v_outcomes,'replies_48h',v_replies),p_now);
  end if;
  -- Measurement is the execution of outcome/reply reconciliation, even when the observed reply count is zero.
  if v_outcomes>0 or v_sent>0 then
    perform public.powerhouse_record_loop_stage_v1('autonomous-outreach','measurement',
      jsonb_build_object('sent_48h',v_sent,'outcomes_48h',v_outcomes,'replies_48h',v_replies,'zero_reply_is_valid_measurement',true),p_now);
  end if;
  if v_learning>0 then
    perform public.powerhouse_record_loop_stage_v1('autonomous-outreach','learning',
      jsonb_build_object('email_lineages_with_learning_evidence_2h',v_learning),p_now);
  end if;
  if v_guard_fail=0 then
    perform public.powerhouse_record_loop_stage_v1('autonomous-outreach','guard',
      jsonb_build_object('active_source_or_context_gate_failures',v_guard_fail,'fail_closed',true,'duplicate_thread_guard_required',true),p_now);
  end if;

  return jsonb_build_object(
    'ok',true,'inputs',v_inputs,'decisions',v_decisions,'sent',v_sent,'readbacks',v_readbacks,
    'outcomes',v_outcomes,'replies',v_replies,'learning',v_learning,'guard_fail',v_guard_fail
  );
end $$;

revoke execute on function public.powerhouse_refresh_autonomous_outreach_assurance_v1(timestamptz) from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_autonomous_outreach_assurance_v1(timestamptz) to service_role;

do $$
declare jid bigint;
begin
  select jobid into jid from cron.job where jobname='powerhouse-autonomous-outreach-assurance-hourly-v1';
  if jid is not null then perform cron.unschedule(jid); end if;
  perform cron.schedule(
    'powerhouse-autonomous-outreach-assurance-hourly-v1',
    '52 * * * *',
    $c$select public.powerhouse_refresh_autonomous_outreach_assurance_v1(now());
        select * from public.powerhouse_refresh_loop_assurance_v1(now()) where out_loop_key='autonomous-outreach';$c$
  );
end $$;

select public.powerhouse_refresh_autonomous_outreach_assurance_v1(now());
select * from public.powerhouse_refresh_loop_assurance_v1(now()) where out_loop_key='autonomous-outreach';
