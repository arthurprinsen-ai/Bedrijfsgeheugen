-- Powerhouse Structure Hygiene v4 — remove one evidence-proven unused index.
-- Evidence before removal:
-- - growth_events_attribution_idx size ~6.8 MiB
-- - idx_scan = 0 since creation in migration 20260906102835
-- - sibling growth_events indexes show active scans
-- - no current view/function/cron reads growth_events through attribution_root_key
-- Functional data and columns are unchanged; this only removes redundant write/storage overhead.

drop index if exists public.growth_events_attribution_idx;
