-- P0 #4198: write daily source-based triage on each canonical refresh.
-- Existing batch/full refresh overwrote source_snapshot after a separate cron wrote
-- daily_decision. Make one canonical writer maintain the decision atomically.
-- No new sender, cron, inbox, campaign, data retention changes or authorization.
do $patch$
declare v_signature text; v_fn text;
 v_needle text := 'source_snapshot=excluded.source_snapshot,';
 v_replacement text := $replacement$source_snapshot=excluded.source_snapshot || jsonb_build_object(
 'daily_decision',jsonb_build_object(
  'contract','powerhouse-daily-decision-write-through-v1',
  'date',excluded.enrichment_date,
  'decided_at',clock_timestamp(),
  'stage','signal_triage_before_canonical_next_best_action',
  'decision',case
   when excluded.latest_external_at >= now()-interval '14 days'
     and (excluded.linkedin_events_30d > 0 or excluded.external_signals_90d > 0 or excluded.company_news_120d > 0)
     then 'EVALUATE_IN_CANONICAL_NBA'
   when excluded.data_completeness < 0.6 then 'RESEARCH_IF_COMMERCIAL_PRIORITY'
   else 'NO_NEW_RELEVANT_EVIDENCE'
  end,
  'automated_outreach_authorized',false,
  'requires_existing_policy_and_provider_evidence',true
  )),$replacement$;
begin
 foreach v_signature in array array[
 'public.powerhouse_refresh_connection_enrichment_batch_v1(date,integer)',
 'public.powerhouse_refresh_all_connection_enrichment_v1(date,integer)']
 loop
  v_fn:=pg_get_functiondef(v_signature::regprocedure);
  if position('powerhouse-daily-decision-write-through-v1' in v_fn)>0 then
   continue;
  end if;
  if position(v_needle in v_fn)=0 then
   raise exception 'CANONICAL_REFRESH_WRITE_THROUGH_TARGET_NOT_FOUND: %',v_signature;
  end if;
  execute replace(v_fn,v_needle,v_replacement);
 end loop;
end $patch$;
