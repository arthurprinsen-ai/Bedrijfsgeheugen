-- Index the date of the Brain's daily decision, not the older enrichment timestamp.
-- Existing rows retain their review evidence; no provider action is replayed.
set local lock_timeout='2s';
set local statement_timeout='25s';
create index if not exists powerhouse_connection_enrichment_state_review_date_idx
on public.powerhouse_connection_enrichment_state_v1
((source_snapshot #>> '{daily_decision,run_date}'));
