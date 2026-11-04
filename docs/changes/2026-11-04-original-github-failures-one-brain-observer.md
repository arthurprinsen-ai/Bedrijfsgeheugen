# Native GitHub Actions failures -> existing ONE BRAIN (2026-11-04)

Original owners: Repository Janitor and ONE BRAIN incident governance. Related issues #4918 and #4198.

## Real gap
The protected #5398 manual synthetic canary and matching canonical RPC readback verify that ONE BRAIN *can* store an event. They do not prove that future failed GitHub Actions workflow runs are automatically detected. The existing Janitor observer recorded only its own two Janitor jobs. In production, 23 blocker fingerprints remained ACTIVE, and only LinkedIn company of four daily publications had independent LIVE_PROVEN evidence.

## Narrow implementation
Reuse the **original** GitHub scheduled workflow `.github/workflows/powerhouse-repository-janitor.yml`, its existing 17th-minute hourly trigger, unchanged permissions, authentication secrets, and `if: always()` observer pattern. Add an original-workflow observation step that lists real completed native GitHub Actions runs, collects only explicit failure conclusions, uses an immutable `run_id/run_attempt` occurrence identity and stable workflow/conclusion fingerprint, writes through the original `public.brain_observe_failure` RPC, then reads the exact `brain_failure_occurrences` fingerprint and payload hash back. Successful, neutral, skipped and intentionally cancelled workflow runs must not be misclassified as product errors; cancellation telemetry remains separate.

A failed fetch, incomplete pagination, identity mismatch, unavailable Brain credentials, failed RPC, conflicting hash or missing independent readback makes the observer **red**, not green. The observer produces an uploaded structured artifact. No new executor, cron, table, publisher, entitlement, token scope or branch-protection bypass; original channel blockers are unchanged. Actual cause is UNKNOWN until original job logs prove it.

## Known coverage boundary and terminal proof
This is overlapping 48-hour provider polling split into twelve disjoint 4-hour buckets, each independently capped at GitHub's 1,000-result search limit. The GitHub provider returned 2,500 completed runs in the unpartitioned date query at preflight, so partitioning is necessary. A prolonged outage, unexpectedly high Actions traffic or provider omission can leave gaps and must be surfaced as `GITHUB_ACTIONS_INCIDENT_COVERAGE_UNVERIFIED`. Full future coverage is not asserted from a simulated unit test. Exact-head Required/CodeQL/BRAIN -> protected merge -> actual next native hourly run -> **non-synthetic failing GitHub Actions run** and matching ONE BRAIN readback -> admin-only portal readback are required before declaring this subsystem GREEN. The 23 blockers and four channels have their own owners and cannot be marked resolved by this instrumentation.
