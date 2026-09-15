# 2026-09-15 10:14 CEST — RECOVERY + IMPROVEMENT — Production readback connector 503

- **Fingerprint:** `production-readback|connector-readiness|route-overlap-and-transient-503-v1`
- **Signal:** Production Release Readback returned HTTP 503 for `/api/connectors/readiness` while Netlify reported the deployment itself as `ready`.
- **Impact:** production completion could be falsely blocked by route ambiguity or a one-off transient 5xx; conversely, treating Netlify `ready` as sufficient would risk a false green.
- **Root cause:** the exact public readiness route overlapped with `/api/connectors/*` until an explicit exclusion was added; the readback also needed bounded retry semantics for transient 5xx without weakening fail-closed behavior.
- **Known failed approach:** equating hosting deploy state with application health, accepting one probe as definitive, or bypassing the readiness gate to obtain a green release.
- **Final fix:** isolate `/api/connectors/readiness` from the wildcard connector route, keep a single dedicated readiness owner, and make the readback retry transient 5xx responses with cache busting and timeouts while still failing after the bounded retry budget or invalid contract.
- **Evidence:** route-isolation merge `d35f255…`; production deploy `6aa8fe0fa19260000807bbdc`; verified production SHA `4835b590a1a27d308b2cc764442e962ab76009ea`; Production Release Readback run `34945747361` success; resilience follow-up PR #1504 merged as `fb68cc0795f1b166a099b17293e758b760c67df7`.
- **Regression gate:** `tests/brain-production-readback-connector-learning.test.mjs` requires the machine-readable incident record, exact/wildcard isolation invariant, bounded retry policy and fail-closed release blocks to remain present.
- **Owner:** Reliability/Release + Architecture/Integrator + Knowledge/Governance.
- **Rollback/last-known-good:** retain the last verified production deploy until the candidate has exact production evidence; do not roll back by weakening the readiness contract.
- **Reusable lesson:** deployment state is not application readiness. Exact health routes must have exclusive ownership; transient infrastructure noise gets bounded retry, persistent or invalid readiness stays red; merge is not completion until production readback closes the obligation.
