# Customer AI infrastructure choice · 8 October 2026
Obligation: `customer-ai-deployment-residency-choice-20261008-v1` · Issue [#4147](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4147)

## Functional customer journey
In Trust & Governance → Compliance Command Center → Waar gaat data heen, an authenticated tenant chooses databeleid, managed/private/local/air-gapped execution, a provider, model family, model ID, compute region, document storage, RAG/vector location and network isolation. Existing Data Sovereignty provider/flow reports continue showing observed truth, not wishful selections.

Supported **requested** targets: Anthropic, Azure OpenAI, Amazon Bedrock, Google Vertex AI, Mistral API, private Ollama and vLLM. Model families: current, Mistral, Gemma, Llama, custom. The private/local targets require implementation work and cannot be declared available by merely selecting them. Local model license and version, model origin, hosting jurisdiction, data processing, document extraction, embedding service, backup/telemetry and audit must each pass independent checks.

## Implementation and trust boundaries
- Browser: form only, no credentials; per-customer view.
- Netlify Identity: authenticated tenant resolved server-side; validators enforce allowlisted fields, forbid training/fallback.
- Supabase Edge: service-token authorized tenant policy updated; `ai_deployment_profile` is desired state stored in row; existing snapshot RPC serializes it.
- AI gateway: a non-current profile or conflicting legacy provider preference **blocks current Anthropic confidential AI**. No runtime model switch is attempted by this PR.
- Connector gateway: requested private/local compute, private network or strict alternative data storage blocks unverified connector activation/tests.
- Existing EU-only fail-closed policy and provider readback are not bypassed.

## Definition of Done and boundary
Tests include validators, mixed tenant desired/current-state routing, connector fail-closed and portal/backend contract. Protected PR checks, migration deployment, current Netlify and Supabase runtime versions, authenticated customer save/get/readback and proof of no wrong-provider egress must be verified after merge. This candidate does **not** deliver real on-prem servers, customer cloud accounts, network peering, deployment agents or new inference/model runtimes. Do not mark such deployments live.
