-- Production migration identity 20261007091140 was created during emergency
-- heartbeat recovery while the canonical external scheduler deployment was blocked.
-- The production effect temporarily restored legacy pg_cron. Repository replay must
-- converge to the intended post-cutover state instead: external Netlify -> Supabase
-- Edge owns the heartbeat and legacy pg_cron stays retired.
--
-- This migration exists to restore exact remote/local migration-ledger identity.
-- It is deliberately idempotent and safe on fresh or already-converged environments.

do $block$
declare
  r record;
begin
  for r in
    select jobid
    from cron.job
    where jobname='powerhouse-one-commercial-heartbeat-v1'
       or command ilike '%powerhouse_commercial_heartbeat_v1%'
  loop
    perform cron.unschedule(r.jobid);
  end loop;
end
$block$;

comment on function public.powerhouse_commercial_heartbeat_v1(timestamptz) is
  'Canonical heartbeat function. Scheduler authority after 2026-10-07 cutover is the authenticated external Netlify -> Supabase Edge runner; legacy pg_cron remains retired.';
