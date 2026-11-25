# Verified Google Vertex AI provider adapter

Existing-state-first: extends `platform/runtime/attested-cloud-ai.mjs`, does not introduce a new brain, gateway or customer AI controller. A tenant may request a Google Vertex model, but selection is not provisioning, contract approval, or authorization to send data.

The adapter implements regional Google Vertex `generateContent` for strictly allowlisted locations. It accepts a trusted server-side project ID, authorized OAuth token, exact model and evidence fields, matches the signed receipt, tenant, model, policy version, approval ledger and registered endpoint, and never uses the global Google endpoint. EU and US locations require matching approved policy regions. It rejects unsupported model families, unsafe IDs, tool/safety blocks, empty replies, and missing evidence before any external egress. It has no retry or fallback.

Google publisher Gemini-model REST contract: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/start/quickstart

**Not complete:** authorized service account/token renewal, actual Vertex IAM and model availability, regional provider readback and DPA, egress policy enforcement on the customer environment, tenant-authenticated end-to-end production inference and cost approval remain separate requirements in #4152. A customer selecting Google Vertex cannot activate it without those prerequisites.

Regression: `tests/brain-attested-vertex-regional-adapter-v1.test.mjs`.
