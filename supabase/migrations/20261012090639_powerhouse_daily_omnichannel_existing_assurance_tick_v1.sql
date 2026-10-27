-- Mirrors deployed 2026-10-12 production control; no duplicate scheduler or outbound executor.
CREATE OR REPLACE FUNCTION public.powerhouse_daily_omnichannel_assurance_v1(p_now timestamp with time zone DEFAULT now())
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_day date := (p_now at time zone 'Europe/Amsterdam')::date;
  v_total integer := 0;
  v_enriched integer := 0;
  v_reviewed integer := 0;
  v_followup_review integer := 0;
  v_signal_review integer := 0;
  v_pub_total integer := 0;
  v_pub_proven integer := 0;
  v_pub_open jsonb := '[]'::jsonb;
  v_approved_email integer := 0;
  v_prepared_email integer := 0;
  v_due_dm integer := 0;
  v_dm_capability text := 'UNKNOWN';
  v_dm_checked timestamptz;
  v_failed_cron integer := 0;
  v_revenue numeric := 0;
  v_recovery jsonb := '{}'::jsonb;
  v_problems jsonb := '[]'::jsonb;
  v_result jsonb;
  v_good boolean;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('powerhouse-daily-omnichannel-assurance-v1',0)) then
    return jsonb_build_object('contract','powerhouse-daily-omnichannel-assurance-v1','state','SKIPPED_OVERLAP','ok',true);
  end if;

  select count(*)::integer,
         count(*) filter(where c.email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$'
           and c.extra->>'human_approved'='true')::integer
    into v_total,v_approved_email
  from public.bg_connecties c
  where coalesce(nullif(btrim(c.sleutel),''),nullif(btrim(c.linkedin_url),'')) is not null;

  select count(*) filter(where s.enrichment_date=v_day)::integer,
         count(*) filter(where s.source_snapshot#>>'{daily_decision,run_date}'=v_day::text)::integer,
         count(*) filter(where s.source_snapshot#>>'{daily_decision,run_date}'=v_day::text
                  and s.source_snapshot#>>'{daily_decision,result}'='FOLLOWUP_REVIEW')::integer,
         count(*) filter(where s.source_snapshot#>>'{daily_decision,run_date}'=v_day::text
                  and s.source_snapshot#>>'{daily_decision,result}' in ('COMPANY_SIGNAL_REVIEW','EXTERNAL_SIGNAL_REVIEW','LINKEDIN_ENGAGEMENT_REVIEW'))::integer
    into v_enriched,v_reviewed,v_followup_review,v_signal_review
  from public.powerhouse_connection_enrichment_state_v1 s;

  -- Bounded self-repair: the existing enrichment owner performs at most one safe batch.
  -- This never grants outreach permission or contacts a provider directly.
  if v_enriched < v_total or v_reviewed < v_total then
    begin
      v_recovery := public.powerhouse_connection_daily_pulse_v1(v_day,500);
    exception when others then
      v_recovery := jsonb_build_object('state','FAILED','sqlstate',sqlstate,'reason',left(sqlerrm,200));
    end;
    v_problems := v_problems || jsonb_build_array(jsonb_build_object(
      'lane','connection_enrichment','gap','COVERAGE_INCOMPLETE',
      'remaining',greatest(0,v_total-least(v_enriched,v_reviewed)),
      'repair_owner','powerhouse_connection_daily_pulse_v1',
      'repair_receipt',v_recovery
    ));
  end if;

  select count(*)::integer,
         count(*) filter(where p.status in ('LIVE_PROVEN','MEASURED','LEARNED')
               and p.live_proven_at is not null)::integer,
         coalesce(jsonb_agg(jsonb_build_object(
              'channel',p.channel,'state',p.status,
              'next_action',p.next_action,'external_id',p.external_id
         )) filter(where not (p.status in ('LIVE_PROVEN','MEASURED','LEARNED')
               and p.live_proven_at is not null)),'[]'::jsonb)
    into v_pub_total,v_pub_proven,v_pub_open
  from public.content_publication_obligations p
  where p.tenant_id='canonical' and p.publication_date=v_day;

  if v_pub_total<4 or v_pub_proven<4 then
    v_problems := v_problems||jsonb_build_array(jsonb_build_object(
      'lane','publications','gap','EXTERNAL_PROOF_INCOMPLETE','expected_channels',4,
      'observed_channels',v_pub_total,'provider_proven',v_pub_proven,
      'unproven',v_pub_open,
      'repair_owner','existing_independent_channel_pipelines',
      'side_effect_rule','NEVER_REPUBLISH_WITH_EXISTING_PROVIDER_ID'
    ));
  end if;

  select count(*) filter(where a.channel='email' and a.action_type='autonomous_email'
              and a.status='prepared' and a.due_at<=p_now)::integer,
         count(*) filter(where a.channel='linkedin_dm' and a.status in ('prepared','ready')
              and a.due_at<=p_now)::integer
    into v_prepared_email,v_due_dm
  from public.powerhouse_sales_actions a;

  if v_approved_email=0 or v_prepared_email=0 then
    v_problems:=v_problems||jsonb_build_array(jsonb_build_object(
      'lane','gmail_commercial','gap','NO_VERIFIED_SEND_ELIGIBLE_RECIPIENT',
      'human_approved_contact_emails',v_approved_email,
      'prepared_due_actions',v_prepared_email,
      'repair_owner','canonical_commercial_permission_and_next_best_action',
      'policy','NO_MASS_APPROVAL_NO_UNSOLICITED_AUTO_SEND'
    ));
  end if;

  select c.status,c.checked_at into v_dm_capability,v_dm_checked
  from public.powerhouse_channel_capabilities_v1 c
  where c.capability_key='salesrobot.linkedin_dm'
  order by c.checked_at desc limit 1;

  if coalesce(v_dm_capability,'UNKNOWN')<>'AVAILABLE' then
    v_problems:=v_problems||jsonb_build_array(jsonb_build_object(
      'lane','linkedin_dm','gap','RECIPIENT_AND_PROVIDER_PROOF_REQUIRED',
      'provider_status',coalesce(v_dm_capability,'UNKNOWN'),
      'last_provider_check',v_dm_checked,
      'due_prepared_actions',v_due_dm,
      'repair_owner','existing_salesrobot_channel_with_independent_readback',
      'policy','NO_RESEND_ON_AMBIGUOUS_PROVIDER_OUTCOME'
    ));
  end if;

  select count(*)::integer into v_failed_cron
  from cron.job_run_details d
  join cron.job j on j.jobid=d.jobid
  where d.start_time>p_now-interval '24 hours'
    and d.status='failed'
    and j.jobname in ('powerhouse-revenue-intelligence-snapshot-15m',
                      'powerhouse-commercial-learning-v1',
                      'bg-content-publication-daily-assert');

  select coalesce(sum(o.revenue_eur),0) into v_revenue
  from public.powerhouse_sales_outcomes o
  where (o.occurred_at at time zone 'Europe/Amsterdam')::date=v_day;

  v_good := v_enriched>=v_total and v_reviewed>=v_total
          and v_pub_total>=4 and v_pub_proven>=4
          and v_dm_capability='AVAILABLE' and v_approved_email>0
          and v_prepared_email>0;

  v_result:=jsonb_build_object(
    'contract','powerhouse-daily-omnichannel-assurance-v1',
    'run_date',v_day,'observed_at',p_now,'operational_proof_complete',v_good,
    'enrichment',jsonb_build_object('total',v_total,'enriched_today',v_enriched,
       'reviewed_today',v_reviewed,'followup_review',v_followup_review,
       'signal_review',v_signal_review,'repair',v_recovery),
    'publication',jsonb_build_object('expected',4,'tracked',v_pub_total,'provider_proven',v_pub_proven),
    'commercial',jsonb_build_object('email_approved',v_approved_email,
       'due_prepared_email',v_prepared_email,'due_prepared_dm',v_due_dm,
       'dm_capability',coalesce(v_dm_capability,'UNKNOWN'),
       'realized_revenue_eur_today',v_revenue,
       'revenue_not_guaranteed_by_technical_health',true),
    'cron_failures_24h',v_failed_cron,
    'open_gaps',v_problems,
    'followup_authority','canonical_Brain_NBA_existing_outreach_authority',
    'no_parallel_executor',true,'no_fabricated_delivery_or_revenue',true
  );

  insert into public.powerhouse_runtime_events(
      dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,
      state,data_quality,confidence,updated_at
  ) values (
    'daily-omnichannel-assurance:'||v_day::text||':'||to_char(p_now at time zone 'UTC','HH24'),
    'daily_omnichannel_assurance',
    'powerhouse-autonomous-outreach-assurance-hourly-v1',
    'canonical',p_now,v_result,
    jsonb_build_object('run_date',v_day,'existing_state_first',true),
    case when v_good then 'actioned' else 'observed' end,
    case when v_good then 'VERIFIED' else 'PARTIAL' end,
    case when v_good then 1 else 0.7 end,p_now
  )
  on conflict(dedupe_key) do update set
    evidence=excluded.evidence,context=excluded.context,
    state=excluded.state,data_quality=excluded.data_quality,
    confidence=excluded.confidence,updated_at=excluded.updated_at;

  return v_result;
end;
$function$;

revoke all on function public.powerhouse_daily_omnichannel_assurance_v1(timestamptz) from public,anon,authenticated;
grant execute on function public.powerhouse_daily_omnichannel_assurance_v1(timestamptz) to postgres,service_role;

select cron.schedule('powerhouse-autonomous-outreach-assurance-hourly-v1','52 * * * *',$cron$

  select public.powerhouse_refresh_autonomous_outreach_assurance_v1(now());
  select * from public.powerhouse_refresh_loop_assurance_v1(now()) where out_loop_key='autonomous-outreach';
  select public.powerhouse_daily_omnichannel_assurance_v1(now());
  
$cron$);
