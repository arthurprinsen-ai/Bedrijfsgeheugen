-- Runtime correction from hosted preview execution proof.
-- Supabase installs pgcrypto functions in the extensions schema; keep deterministic search_path.
alter function public.powerhouse_autonomous_improvement_executor_v1(timestamptz,text,bigint)
  set search_path = public, cron, extensions, pg_temp;
