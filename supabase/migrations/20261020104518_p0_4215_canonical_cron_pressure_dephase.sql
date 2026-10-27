-- P0 #4215: remove two verified hourly start collisions without stopping any owner.
-- Production inventory 2026-10-20: #46=52 * * * *, #130=12 * * * *.
-- The commercial #116 staged 14-slot schedule and runtime #171 stay untouched.
-- Only cron.alter_job(schedule) is allowed: no unschedule, duplicate job or new sender.
DO $canonical_pressure_dephase$
DECLARE
  r record;
  v_id bigint;
  v_schedule text;
  v_command text;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('powerhouse-revenue-intelligence-snapshot-15m', '52 * * * *', '55 * * * *',
       'powerhouse_refresh_revenue_intelligence_snapshot_v1', 'powerhouse_ensure_commercial_progression_forecasts_v1'),
      ('powerhouse-portal-visual-assurance-sync-v1', '12 * * * *', '45 * * * *',
       'powerhouse-visual-assurance-sync', 'powerhouse_daily_scheduler_token')
    ) AS target(jobname, old_schedule, new_schedule, command_anchor, second_anchor)
  LOOP
    SELECT j.jobid,j.schedule,j.command
      INTO v_id,v_schedule,v_command
    FROM cron.job j
    WHERE j.jobname=r.jobname AND j.active=true;

    -- Preview branches may lack the original runtime cron owners.
    -- Never create replacement owners; production MUST independently verify both.
    IF v_id IS NULL THEN
      RAISE NOTICE 'P0_4215_OWNER_ABSENT_PREVIEW:%',r.jobname;
      CONTINUE;
    END IF;

    IF strpos(v_command,r.command_anchor)=0 OR strpos(v_command,r.second_anchor)=0 THEN
      RAISE EXCEPTION 'P0_4215_CRON_COMMAND_DRIFT:%',r.jobname;
    END IF;
    -- Older no-data schema previews still install the pre-production 15-minute
    -- snapshot. It is not the observed hourly production owner. Preserve that
    -- distinct frequency/configuration rather than silently converting four
    -- runs/hour into one or changing unprofiled preview slots. The production
    -- owner is admitted ONLY on its independently verified hourly schedule.
    IF r.jobname='powerhouse-revenue-intelligence-snapshot-15m'
       AND v_schedule='7,22,37,52 * * * *' THEN
      RAISE NOTICE 'P0_4215_LEGACY_PREVIEW_15M_OWNER_PRESERVED';
      CONTINUE;
    END IF;
    IF v_schedule NOT IN (r.old_schedule,r.new_schedule) THEN
      RAISE EXCEPTION 'P0_4215_CRON_SCHEDULE_DRIFT:%:%',r.jobname,v_schedule;
    END IF;
    IF v_schedule = r.old_schedule THEN
      PERFORM cron.alter_job(job_id=>v_id,schedule=>r.new_schedule);
    END IF;
  END LOOP;
END
$canonical_pressure_dephase$;
