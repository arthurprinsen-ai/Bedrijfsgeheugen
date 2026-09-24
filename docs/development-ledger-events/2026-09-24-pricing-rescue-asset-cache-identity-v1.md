# 2026-09-24 — Pricing rescue asset cache identity

- Fingerprint: `pricing-rescue-asset-cache-identity-v1`
- Exact provider deploy before recovery: `6ab58c611214c700089b7a93`
- Exact main: `4aac008ef0872ab902e5888547bafc991c9eb259`
- Provider: `ready / production / exact commit_ref`
- Failed readback: `36057243646`
- Failure: pricing `ready-v3` marker absent after exact deployment.
- Root cause: rescue JS changed after fixed query key `v=20260924-0750`; stale cached runtime could survive.
- Fix: content-addressed cache key from current asset Git blob prefix `f7d85cb0d7ba`.
- Regression: `tests/brain-pricing-rescue-asset-cache-identity-v1.test.mjs`.
- Status: `IMPLEMENTED_CANDIDATE` pending protected merge and production readback.

## v2 closure defect

- #2842 merged the source/snapshot cache-key recovery, but Skill Projection run `36058322328` failed.
- Root cause: `tools/site-shell/pricing-build-integrity.mjs` still restored `v=20260924-0750`.
- Secondary test defect: dynamic workflow regex was over-escaped.
- Fix: build transform now uses `f7d85cb0d7ba`; regression verifies source HTML + build transform + snapshot share one content key.
- Product behavior remains unchanged; this is runtime asset identity/build preservation closure.

