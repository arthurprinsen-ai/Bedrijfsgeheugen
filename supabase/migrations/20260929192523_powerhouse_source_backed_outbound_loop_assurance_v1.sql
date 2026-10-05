-- Source-backed outbound loop assurance integration.
-- Continuously proves the one outbound loop across content + direct outreach channels.

insert into public.powerhouse_loop_assurance_registry_v1
(loop_key,label,runtime_source,cron_jobname,expected_cadence_minutes,critical,evidence_contract)
values (
  'source-backed-outbound',
  'Source-backed outbound loop',
  'source-backed-outbound-v1',
  'powerhouse-outbound-source-lineage-hourly-v1',
  60,
  true,
  '{"authority":"source-backed outbound lineage + channel/direct-outreach outcomes","contract":"powerhouse-source-backed-all-channels-v1"}'::jsonb
)
on conflict (loop_key) do update set
  label=excluded.label,
  runtime_source=excluded.runtime_source,
  cron_jobname=excluded.cron_jobname,
  expected_cadence_minutes=excluded.expected_cadence_minutes,
  critical=excluded.critical,
  evidence_contract=excluded.evidence_contract,
  active=true,
  updated_at=now();

create or replace function public.powerhouse_refresh_source_backed_outbound_assurance_v1(
  p_date date default timezone('Europe/Amsterdam',now())::date
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_refresh jsonb;
  v_source_candidates integer := 0;
  v_decisions integer := 0;
  v_actions integer := 0;
  v_readbacks integer := 0;
  v_outcomes integer := 0;
  v_measurements integer := 0;
  v_learning integer := 0;
  v_guard_pass integer := 0;
  v_now timestamptz := now();
begin
  v_refresh := public.powerhouse_refresh_outbound_source_lineage_v1(p_date);

  select count(*) into v_source_candidates
  from public.powerhouse_content_recommendations
  where run_date between p_date and p_date + 1
    and coalesce((evidence->>'source_backed')::boolean,false)=true;

  select count(*) into v_decisions
  from public.powerhouse_channel_decisions
  where run_date=p_date
    and channel in ('linkedin_personal','linkedin_company','blog','instagram_company');

  select
    (select count(*) from public.powerhouse_channel_decisions
      where run_date=p_date and state in ('content_ready','scheduled','published','measured','learned'))
    +
    (select count(*) from public.powerhouse_sales_actions
      where lower(channel) in ('email','e-mail','linkedin dm','linkedin_dm')
        and executed_at >= v_now-interval '48 hours')
  into v_actions;

  select count(*) into v_readbacks
  from public.powerhouse_outbound_source_lineage_v1
  where run_date between p_date-1 and p_date+1
    and (
      external_ref is not null
      or decision_state in ('published','done','content_ready','measured','learned')
    );

  select
    (select count(*) from public.powerhouse_sales_outcomes where occurred_at >= v_now-interval '48 hours')
    +
    (select count(*) from public.powerhouse_email_reply_events where occurred_at >= v_now-interval '48 hours')
  into v_outcomes;

  select count(*) into v_measurements
  from public.social_metric_snapshots
  where observed_at >= v_now-interval '48 hours';

  select count(*) into v_learning
  from public.powerhouse_outbound_source_lineage_v1
  where updated_at >= v_now-interval '2 hours'
    and learning_evidence <> '{}'::jsonb;

  select count(*) into v_guard_pass
  from public.powerhouse_sales_actions
  where lower(channel) in ('email','e-mail','linkedin dm','linkedin_dm')
    and created_at >= v_now-interval '7 days'
    and evidence->>'source_gate'='PASS';

  perform public.powerhouse_record_loop_stage_v1(
    'source-backed-outbound','input',
    jsonb_build_object('source_backed_candidates',v_source_candidates,'run_date',p_date,'contract','powerhouse-source-backed-all-channels-v1'),
    v_now
  );
  perform public.powerhouse_record_loop_stage_v1(
    'source-backed-outbound','decision',
    jsonb_build_object('channel_decisions',v_decisions,'lineage_refresh',v_refresh),
    v_now
  );
  perform public.powerhouse_record_loop_stage_v1(
    'source-backed-outbound','action',
    jsonb_build_object('observed_actions',v_actions,'channels',jsonb_build_array('instagram_company','linkedin_personal','linkedin_company','blog','email','linkedin_dm')),
    v_now
  );
  perform public.powerhouse_record_loop_stage_v1(
    'source-backed-outbound','readback',
    jsonb_build_object('provider_or_terminal_readbacks',v_readbacks),
    v_now
  );
  perform public.powerhouse_record_loop_stage_v1(
    'source-backed-outbound','outcome',
    jsonb_build_object('direct_replies_and_sales_outcomes',v_outcomes),
    v_now
  );
  perform public.powerhouse_record_loop_stage_v1(
    'source-backed-outbound','measurement',
    jsonb_build_object('social_metric_snapshots_48h',v_measurements,'direct_outcomes_48h',v_outcomes),
    v_now
  );
  perform public.powerhouse_record_loop_stage_v1(
    'source-backed-outbound','learning',
    jsonb_build_object('lineages_with_learning_evidence_2h',v_learning),
    v_now
  );
  perform public.powerhouse_record_loop_stage_v1(
    'source-backed-outbound','guard',
    jsonb_build_object('direct_outreach_source_gate_pass_7d',v_guard_pass,'static_calendar_fallback_only',true,'identity_truth_gates_preserved',true),
    v_now
  );

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,created_at,updated_at
  ) values (
    'source-backed-outbound:'||to_char(date_trunc('hour',v_now),'YYYYMMDDHH24'),
    'source_backed_outbound_refresh',
    'source-backed-outbound-v1',
    p_date::text,
    'cross_channel',
    v_now,
    jsonb_build_object(
      'source_candidates',v_source_candidates,'decisions',v_decisions,'actions',v_actions,
      'readbacks',v_readbacks,'outcomes',v_outcomes,'measurements',v_measurements,
      'learning',v_learning,'guard_pass',v_guard_pass
    ),
    jsonb_build_object('contract','powerhouse-source-backed-all-channels-v1'),
    'closed',
    v_now,v_now
  )
  on conflict (dedupe_key) do update set
    occurred_at=excluded.occurred_at,
    evidence=excluded.evidence,
    context=excluded.context,
    state=excluded.state,
    updated_at=excluded.updated_at;

  return jsonb_build_object(
    'ok',true,'contract','powerhouse-source-backed-all-channels-v1','run_date',p_date,
    'source_candidates',v_source_candidates,'decisions',v_decisions,'actions',v_actions,
    'readbacks',v_readbacks,'outcomes',v_outcomes,'measurements',v_measurements,
    'learning',v_learning,'guard_pass',v_guard_pass,'lineage_refresh',v_refresh
  );
end $$;

revoke execute on function public.powerhouse_refresh_source_backed_outbound_assurance_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_refresh_source_backed_outbound_assurance_v1(date) to service_role;

do $$
declare v_jobid bigint;
begin
  select jobid into v_jobid from cron.job where jobname='powerhouse-outbound-source-lineage-hourly-v1' limit 1;
  if v_jobid is not null then perform cron.unschedule(v_jobid); end if;
  perform cron.schedule(
    'powerhouse-outbound-source-lineage-hourly-v1',
    '47 * * * *',
    $c$select public.powerhouse_refresh_source_backed_outbound_assurance_v1(timezone('Europe/Amsterdam',now())::date);$c$
  );
end $$;

select public.powerhouse_refresh_source_backed_outbound_assurance_v1(timezone('Europe/Amsterdam',now())::date);
select * from public.powerhouse_refresh_loop_assurance_v1(now()) where out_loop_key='source-backed-outbound';
