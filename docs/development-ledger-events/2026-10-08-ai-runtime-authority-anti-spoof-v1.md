# AI runtime trusted authority and CSRD review hardening

- Obligation-ID: ai-runtime-authority-anti-spoof-20261008-v1
- Problem: arbitrary supplied receipt was accepted as VERIFIED at invocation boundary.
- Change: require server-owned receipt and cross-domain review resolvers; verify scoped customer consent and approved audit/CSRD review; pin endpoint to a server-owned registry.
- Regression: `tests/brain-verified-ai-runtime.test.mjs`.
- Security truth: no new provider or local model was activated. No secret vault or attestation authority is provisioned. Existing default customer path unchanged.
- Closure evidence: protected PR, CI, merge and production readback are required. Issue #4152 remains open for actual adapters.
