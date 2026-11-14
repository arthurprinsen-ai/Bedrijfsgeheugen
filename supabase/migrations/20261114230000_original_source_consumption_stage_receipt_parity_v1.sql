-- Original P0 #4198: protected canonical source-to-stage read model. Latest original native production provider identity before this proposed release: 20261114210000 (861/861 source-lock). This file is not applied until independent provider readback. No parallel executor.
-- P0 #4198. Restore the original source-consumption *read model* to the
-- intentionally consolidated commercial schedule. No new job/queue/executor.
-- Preserve existing function identity, grants and caller-facing fields.
create or replace function public.powerhouse_source_consumption_assurance_v1()
returns jsonb
language sql
stable
set search_path to 'pg_catalog', 'public'
as $function$
with e as (
 select total_connections,enriched_today,with_linkedin_activity,with_external_signals,
        with_company_news,avg_data_completeness,last_enrichment_at
 from public.powerhouse_connection_enrichment_coverage_v1
), x as (
 select count(*) external_signals,max(opgehaald_op) external_last_sync,
        count(*) filter(where toegestaan) external_allowed,
        count(*) filter(where not toegestaan) external_rejected
 from public.bg_externe_signalen
), owners as (
 select count(*) filter(where jobname='powerhouse-commercial-learning-v1' and active) as original_116,
        count(*) filter(where jobname='powerhouse-runtime-scheduler-mux-v1' and active) as original_171,
        count(*) filter(where jobname in (
          'powerhouse-commercial-context-daily-v1',
          'powerhouse-commercial-actions-daily-v1') and active) as competing_split_jobs
 from cron.job
), stages as (
 select max(occurred_at) filter(where evidence->>'stage'='powerhouse_refresh_relationship_revenue_v1') as context_at,
        max(occurred_at) filter(where evidence->>'stage'='powerhouse_execute_growth_play_actions_v1') as action_at,
        max(occurred_at) filter(where evidence->>'stage'='powerhouse_commercial_learning_cycle_v1') as learning_at
 from public.powerhouse_runtime_events
 where source='powerhouse-commercial-learning-v1'
   and event_type='commercial_stage_execution'
   and state='actioned'
   and evidence->>'reported_degraded'='false'
   and context->>'canonical_job_id'='116'
   and occurred_at>=now()-interval '26 hours'
)
select jsonb_build_object(
 'contract','powerhouse-source-consumption-assurance-v1',
 'scope','ORIGINAL_SOURCE_TO_EXECUTOR_RECEIPT_ONLY',
 'healthy',coalesce(e.enriched_today=e.total_connections
              and owners.original_116=1 and owners.original_171=1
              and owners.competing_split_jobs=0
              and stages.context_at is not null
              and stages.action_at is not null
              and stages.learning_at is not null,false),
 'connections',jsonb_build_object(
   'total',e.total_connections,'enriched_today',e.enriched_today,
   'with_linkedin_activity',e.with_linkedin_activity,
   'with_external_signals',e.with_external_signals,
   'with_company_news',e.with_company_news,
   'avg_data_completeness',e.avg_data_completeness,
   'last_enrichment_at',e.last_enrichment_at),
 'external_signals',jsonb_build_object(
   'total',x.external_signals,'last_sync',x.external_last_sync,
   'allowed',x.external_allowed,'rejected',x.external_rejected),
 'scheduler',jsonb_build_object(
   'owner','original-commercial-stage-116-and-original-mux-171',
   'commercial_stage_116_active',owners.original_116=1,
   'runtime_mux_171_active',owners.original_171=1,
   'competing_split_jobs_active',owners.competing_split_jobs,
   'commercial_context_daily',stages.context_at is not null,
   'commercial_actions_daily',stages.action_at is not null),
 'original_stage_readbacks',jsonb_build_object(
   'relationship_context_at',stages.context_at,
   'internal_action_stage_at',stages.action_at,
   'internal_learning_stage_at',stages.learning_at,
   'evidence_window_hours',26),
 'provider_delivery','NOT_ASSESSED_BY_THIS_READ_MODEL',
 'original_consumer_ack','NOT_ASSESSED_BY_THIS_READ_MODEL',
 'commercial_outcome','NOT_ASSESSED_BY_THIS_READ_MODEL',
 'next_run_learning_application','NOT_ASSESSED_BY_THIS_READ_MODEL',
 'checked_at',now()
)
from e cross join x cross join owners cross join stages;
$function$;
