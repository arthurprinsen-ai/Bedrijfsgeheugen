# Weekly cron cadence false-positive repaired in original health function (6 November 2026)

Supersedes draft PR #4639. On 6 November 13:57 UTC, `bg-zoekwoordkansen-wekelijks` with schedule `0 6 * * 1` was WARNING despite a successful run on 2 November 06:00 UTC, because `public.bg_gezondheid_meten()` applied 74 hours to non-daily schedules. This is **only** a false health warning; cron success does not establish provider/keyword output.

Current-main guarded migration `supabase/migrations/20261106144500_weekly_cron_health_cadence_original_function_v1.sql` changes just the existing function's case branch; weekly simple numeric day-of-week tolerates 7 days + 2h, while daily 26-hour failures, other nonweekly 74-hour warning, failed/no-run errors and SECURITY DEFINER / search_path / ACL are preserved. No second scheduler or API route.

This replacement PR is intended to establish a new native GitHub PR ↔ Supabase Preview association missing from #4639. The original draft must be closed as superseded when this candidate gains a valid protected preview. If native preview remains unassociated, do NOT bypass or merge. Exact-head Required, CodeQL and Supabase Preview, protected merge, production definition/ACL negative-canary and eventual provider readback are mandatory. Nothing is green yet from candidate source alone.
