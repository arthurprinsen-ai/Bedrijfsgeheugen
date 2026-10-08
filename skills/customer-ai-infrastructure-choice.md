# Customer AI infrastructure choice — canonical capability
Fingerprint: `powerhouse|customer-ai-placement|tenant-desired-state|fail-closed|v1`
Obligation: customer-ai-deployment-residency-choice-20261008-v1, issue #4147.

All customers must be able to express where their AI runs and where their data, documents, embeddings and RAG indexes reside. Offer managed cloud, private cloud, on-premises and air-gapped deployment requests, as well as Anthropic, Azure OpenAI, Bedrock, Vertex, Mistral and local Ollama/vLLM model-serving choices.

The authenticated customer policy in `tenant_data_sovereignty_policy_v1.ai_deployment_profile` is **desired state** only. Never treat choosing a provider/model/region as a completed deployment, contract, data-processing agreement, regional guarantee or successful security test. Supabase service-role identity and tenant isolation remain mandatory; no credentials or private endpoints in browser payloads.

Pre-existing tenants without a profile keep current behaviour. For a saved noncurrent profile, confidential inference and relevant external connector activity must fail closed until a distinct provisioned route has independently verified placement, processor, model, storage, subprocessor, no-training and network evidence. Do not silently fall back to a nonselected provider. Training use stays PROHIBITED; external fallback stays false.

UI: portal-next/data-sovereignty-panel.js and CSS, visible within Compliance Command Center. Netlify API validates, the EU Supabase function persists, the policy service blocks forbidden current-route execution. Runtime proof belongs to the existing Data Sovereignty snapshot and Trust Center.

Follow-on integration for actual selected provider activation: secure tenant credentials / deployment ownership, per-use-case authorization, RAG vector infrastructure and source storage, audit, egress check, smoke evaluation, rollback and provider-backed proof. No such activation may be inferred solely from this feature.
