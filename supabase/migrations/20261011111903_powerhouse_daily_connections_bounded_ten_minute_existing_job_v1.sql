DO $identity_owner_guard$
DECLARE v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job
  WHERE jobname = 'powerhouse-identity-graph-v1';
  IF NOT FOUND THEN
    -- Preview migrations do not inherit production-only cron owners.
    -- Never create a second identity executor or schedule its runtime.
    IF EXISTS (SELECT 1 FROM cron.job
               WHERE jobname LIKE 'powerhouse-identity-graph%') THEN
      RAISE EXCEPTION 'CANONICAL_IDENTITY_EXECUTOR_IDENTITY_MISMATCH';
    END IF;
    RAISE NOTICE 'CANONICAL_IDENTITY_EXECUTOR_ABSENT_IN_PREVIEW_NO_OP';
    RETURN;
  END IF;
  PERFORM cron.alter_job(
    job_id := v_jobid,
 schedule := '2,12,22,32,42,52 * * * *',
 command := $job$
do $body$
declare
 v_date date := (now() at time zone 'Europe/Amsterdam')::date;
 v_start timestamptz;
 v_out jsonb;
begin
 if extract(minute from now() at time zone 'UTC')=32 then
   begin perform public.powerhouse_sync_identity_graph_batch_v1(100);
   exception when others then raise warning 'PH_IDENTITY_SYNC_ERROR [%] %',sqlstate,sqlerrm;
   end;
 end if;
 if exists(select 1 from public.powerhouse_connection_enrichment_coverage_v1 where enriched_today<total_connections) then
   begin
     v_start:=clock_timestamp();
     select public.powerhouse_refresh_connection_enrichment_batch_v1(v_date,500) into v_out;
     update public.powerhouse_connection_enrichment_state_v1 s
     set source_snapshot=coalesce(s.source_snapshot,'{}'::jsonb)||
       jsonb_build_object('daily_decision',jsonb_build_object(
         'date',v_date,'decided_at',clock_timestamp(),
         'stage','signal_triage_before_canonical_next_best_action',
         'decision',case
           when s.latest_external_at>=now()-interval '14 days'
             and (s.linkedin_events_30d>0 or s.external_signals_90d>0 or s.company_news_120d>0)
             then 'EVALUATE_IN_CANONICAL_NBA'
           when s.data_completeness<0.6 then 'RESEARCH_IF_COMMERCIAL_PRIORITY'
           else 'NO_NEW_RELEVANT_EVIDENCE' end,
         'automated_outreach_authorized',false,
         'requires_existing_policy_and_provider_evidence',true,
         'source_evidence',jsonb_build_object('linkedin_events_30d',s.linkedin_events_30d,
         'external_signals_90d',s.external_signals_90d,'company_news_120d',s.company_news_120d)
       )),updated_at=clock_timestamp()
     where s.enrichment_date=v_date and s.enriched_at>=v_start;
   exception when others then
     raise warning 'PH_DAILY_ENRICHMENT_BATCH_ERROR [%] %',sqlstate,sqlerrm;
   end;
 end if;
 if extract(minute from now() at time zone 'UTC')=32 then
   begin perform public.powerhouse_commercial_intelligence_heartbeat_v1(v_date);
   exception when others then raise warning 'PH_COMMERCIAL_HEARTBEAT_ERROR [%] %',sqlstate,sqlerrm;
   end;
 end if;
end $body$;
$job$
);
END
$identity_owner_guard$;
