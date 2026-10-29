# P0 legacy watchdog: stale GitHub ledger must not substitute an older blog date

After protected PR #5089 converted the existing legacy watchdog to read-only, a real GitHub workflow_dispatch for 2026-10-25 failed before HTTP readback because the legacy GitHub ledger contains only five older dates through 2026-10-09. A second read-only test for the legitimately present 2026-10-09 record passed with independent public readback.

The old scheduled algorithm searched older not-live ledger entries when the current business date was missing, creating false daily error signals and an apparent but invalid current-day live assessment.

This safe correction uses only an **exact** business-date row. If absent, it writes `NO_ACTION_LEGACY_LEDGER_DATE_MISSING` and a non-successful-provenance status, skips downstream readback and leaves the canonical Supabase Powerhouse publisher responsible for current publication and outcomes. No old date substitution, public private payload, extra scheduler, GitHub write permission, alternate writer or publication change.
