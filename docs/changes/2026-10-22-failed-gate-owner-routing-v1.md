# Failed-gate recovery owner handoff — 22 October 2026

The original five-minute **Required Gate Watchdog** remained active but treated `completed/failure` as adequate gate presence. The existing `tools/delivery/predictive-controller.mjs` knew about `FAILED_GATE_RECOVERY`; the watchdog did not route that signal to the existing PR owner.

This change integrates a pure current-head classifier and stable owner-signal marker into that same watchdog. It reads the latest Required and CodeQL outcome by SHA, reads the first actual failed job, and posts up to two bounded deduplicated recovery notes per scheduled execution to the **same existing PR** (owner derived from `Writer-Lease-Owner` or original obligation). It does not start a replacement scheduler, create new source PRs, auto-merge, or retry reproducible red source tests. Existing missing-Required single-flight dispatch and the five-minute cadence are preserved. The `issues: write` permission authorizes only these evidence comments.

Safety: healthy queued/in-progress runs are not cancelled; no-job startup failures are classified as unresolved provider starts; security CodeQL remains required; CLS > 0.100 on every existing phone browser route remains red. A PR comment is **not** proof the actual CSS/source defect was fixed or a coding agent ran. Real same-owner repairs, protected exact-head tests, and release readback remain separate obligations.

Existing website example: #4656 Required run 39800626684 failed in job 119901773175 due to English mobile blog CLS 0.168. Original website repair owner remains #4651 and P0 #4215. Parent delivery-obligation evidence is #3742; canonical Brain fingerprint `delivery|failed-gate|watchdog-observation-only|20261022-v1` remains OBSERVED pending verified launch.

Regression: `node --test tests/brain-required-failed-gate-owner-routing-v1.test.mjs`. See accompanying learning JSON and append-only development ledger.

## Postmerge provider acceptance — same-owner permission correction

Main commit `01af9f2a05794a170cd3fd63013db75a33e76268` merged the first delivery but actual watchdog [run #39811993147](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39811993147) failed with `GitHub API 403 /issues/4656/comments: Resource not accessible by integration`. The job explicitly had `Issues: write` but `PullRequests: read`. Required dispatch of #4662 happened before the denial and is retained as real evidence.

A new scoped successor on the **same obligation** adds `pull-requests: write` to the existing workflow and executes the original five regression checks inside every scheduled/manual watchdog run. This is a permission correction, not a second scheduler, waived quality control or an invented root-cause fix. Only a genuine successful `main` watchdog execution posting/verifying a deduplicated owner signal can validate PR comment write authority. PR #4656 stays owned by its existing janitor agent, mobile CLS by #4651; no duplicate source writers. A future GitHub provider 403 must remain an actual blocked permission state with the original obligation retained.
