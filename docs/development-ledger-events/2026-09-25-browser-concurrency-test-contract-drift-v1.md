# 2026-09-25 — browser concurrency test-contract drift

- Fingerprint: `browser-concurrency-test-contract-drift-v1`
- Affected: website baseline on PRs #2880–#2885 and terminal governance PR #2896.
- Root cause 1: the runtime moved to bounded route-worker concurrency while a legacy regression still asserted sequential route iteration.
- Root cause 2: the full-site browser process had no outer OS-level hard timeout, so a wedged Playwright/browser protocol operation could hold a runner beyond the script's internal route budget.
- Fix: align the release-risk oracle, guard runtime/oracle parity, and wrap the full visibility command in `timeout --signal=TERM --kill-after=15s 9m`.
- Prevention: shared-main regression is repaired once before affected candidates are rerun; no multi-PR workaround fan-out; every production browser verifier requires both internal semantic budgets and an outer process circuit breaker.
- Learning compiler recovery: Problem Radar historical replay no longer points directly at `tests/site-shell-website-release-risk.test.mjs`; it uses `tests/brain-standalone-visibility-bounded-concurrency-v1.test.mjs` and keeps the site-shell test as supporting evidence.

- Recovery evidence #2896 / Required `36111924855`: targeted browser assertions were green; the outer 9-minute circuit breaker fired in `context.close()` with exit 124. Root cause 3: Playwright teardown itself was unbounded. Fix: bounded page/context/browser cleanup with semantic exit preservation. Prevention fingerprint: `browser|playwright-cleanup|bounded-teardown|v1`.
