# Supplier claim verification: independently checked blockers — 2026-10-14

**This is a verification backlog, not a completion declaration.** Production table: `public.ai_model_supplier_verification_v1` in Supabase project `adhjwmvyoixzjtmiroln`. Latest readback in this work session: 110 catalog rows, 660 required claim slots, 645 slots with at least some evidence, 15 slots without evidence. Automated verification statuses still exclusively PARTIAL/CONFLICT. Evidence presence alone does **not** approve a claim.

## Missing claims from readback

| Catalog row | Unresolved supplier claims |
|---|---|
| qwen-open-weight | model_id, status, pricing, deployment, governance |
| llama-open-weight | model_id, status, pricing, governance |
| amazon-nova-2-sonic | pricing |
| amazon-nova-multimodal-embeddings | pricing |
| amazon-nova-sonic | pricing |
| amazon-titan-image-generator-g1-v2 | pricing |
| amazon-titan-multimodal-embeddings-g1 | pricing |
| embed-multilingual-v3.0 | pricing |

## Correct way to close, without artificial approvals

1. **Generic `llama-open-weight` and `qwen-open-weight` are model families, not deployable immutable model IDs.** Do not treat the family label as an API model ID. Resolve and separate exact published versions, licensing, host, actual endpoint and per-region processing. Self-hosted inference usually has hardware/energy/storage costs rather than a universal provider token tariff. Cost is **unknown until deployment and usage are specified**, not zero. The family placeholders remain blocking.
2. **AWS Nova 2 Sonic, Nova Sonic, Nova Multimodal Embeddings, Titan Image Generator and Titan Multimodal Embeddings:** use the official Bedrock pricing schedule with exact AWS region, on-demand vs batch/flex/priority tier and meter (tokens, audio, image, embedding units, or other). The official model cards link to Bedrock pricing but do not themselves certify a unit rate. A price from a different modality cannot be reused. Do not fill pricing evidence solely with generic supplier documentation.
3. **Cohere embed-multilingual-v3.0:** resolve Cohere-hosted pricing versus AWS Bedrock reseller pricing, the meter (tokens/queries), contract and location. Do not transplant Cohere Rerank rates or AWS provisioned-throughput figures to embeddings.
4. **Customer governance:** general public supplier conditions may be cited as published policy. They cannot satisfy customer-specific DPA, configured residency, enabled zero-data-retention, approved subprocessors or tenant-entitlement proof without authorized customer and provider readbacks.
5. **Freshness:** `data/ai-model-catalog-v1.json` remains stamped 2026-09-30. The 14-day test is correctly failing. Do not refresh its date simply because one source was visited. Complete independent claim verification, reconcile catalog fields, then commit and rerun required checks.

## Official public sources examined

- [Amazon Bedrock pricing](https://aws.amazon.com/bedrock/pricing/): prices differ by modality, model, inference tier and region; rates shown for some AWS models use dynamic on-page provider selectors.
- [Nova 2 Sonic model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-sonic.html)
- [Nova Sonic model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-sonic.html)
- [Nova Multimodal Embeddings model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-amazon-nova-multimodal-embeddings.html)
- [Historic AWS Nova price slides (2024)](https://d1.awsstatic.com/onedam/marketing-channels/website/aws/en_US/events/approved/reinvent-2025/reinvent/2024/slides/aim/AIM398-NEW_Practical-generative-AI-using-Amazon-Nova.pdf): Nova Micro $0.035/$0.14, Lite $0.06/$0.24, Pro $0.8/$3.2 per million input/output tokens; archival values **must not** be treated as a new dated price check.
- [Falcon H1 0.5B official model card](https://huggingface.co/tiiuae/Falcon-H1-0.5B-Instruct) and [Falcon OCR official card](https://huggingface.co/tiiuae/Falcon-OCR): licensed downloadable weights; hosting price cannot be inferred from an open-weight repository.
- [Google Gemini API terms](https://ai.google.dev/gemini-api/terms?hl=en) and [zero data retention notes](https://ai.google.dev/gemini-api/docs/zdr): published provider policy, not evidence of one customer's signed terms.
- [Gemini 3.7 Flash model card](https://ai.google.dev/gemini-api/docs/models/gemini-3.7-flash): provider declares deprecation and alias migration to Gemini 3.8 Flash.

## Acceptance gate

No 'VERIFIED' status and no CI green may be asserted solely because the number of evidence array elements or claim-slot coverage is high. The independent source must support the **specific version, priced meter, region, lifecycle status, deployment mode and governance claim**. Authenticated customer contracts and configuration checks remain separate.
