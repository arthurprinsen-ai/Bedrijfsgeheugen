# Browser concurrency regression-oracle parity

Date: 2026-09-25  
Fingerprint: `browser-concurrency-test-contract-drift-v1`

The full-site visibility verifier was correctly changed to bounded route-worker concurrency, but the older website release-risk regression continued to require the removed sequential `for (const route of routes)` implementation shape. This made the website baseline deterministic red on multiple otherwise independent recovery PRs.

The fix updates the stale oracle to require bounded worker concurrency and extends the canonical Brain boundedness test so runtime and oracle must move together. One shared main fix replaces per-PR workarounds or blind reruns.

A second recovery finding exposed a runner-leak gap: the browser step executed `standalone-visibility-check.mjs` directly. Its internal 8-minute budget is necessary but not sufficient if Playwright or the browser protocol itself wedges. The workflow now wraps the command in an OS-level circuit breaker: `timeout --signal=TERM --kill-after=15s 9m ...`, materially below the 25-minute job timeout. The Brain regression asserts this wrapper so a future workflow edit cannot silently remove it.

The same recovery also fixes the Problem Radar learning evaluation path: canonical learning evaluation may reference only `tests/brain-*.test.mjs`. The website release-risk test remains supporting evidence, while the existing Brain bounded-concurrency regression is the executable evaluation wrapper.

A third recovery finding came from Required run `36111924855`: the targeted route checks were green, but the full sweep was killed by the outer timeout while Playwright was blocked in `context.close()`. This is a teardown false-negative, not product evidence. The verifier now bounds page/context/browser cleanup separately, records cleanup timeout state, preserves semantic assertion failures as non-zero, and exits cleanly after a semantic pass even when residual Playwright teardown is wedged. Fingerprint: `browser|playwright-cleanup|bounded-teardown|v1`.
