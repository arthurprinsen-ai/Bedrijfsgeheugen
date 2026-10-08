# Faster Powerhouse CI via audited Heartbeat backend-only routing

Obligation-ID: `powerhouse-ci-heartbeat-lane-scope-20261008-v1`. Reuses the existing `BRAIN-DELIVERY-v2` lane classifier.

## Measured root cause
PR #4171 modifies the source-controlled improvement scheduler contract and a GitHub read-only backend probe. Both are internal governance/runtime artifacts; neither is loaded into the public website or tenant portal. The general shared-path classifier therefore sent this simple correction through backend, automation, portal, website, Netlify parity and browser preview. That was an avoidable fan-out.

## Surgical correction
Classify only the audited exact paths `config/powerhouse-autonomous-improvement-runtime.json` and `scripts/brain/continuous-improvement/run-autonomous-improvement.mjs` as backend. Preserve the broad fail-closed behavior for unlisted shared config, security/SQL changes, and actual portal/website code. Do not introduce a second CI scheduler, cache, data store or product authority.

## Regression
`tests/brain-change-scoped-release-lanes.test.mjs` proves combined Heartbeat config/probe/test/learning/docs trigger only the shared + backend suite; it also proves `config/outcome-obligations.json` still fans out across every product lane and a portal source path still triggers portal. Existing delivery tests and required protected checks remain active.

## Proof boundary
A passed CI run proves route correctness and safe merge, not yet a quantified decrease in p95 time-to-live. Compare actual GitHub sampled job time for comparable before/after changes after release. Keep exact SHA and necessary Netlify/provider proofs whenever a release artifact changes.
