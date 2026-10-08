# Tenant AI runtime: immutable review is not permanent execution denial

The prior tenant AI inference route refused every newly selected provider whenever `last_change_impact.status=REVIEW_REQUIRED` and `deploymentApproved=false`. The immutable impact event intentionally retains that original state even after separately verified review clearance; the previous check therefore made compliant activation impossible.

The trusted server-side gateway now requires the signed provider receipt to bind exactly to the persisted tenant, policy version and `sovereignty:<tenant>:<version>` change. An absent, forged, stale or wrong-tenant impact blocks execution before any egress. The existing `runAttestedTenantChat` gate independently validates the cryptographic receipt, cross-domain `CLEARED` status, customer consent, complete approval scope, evidence, expiry and pinned endpoint before calling a provider.

**Truth:** this change does not make the legal CSRD determination or activate Azure/Mistral/local infrastructure by itself. The customer review remains visible as a historical assessment; any actual clearance must be independently issued and stored in trusted server-side authority. AWS/Vertex/private-cloud/on-prem provisioning and live customer consent remain open per #4152.

Regression: `tests/brain-tenant-ai-inference-gateway-v1.test.mjs`.
