# Verified AI runtime authority, tenant isolation and CSRD clearance

Before this change the helper `invokeVerifiedAiRuntime` accepted a caller-supplied `receipt`. A field named `status: VERIFIED` is not itself proof of deployment.

The invocation helper now rejects such receipts outright. Trusted server code must instead install two private resolvers: an authoritative, tenant-scoped provider receipt and a separate cross-domain approval with exactly matching tenant, change ID, policy version, customer consent, expiry, proof IDs and required review scopes, including `csrd_esrs_scope`. Endpoint IDs are only looked up in a server-owned `Map`; no request-supplied URL or fallback routing is allowed.

The existing default Anthropic customer privacy gate is unchanged. This helper is still not connected to a real multi-cloud/on-prem inference ingress. Real activation requires credential vaulting, actual provider/model/region readback, immutable signed evidence, customer-specific consent and egress/tenant isolation tests. These are remaining acceptance criteria for issue #4152; this PR does not claim them. A reviewed ESRS scope is not a legal conclusion of CSRD applicability.

Regression: `tests/brain-verified-ai-runtime.test.mjs`.
