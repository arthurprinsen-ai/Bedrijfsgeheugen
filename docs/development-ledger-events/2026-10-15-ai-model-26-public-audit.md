# Development ledger — supplier public review of 26 AI models

- Date: 2026-10-15
- Obligation-ID: `ai-model-26-public-supplier-audit-20261015`
- Integration: Public supplier source synchronization, not new AI model development
- Canonical catalog: `data/ai-model-catalog-v1.json` (110 records)
- Database independent readback: 83 VERIFIED / 26 PARTIAL / 1 CONFLICT
- Audited 26/26 PARTIAL records, with source classification, residual claim list, explicit nonapproval, next-action, and provider URLs
- Rechecked official public rates in five records: DeepSeek Flash and V4 Pro peak/off-peak USD per 1M tokens; Cohere Command A+, Embed 4, Rerank 4 Pro Model Vault USD per dedicated instance-hour
- No customer-specific billing, signed contracts, tenant runtime/region, effective retention, commercial licensing or AWS account modelLifecycle was attested
- No automatic-recommendation flags elevated; source freshness/Required and CodeQL remain unchanged
- Protected closure: this append-only ledger event, Brain learning JSON and human-facing change log accompany the source material write
- First CI attempt failed due to `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE: activity_ledger,brain_learning,human_documentation`; the present commit series supplies these required artifacts without modifying the gate
- Release candidate #4374 was already merged; this is a separate evidence-only follow-up requiring its own protected checks and production parity

Official supplier references:
- https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle-legacy.html
- https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html
- https://aws.amazon.com/bedrock/pricing/
- https://docs.cohere.com/docs/model-vault/standard/pricing
- https://api-docs.deepseek.com/quick_start/pricing/
- https://ai.google.dev/gemini-api/docs/changelog
- https://huggingface.co/tiiuae/Falcon-H1-7B-Instruct

Release acceptance remains blocked until all mandatory checks and source/deployment readback succeed. Supplier public review is not equivalent to customer approval.
