# Customer-local Ollama/vLLM — attested runtime foundation

This is an isolated local AI adapter, **not an installed customer environment**. It reuses the canonical customer AI deployment profile and the existing One Brain cross-domain approval contract. Ollama and vLLM inference is constrained to numeric loopback on an independently operated local machine; no user-provided URL, DNS hostname, remote provider or public fallback can be selected by this module.

## Execution contract

- Only `ON_PREMISE` and `AIR_GAPPED` with `LOCAL` inference, documents and RAG storage.
- Proof signed by a trusted, locally deployed readback authority; exact tenant, use case, policy version, consent, change ID, selected model, model digest, data residency, health and isolation evidence.
- Airgap requests require separate explicit offline system attestation. An environment variable or UI choice **does not establish an air gap**.
- Trusted local endpoint inventory must pin provider, model identifier, digest, localhost port and isolation evidence.
- One Brain review must be **CLEARED** for privacy, security, AI governance, data residency, suppliers, finance, sustainability, CSRD/ESRS scope, audit and customer disclosure before prompt bytes are sent.
- One network request to `http://127.0.0.1:<approved-port>`; redirect rejected, no automatic retry and no other provider fallback.
- Egress firewall/OS isolation is an independently verified deployment prerequisite. Loopback application rules **do not** provide proof of no other background network access by the machine, Ollama/vLLM, embeddings, OCR, logs, updates or dependencies.
- Never expose `signLocalRuntimeProof` or the signing key through customer HTTP/API routes.

## Still required before a live customer claim

Separate locally installed management plane with restricted credentials; network-deny configuration and measured egress tests; hardware sizing and model checksum readback; signed model artifact distribution; document extraction, embedding, vector storage, retrieval, logging and backup on the declared premises; revocation and restore/rollback; customer-funded provisioning approval; authenticated end-to-end live tenant testing and provider evidence. No hosted control-plane dependency may remain for AIR_GAPPED inference.

Existing functionality and the default hosted Anthropic path are not changed by this library. Related issue [#4152](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4152).

Regression: `tests/brain-attested-local-ai-v1.test.mjs`.
