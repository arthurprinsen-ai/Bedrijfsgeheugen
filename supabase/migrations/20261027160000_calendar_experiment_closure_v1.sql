-- Experiment-kalender sluit zichzelf: dagelijkse rci-regels mogen nooit eindeloos PLANNED/ACTIVE blijven.
-- Oorzaak (27 okt 2026): 210 PLANNED en 8 ACTIVE rci-regels zonder meetpunt werden alleen gelezen
-- door powerhouse-runtime daily(), maar nergens afgesloten. Menselijk gepoorte A/B-experimenten
-- (niet-rci, met pagina+meetpunt) blijven bewust buiten dit besluit.
create or replace function public.powerhouse_close_stale_calendar_experiments_v1(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_planned int; v_active int;
begin
  with c as (
    update public.social_experiments
       set status = 'INSUFFICIENT_EVIDENCE', besluit = 'verlopen_zonder_uitvoering',
           besloten_op = p_now, ended_at = p_now, updated_at = p_now
     where experiment_id like 'rci-%' and status = 'PLANNED'
       and calendar_date < (p_now at time zone 'Europe/Amsterdam')::date - 1
    returning 1)
  select count(*) into v_planned from c;
  with c as (
    update public.social_experiments
       set status = 'INSUFFICIENT_EVIDENCE', besluit = 'geen_meetpunt_na_14_dagen',
           besloten_op = p_now, ended_at = p_now, updated_at = p_now
     where experiment_id like 'rci-%' and status = 'ACTIVE' and meetpunt is null
       and coalesce(started_at, created_at) < p_now - interval '14 days'
    returning 1)
  select count(*) into v_active from c;
  return jsonb_build_object('closed_planned', v_planned, 'closed_active', v_active, 'at', p_now);
end $$;
revoke all on function public.powerhouse_close_stale_calendar_experiments_v1(timestamptz) from public, anon, authenticated;
grant execute on function public.powerhouse_close_stale_calendar_experiments_v1(timestamptz) to service_role;

create or replace view public.powerhouse_calendar_experiment_staleness_v1 with (security_invoker = true) as
select count(*) filter (where status = 'PLANNED' and calendar_date < current_date - 1) as stale_planned,
       count(*) filter (where status = 'ACTIVE' and meetpunt is null and coalesce(started_at, created_at) < now() - interval '14 days') as stale_active
  from public.social_experiments where experiment_id like 'rci-%';
revoke all on public.powerhouse_calendar_experiment_staleness_v1 from public, anon, authenticated;
grant select on public.powerhouse_calendar_experiment_staleness_v1 to service_role;

select public.powerhouse_close_stale_calendar_experiments_v1();

do $$ begin
  if exists (select 1 from cron.job where jobname = 'powerhouse-calendar-experiment-closure-daily-v1') then
    perform cron.unschedule('powerhouse-calendar-experiment-closure-daily-v1');
  end if;
  perform cron.schedule('powerhouse-calendar-experiment-closure-daily-v1', '10 4 * * *', 'select public.powerhouse_close_stale_calendar_experiments_v1();');
end $$;
