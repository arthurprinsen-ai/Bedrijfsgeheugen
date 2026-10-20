-- P0 #4215: apply only the exact approved economics candidate index.
-- Its own bounded transaction cannot roll back the preceding function recovery.
-- Keep every original protected migration identity; no cron or history changes.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '20s';
CREATE INDEX IF NOT EXISTS powerhouse_sales_actions_internal_research_economics_candidates_p04215_idx
  ON public.powerhouse_sales_actions (action_id)
  WHERE status = 'done'
    AND executed_at IS NOT NULL
    AND action_type = 'research_enrichment'
    AND channel = 'internal';
COMMIT;
