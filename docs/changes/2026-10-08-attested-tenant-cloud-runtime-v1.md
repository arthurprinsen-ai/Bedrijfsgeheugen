# Verified tenant cloud AI adapters (Azure OpenAI + Mistral) — phase 2 foundation

This adds a **new opt-in** authenticated route, `POST /api/tenant-ai-inference`, with JSON `{"question":"..."}`. It does not change existing Anthropic user flows and does not automatically switch customers to a different model.

## Server-only provisioning contract

No invocation is possible by merely selecting a provider in the portal. The Netlify server must have `BG_TENANT_AI_VERIFIED_RUNTIME_REGISTRY` (a JSON dictionary indexed by verified Identity tenant ID) and `BG_TENANT_AI_PROOF_SIGNING_KEY` (minimum 32-byte high-entropy key, kept in the secret manager). Each registry entry contains a `signedProof` and a `config` map for that exact tenant.

The signed proof is issued **only by the separate provider verification authority**, after evidence checks on the real provider account, model, processing/storage/RAG regions, privacy/data-processing terms, network egress and credentials. The proof includes exact tenant ID, useCaseId `portal-project-answer`, active policy version, provider, model and deployment properties, evidence IDs, endpoint ID, signed verification and validity times. Maximum receipt lifetime: 24 hours; revocation/rotation is mandatory. The signer function itself **does not verify** a provider, regulatory status, terms or network control: it must never be used as a substitute for those checks.

For Mistral: `config.MISTRAL_API` holds `apiKey`, `endpointId`, `providerReadbackEvidenceId`, `egressEvidenceId`. Mistral sends only to `https://api.mistral.ai/v1/chat/completions`. Because this public endpoint does **not itself certify EU-only residency**, the adapter only supports `computeRegion=AUTO` and STANDARD network settings pending verified pinned infrastructure.

For Azure: `config.AZURE_OPENAI` holds `apiKey`, `endpointId`, `deploymentId`, `resourceName`, `apiVersion`, `processingRegion`, `providerReadbackEvidenceId`, `egressEvidenceId`. The adapter constructs only the Azure OpenAI resource URL, validates deployment and region against the signed proof, and never accepts caller-provided arbitrary hosts.

A missing registry, missing/stale/wrong-tenant signed proof, unapproved policy version, invalid location, private endpoint, offline or on-prem preference, or missing credentials means **DENIED**. The customer cannot use this route to reach Ollama, vLLM or an air-gapped environment. A fully air-gapped installation needs a separate local control plane and cannot rely on Netlify.

## Governance and ongoing evidence

The route requires Netlify Identity plus tenant derivation from the existing gateway, reads the current tenant's authoritative Supabase policy and respects sovereignty block conditions. Payloads are bounded, provider/model/endpoint are entirely server-selected, request prompts are not logged, provider error details are not sent back, and there is no automatic retry or provider fallback.

The received answer is a provider observation, **not** proof of GDPR or AI Act compliance, an audited business result, model truth, RAG document residency, or a measured CSRD/ESRS impact. This initial ingress accepts a user's question only, not tenant documents/RAG; connecting authorized retrieval, independently verified signed proof issuance, persistent token/financial metering, customer permission, production secrets and real provider end-to-end traces remains open under #4152. No model/API account is provisioned by this pull request.

## Verification

- `tests/brain-attested-cloud-ai-adapters-v1.test.mjs` verifies HMAC tampering, time bounds, tenant isolation, exact Mistral/Azure transport, unsupported local execution and no fallback.
- `tests/brain-tenant-ai-inference-gateway-v1.test.mjs` verifies the authenticated API boundary, saved policy version, unauthorized provider selection and confidential error handling.

Do not claim live AI execution without a real Identity customer test, verified provider region/readback, signed proof issued by the independent authority and actual production egress evidence.
