# Portal demo BusinessInput ACK and causal propagation v4

- Obligation-ID: portal-demo-ack-impact-v4-regression-20261008-v1
- Source: production shared portal test regressions observed in the protected CI for PR #4164.
- Fix: explicit demo-only non-durable skip; no change to authorized durable business writes; update stale causal v3 test assertion.
- Evidence: `tests/brain-portal-demo-canonical-ack-v4.test.mjs` and full portal suite.
- Production: needs protected merge/readback; no success asserted at PR creation.
