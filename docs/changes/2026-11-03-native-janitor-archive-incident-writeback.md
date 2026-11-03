# Native Janitor archive incidents: never hidden, always read back

**Source owner:** original Powerhouse Repository Janitor / ONE BRAIN. **Original parent incident:** #5320; archive HTTP403 incident #5333. This repair **does not** grant missing GitHub archive-tag permissions.

## Observed deficiency
Original standalone `branch_archive_sweep` had recorded three GitHub `POST /git/refs` HTTP403 failures in runs #41528932134 and #41546047078. PR #5334 corrected false-green **job status** and introduced an always-upload typed artifact, but a failed archive job was not automatically a durably registered and independently read-back Brain occurrence. A step failure or lost artifact could be represented only in GitHub workflow status. This is an incident reporting coverage gap, not a proven resolved provider authorization.

## Minimal original-owner patch
Reuse `tools/delivery/janitor-incident-agent.mjs` with `--observe-archive` from **the existing** `branch_archive_sweep` job via `if: always()` after the original sweep and before the original artifact upload. The observer validates source `schema`, exact GitHub run/SHA and counters. It emits an independent `INCIDENT_OPEN_ARCHIVE_PROVIDER_FAILURE`, `INCIDENT_OPEN_ARCHIVE_STEP_FAILURE`, or `INCIDENT_OPEN_ARCHIVE_EVIDENCE_MISSING`. It then uses the original issue #5333 and native GitHub comment readback plus the existing Supabase `brain_observe_failure` RPC with exact `brain_failure_occurrences` readback. No new job, scheduler, independent agent, table, publisher, token scope or child writer. Report + observer result remain in the original archive artifact.

## Safety/rollback
A failed issue or Brain readback fails this original job, cannot be reported as green; history remains immutable. The original worker retains its existing three-strike circuit breaker, protected refs, exact SHA and tag readback before any branch with unique commits may be deleted. If provider authorization remains 403, safely preserve the branch and register an unresolved incident. No attempts to bypass or broaden credentials, no owner-created generic PAT. If observer causes unexpected production failure, revert only this observer step through protected original release while keeping archive work fail-closed and incident #5333 open; no silent mode or bypass.

## Tests and acceptance
Targeted replay `tests/brain-janitor-archive-incident-readback-20261103.test.mjs` in original automation lane proves success with no report, three provider errors, missing/corrupt/stale artifact, step-only error, independent occurrence readback, unprivileged failure and API 503. Historical/shadow/canary reference in original Brain learning. CI, protected merge, existing full BRAIN and independent live original archive run with actual GitHub+Brain+portal source proof are required before closure. **Do not claim every agent in the estate is covered**; audit uncovered emitters separately.
