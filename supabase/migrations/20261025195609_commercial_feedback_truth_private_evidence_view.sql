create schema if not exists internal_reporting;
revoke all on schema internal_reporting from public, anon, authenticated;
create or replace view internal_reporting.commercial_feedback_truth with (security_invoker=true) as
select now() as checked_at,
 (select count(*) from public.bg_externe_signalen) as external_signals_total,
 (select count(*) from public.bg_externe_signalen where opgehaald_op >= now() - interval '7 days') as external_signals_last_7d,
 (select count(*) from public.bg_externe_signalen where toegestaan is true and vertrouwen >= 0.6 and opgehaald_op >= now() - interval '7 days') as eligible_signals_last_7d,
 (select max(opgehaald_op) from public.bg_externe_signalen) as latest_signal_fetch,
 (select count(*) from public.commercial_leads) as private_lead_records,
 (select count(*) from public.growth_outcomes where stage='lead') as growth_lead_events,
 (select count(*) from public.powerhouse_sales_outcomes where outcome_type='not_executed') as not_executed_actions,
 (select count(*) from public.powerhouse_sales_outcomes where outcome_type='execution_completed') as execution_completed_records,
 (select count(*) from public.powerhouse_sales_outcomes where revenue_eur>0) as reported_positive_revenue_records,
 (select coalesce(sum(revenue_eur),0) from public.powerhouse_sales_outcomes where revenue_eur>0) as reported_revenue_eur,
 'UNVERIFIED'::text as independently_verified_revenue_status;
revoke all on internal_reporting.commercial_feedback_truth from public, anon, authenticated;
grant usage on schema internal_reporting to service_role;
grant select on internal_reporting.commercial_feedback_truth to service_role;