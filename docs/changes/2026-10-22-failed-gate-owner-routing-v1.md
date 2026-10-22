# Failed-gate recovery owner handoff — 22 October 2026

The original five-minute **Required Gate Watchdog** remained active but treated `completed/failure` as adequate gate presence. The existing `tools/delivery/predictive-controller.mjs` knew about `FAILED_GATE_RECOVERY`; the watchdog did not route that signal to the existing PR owner.

This change integrates a pure current-head classifier and stable owner-signal marker into that same watchdog. It reads the latest Required and CodeQL outcome by SHA, reads the first actual failed job, and posts up to two bounded deduplicated recovery notes per scheduled execution to the **same existing PR** (owner derived from `Writer-Lease-Owner` or original obligation). It does not start a replacement scheduler, create new source PRs, auto-merge, or retry reproducible red source tests. Existing missing-Required single-flight dispatch and the five-minute cadence are preserved. The `issues: write` permission authorizes only these evidence comments.

Safety: healthy queued/in-progress runs are not cancelled; no-job startup failures are classified as unresolved provider starts; security CodeQL remains required; CLS > 0.100 on every existing phone browser route remains red. A PR comment is **not** proof the actual CSS/source defect was fixed or a coding agent ran. Real same-owner repairs, protected exact-head tests, and release readback remain separate obligations.

Existing website example: #4656 Required run 39800626684 failed in job 119901773175 due to English mobile blog CLS 0.168. Original website repair owner remains #4651 and P0 #4215. Parent delivery-obligation evidence is #3742; canonical Brain fingerprint `delivery|failed-gate|watchdog-observation-only|20261022-v1` remains OBSERVED pending verified launch.

Regression: `node --test tests/brain-required-failed-gate-owner-routing-v1.test.mjs`. See accompanying learning JSON and append-only development ledger.

## Additional root cause: older PR invisible to watchdog

The already-merged initial watchdog fix has another verified gap: PRs whose `updated_at` was over two hours old were skipped before querying exact-head Actions runs. A new failed gate does not necessarily refresh the PR's timestamp. The same canonical fingerprint and owner remain in force.

The same five-minute watchdog now inspects fresh PRs on every tick and inspects older PRs in 12 deterministic shards (every 60 minutes). The earlier short settling window and maximum two-hour **missing-Required dispatch** window still apply only to newly missing runs. Older PRs NEVER trigger fresh Required dispatch. GitHub API workload stays bounded, dedup remains by immutable gate/head, and no gate/CLS/security threshold changes.

Regression: `node --test tests/brain-required-failed-gate-owner-routing-v1.test.mjs`. This candidate is not a verified deployment or general-purpose source-coding agent; protected exact-head CI/CodeQL and live watchdog readback are required.
