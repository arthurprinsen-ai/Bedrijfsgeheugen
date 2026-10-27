
create or replace function public.powerhouse_one_brain_runtime_authority_gate_v1()
returns jsonb
language sql stable security definer
set search_path to 'public','pg_catalog'
as $$
with checks as (
 select
   (select count(*) from cron.job where active and jobname='powerhouse-daily-compound-learning-v1') as learning_owner_jobs,
   (select count(*) from cron.job where active and command ilike '%powerhouse_run_daily_compound_learning_v1%') as learning_producer_calls,
   (select count(*) from cron.job where active and jobname='powerhouse-sales-machine-daily-v6') as sales_v6_jobs,
   (select count(*) from cron.job where active and (
      lower(coalesce(jobname,'')) like '%buffer%' or lower(coalesce(jobname,'')) like '%make%'
    )) as retired_scheduler_jobs,
   (select count(*) from public.powerhouse_sales_actions group by dedupe_key having count(*)>1 limit 1) as duplicate_action_group,
   (select count(*) from public.powerhouse_sales_outcomes group by dedupe_key having count(*)>1 limit 1) as duplicate_outcome_group
)
select jsonb_build_object(
 'contract','powerhouse-one-brain-runtime-authority-gate-v1',
 'healthy',
   learning_owner_jobs=1 and learning_producer_calls=1 and sales_v6_jobs=1
   and retired_scheduler_jobs=0
   and duplicate_action_group is null and duplicate_outcome_group is null,
 'authority',jsonb_build_object(
   'runtime_truth_state_learning','Supabase',
   'repository_contract_code','GitHub',
   'production_execution','Netlify',
   'knowledge_handoff','Notion'
 ),
 'single_owner',jsonb_build_object(
   'compound_learning_jobs',learning_owner_jobs,
   'compound_learning_producer_calls',learning_producer_calls,
   'sales_v6_jobs',sales_v6_jobs
 ),
 'retired_paths',jsonb_build_object(
   'buffer_make_active_supabase_jobs',retired_scheduler_jobs,
   'policy','provenance_or_manual_telemetry_only'
 ),
 'dedupe',jsonb_build_object(
   'duplicate_sales_action_group_present',duplicate_action_group is not null,
   'duplicate_sales_outcome_group_present',duplicate_outcome_group is not null
 ),
 'terminal_rule','runtime green is necessary but not sufficient; GitHub protected merge + exact Netlify production readback + Notion handoff must also agree',
 'checked_at',now()
)
from checks;
$$;
