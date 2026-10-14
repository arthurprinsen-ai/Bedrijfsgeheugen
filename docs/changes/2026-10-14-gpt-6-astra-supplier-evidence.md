# Supplier verification: GPT-6 Astra (2026-10-14)

This is a **partial, independently inspectable supplier-source observation**, not catalog-level approval.

Source: https://developers.openai.com/api/docs/models/gpt-6-astra
Observed on 2026-10-14 (official provider model documentation).

| Claim | Locator on official page | Observed value | Assessment |
| --- | --- | --- | --- |
| model_id | Models / GPT-6 Astra heading | GPT-6 Astra | Supported model label |
| status | Model heading / Default and public pricing | Listed in official API model docs | Listed, but tenant access not independently tested |
| pricing | Pricing / Text tokens / Per 1M tokens | Input $10; cached input $1; output $50; long-context and mode multipliers apply | Supported |
| capabilities | Modalities | Text input/output; image input; audio and video not supported | Supported |
| deployment | Endpoints | Chat Completions v1/chat/completions; Responses v1/responses listed | Documentation-supported, not authenticated endpoint invocation |
| governance | Model page alone | No independently complete model-specific storage, regional inference, retention, or customer controls verified | UNVERIFIED |

The generic supplier-privacy baseline is **not** proof of a tenant's enabled controls, contract, data residency, or zero-data-retention settings. This record does not create a `claim_scope: full` assertion or change the production acceptance gate.

Evidence follow-up: corroborate governance against the exact official policy and product availability; verify any conflicting catalog claims; only then enter supported, dated per-claim receipts in `data/ai-model-catalog-v1.json` and run the protected freshness test.
