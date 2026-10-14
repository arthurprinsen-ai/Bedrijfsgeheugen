# Catalog verification: GPT-6 Astra — 2026-10-14

Source reviewed: https://developers.openai.com/api/docs/models/gpt-6-astra (official OpenAI model page, observed 2026-10-14).

Observed published standard short-context rate: $10 input / $1 cached input / $50 output per million tokens; window 1,050,000 tokens. The current `data/ai-model-catalog-v1.json` entry lists $5 input / $0.50 cached input / $25 output and `context_k: 1000`. The broad pricing page contains multiple pricing categories; existing figures must be mapped to a defined tier instead of assumed to be Standard.

Disposition: CLAIM_CONFLICT_UNRESOLVED. Do not update `verified_at` or mark customer-facing recommendation as source-verified until pricing tier, residency, contractual governance, and applicable configurations are checked at the claim level. This document is evidence of a discrepancy, **not** evidence of full model verification. The 110-model freshness gate must remain in force.
