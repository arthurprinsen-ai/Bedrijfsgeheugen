-- Powerhouse €1M Revenue Operating Contract v1
-- Keeps one canonical commercial scheduler and makes it execute the complete acquisition cycle.

create or replace view public.powerhouse_revenue_operating_contract_v1 as
select
  'powerhouse-one-million-revenue-operating-contract-v1'::text as contract,
  1000000::numeric(14,2) as realized_revenue_target_eur,
  365::integer as horizon_days,
  date '2027-09-29' as target_date,
  83333.33::numeric(14,2) as monthly_pace_eur,
  19230.77::numeric(14,2) as weekly_pace_eur,
  3846.15::numeric(14,2) as business_day_pace_eur,
  2900::numeric(14,2) as scan_reference_price_eur,
  345::integer as scan_only_reference_orders_per_year,
  'powerhouse-commercial-learning-v1'::text as scheduler_owner,
  'realized_revenue'::text as north_star,
  false as cold_bulk_autosend,
  true as warm_consented_followup_autonomous;

alter view public.powerhouse_revenue_operating_contract_v1 set (security_invoker = true);
revoke all on public.powerhouse_revenue_operating_contract_v1 from public, anon, authenticated;
grant select on public.powerhouse_revenue_operating_contract_v1 to service_role;

create or replace function public.powerhouse_revenue_operating_state_v1(
  p_now timestamptz default now()
) returns jsonb
language sql
security definer
set search_path = public, pg_catalog
as $$
  with c as (
    select * from public.powerhouse_revenue_operating_contract_v1
  ),
  a as (
    select
      count(*) filter (where status in ('prepared','suggested','waiting') and due_at <= p_now) as due_actions,
      count(*) filter (where status = 'sent' and updated_at::date = (p_now at time zone 'Europe/Amsterdam')::date) as sent_today,
      count(*) filter (where channel = 'email' and status in ('prepared','waiting','sent') and updated_at::date = (p_now at time zone 'Europe/Amsterdam')::date) as email_actions_today,
      count(*) filter (where channel like 'linkedin%' and status in ('suggested','waiting','sent') and updated_at::date = (p_now at time zone 'Europe/Amsterdam')::date) as linkedin_actions_today
    from public.powerhouse_sales_actions
  )
  select jsonb_build_object(
    'contract',c.contract,
    'north_star',c.north_star,
    'target',jsonb_build_object(
      'realized_revenue_eur',c.realized_revenue_target_eur,
      'horizon_days',c.horizon_days,
      'target_date',c.target_date,
      'monthly_pace_eur',c.monthly_pace_eur,
      'weekly_pace_eur',c.weekly_pace_eur,
      'business_day_pace_eur',c.business_day_pace_eur
    ),
    'reference',jsonb_build_object(
      'scan_price_eur',c.scan_reference_price_eur,
      'scan_only_orders_per_year',c.scan_only_reference_orders_per_year,
      'planning_only',true
    ),
    'execution',jsonb_build_object(
      'scheduler_owner',c.scheduler_owner,
      'due_actions',a.due_actions,
      'sent_today',a.sent_today,
      'email_actions_today',a.email_actions_today,
      'linkedin_actions_today',a.linkedin_actions_today,
      'cold_bulk_autosend',c.cold_bulk_autosend,
      'warm_consented_followup_autonomous',c.warm_consented_followup_autonomous
    ),
    'truth_boundary','Target and pace are planning controls. Realized revenue remains observed outcome truth only.'
  )
  from c cross join a;
$$;

revoke execute on function public.powerhouse_revenue_operating_state_v1(timestamptz) from public, anon, authenticated;
grant execute on function public.powerhouse_revenue_operating_state_v1(timestamptz) to service_role;

select cron.unschedule(jobid)
from cron.job
where jobname='powerhouse-commercial-learning-v1';

select cron.schedule(
  'powerhouse-commercial-learning-v1',
  '27 * * * *',
  $$select public.powerhouse_trigger_based_mkb_acquisition_cycle_v1();$$
);

comment on view public.powerhouse_revenue_operating_contract_v1 is
'Canonical €1M/365d revenue target and commercial execution guardrails. Planning target is not observed revenue.';

comment on function public.powerhouse_revenue_operating_state_v1(timestamptz) is
'Operator/runtime readback for the €1M revenue operating contract and due commercial execution state.';
