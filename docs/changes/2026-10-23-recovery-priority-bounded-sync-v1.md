# Recovery Supervisor: reconcile final permitted MAIN_SYNC and improve evidence ordering

Date: 2026-10-23. Canonical owner: github|recovery-supervisor|bounded-sync-reconciliation-priority|20261023-v1. Related to GitHub issues #4120 and #4661.

Actual existing [Recovery Supervisor run 39966378899](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39966378899) succeeded, but its priority snapshot surfaced old terminal candidates (#3120 etc.), which were classified FAILED_GATE_RECOVERY. The one permitted action was an exact-head Required redispatch on #3760; no CAS proof was emitted. This is a single observed run, not a reliable throughput baseline.

The ranker's prior `count<2` validity check also incorrectly deprioritized an already-authorized `MAIN_SYNC` reconciliation after its second permitted refresh. The correction accepts `count<=2` **only for MAIN_SYNC ordering**, not for new `update-branch` writes. A terminal lease at count 2 remains blocked from a third attempt. Every actual mutation still requires the incumbent per-PR live writer lease, immutable HEAD SHA, overlap/ancestry proof, `expected_head_sha` CAS and Required/CodeQL verification.

Within idle stale terminal leases, a genuinely completed exact-HEAD Required success on an authenticated `pull_request` event receives advisory priority over candidates absent from the latest bounded 48-hour Required sample. Unknown stays unknown: zero observed recent runs does **not** mean failed CI or no prior tests. Among the remaining eligible idle leases, newer activity gets priority; unchanged/ineligible PRs retain provider order. Active Required is deferred. No new scheduler, background worker, store, GitHub Actions dispatch or production authorization.

Regression: `node --test tests/delivery-recovery-pr-prioritizer.test.mjs` (12 tests locally). Canonical Brain evaluation reuses `tests/brain-recovery-pr-prioritizer.test.mjs`. These local tests are not evidence of a production speedup.

Release boundary: exact candidate-head Required, CodeQL, protected merge, GitHub main SHA readback and actual existing supervisor run readback. Compare repeated runtime outcomes to prior observations, including CAS rejection and release latency. Keep distinct Portal V2 tenant, auth, production and customer-value acceptance open.
