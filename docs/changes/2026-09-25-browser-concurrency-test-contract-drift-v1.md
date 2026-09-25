# Browser concurrency regression-oracle parity

Date: 2026-09-25  
Fingerprint: `browser-concurrency-test-contract-drift-v1`

The full-site visibility verifier was correctly changed to bounded route-worker concurrency, but the older website release-risk regression continued to require the removed sequential `for (const route of routes)` implementation shape. This made the website baseline deterministic red on multiple otherwise independent recovery PRs.

The fix updates the stale oracle to require bounded worker concurrency and extends the canonical Brain boundedness test so runtime and oracle must move together. One shared main fix replaces per-PR workarounds or blind reruns.

The same recovery also fixes the Problem Radar learning evaluation path: canonical learning evaluation may reference only `tests/brain-*.test.mjs`. The website release-risk test remains supporting evidence, while the existing Brain bounded-concurrency regression is the executable evaluation wrapper.
