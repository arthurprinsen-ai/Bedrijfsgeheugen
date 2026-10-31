# Original Powerhouse publication actions: calendar synchronization must not erase ONE BRAIN recovery

**31 October 2026 · original P0:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Original source failure proven
At 13:24:26 UTC, the original exclusive `powerhouse-content-loop` restored four typed publication recovery instructions in `content_publication_obligations.next_action`: `handoffWriteback={planned:4,applied:4,conflicts:0,errors:0}`. At 13:29:28 UTC, a second original normal loop **again applied 4**, despite no new provider IDs or changed recovery causes. Production SQL reveals why: `public.sync_content_publication_obligations` invoked by `powerhouse_reconcile_content_outcomes_v1` used `ON CONFLICT DO UPDATE next_action=excluded.next_action` whenever the current status was `PLANNED` (state_rank<=10), which reverted the owner's specific action to "Genereer/publiceer". This defeats learning and causes repeated unnecessary database writes.

## Permanent original-authority correction
Replace **only** `public.sync_content_publication_obligations(date,date)` via tracked `supabase/migrations/20261031133000_publication_sync_preserve_recovery_handoff_v1.sql`. On missing obligations, insert the same canonical PLANNED row, experiment, content kind and initial default. On existing rows, update `experiment_id/content_kind` only if values actually change; never modify existing `next_action`, any provider status, provider ID, content proof or authorization. Preserve the original SECURITY DEFINER, search_path, function signature and existing execute permissions. The original exclusive `powerhouse-content-loop` remains the **sole authoritative writer** of typed recovery via its existing exact-old-text/status/no-provider-ID CAS.

The private original ONE BRAIN guard and portal show counts from that same authenticated source: planned/applied/conflicts/errors. A repeat run with unchanged sources must now have **applied=0**, and an independently checked SQL row's `next_action` and `updated_at` must be stable. This is a technical prevention measurement, not a successful post. Never turn RED/RECOVERY_DUE green until actual external provider ID, public blog URL and independent proof exist. No second executor/scheduler, external provider account override, auto OpenAI credit purchase, unauthorized email, rollback of identity or dedupe gates.

## Gate and independent verification
Regression: `tests/brain-publication-sync-no-rewrite-churn-20261031.test.mjs` plus existing original no-stalled-delivery and CAS tests, Required/Backend/Automation/Portal/CodeQL/System Map, protected merge; apply tracked migration only after protected merge, validate pg_get_functiondef + original ACL and call `sync` twice to show 0 updates/no mutation; read back next ordinary original Heartbeat result and updated `handoffWriteback`. Verify native Netlify deploy SHA for portal count display. If any test fails, preserve original status and report blocker; do not claim live.

## Protected integration continuity

The initial recovery candidate #5229 was closed on a stale base after a different protected portal status-truth release (#5228). This same single-writer remediation was rebased from exact protected `main` `b39a10638f643d8426044f7afb6db53989fd3be9` in PR #5231. The portaal status-tone classification, prior original Brain/Heartbeat lease and other agent rules are preserved. Only the calendar source reset, genuine original handoff counters, regression, machine learning and documentation are added; no direct database patch before protected merge.
