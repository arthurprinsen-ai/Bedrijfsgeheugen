# 2026-10-08 — Local attested Ollama/vLLM executor

- Obligation-ID: customer-local-ai-attested-executor-20261008-v1
- Existing state: provider-neutral verified runtime gateway, cloud provider approval and canonical cross-domain AI/CSRD impact chain.
- Changed: strict localhost-only Ollama/vLLM request/response adapters; signed, use-case-bound readback; model checksum and isolated tenant endpoint inventory; delegated canonical cross-domain approval.
- Reuse: `invokeVerifiedAiRuntime`, `validateCustomerAiDeployment`. No second regulatory graph or Brain store.
- Security/privacy: deny on stale proof, mismatched tenant, CSRD scope not cleared, unverified offline isolation or endpoint mismatch.
- Tests: `tests/brain-attested-local-ai-v1.test.mjs`.
- Current truth: library candidate. No deployed customer local machine, real airgap, verified egress, RAG pipeline or measured compliance is claimed.
