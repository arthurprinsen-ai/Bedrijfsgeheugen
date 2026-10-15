# Official pricing tiers are not labeled in the 2026-10-14 AI catalog

Independently checked official sources (2026-10-14):
- https://developers.openai.com/api/docs/models/gpt-6-astra
- https://developers.openai.com/api/docs/models/gpt-6-sol
- https://developers.openai.com/api/docs/models/gpt-6-luna
- https://developers.openai.com/api/docs/pricing?tab=suite
- https://developers.openai.com/api/docs/guides/your-data

The catalog presents numerical costs without stating the processing tier. The entries are **not necessarily fabricated prices**: their numbers match the published **Batch/Flex, short-context** discount (50% of Standard). The normal API model pages prominently display **Standard, short-context** prices.

| Model ID | Catalog input / cached / output per 1M | Standard short-context input / cached / output per 1M | Batch/Flex short-context input / cached / output per 1M |
| --- | --- | --- | --- |
| gpt-6-astra | $5 / $0.50 / $25 | $10 / $1 / $50 | $5 / $0.50 / $25 |
| gpt-6-sol | $1 / $0.10 / $5 | $2 / $0.20 / $10 | $1 / $0.10 / $5 |
| gpt-6-luna | $0.05 / $0.005 / $0.25 | $0.10 / $0.01 / $0.50 | $0.05 / $0.005 / $0.25 |

The respective official model pages document a 1,050,000-token context window; the catalog stores `context_k: 1000`, which needs independently reconciled semantics.

**Required catalog changes:** declare explicit pricing tier, input length tier, regional processing uplift applicability and pricing-as-of date. Use Standard as the default for on-demand comparisons unless Batch/Flex is explicitly selected and supported. Do not silently reinterpret existing Batch/Flex numbers as Standard. Keep the external observation separate from a tenant-specific bill.

**Governance remains open:** advertised EU residency options are not evidence of a customer's enabled regional endpoint, approved DPA, contractual retention, zero data retention, or effective subprocessor commitments. GPT-6 Astra EU Fast eligibility differs from Sol and Luna, and configurations change by model and tier. Require authorized tenant/contract evidence before asserting client-specific governance.

**Verification disposition:** price-tier mismatch documented, not fully resolved in canonical catalog. Source evidence has been written to the Supabase supplier verification table for Sol and Luna, but no model is promoted to VERIFIED. Do not update `verified_at` merely from the supplier's index or this note. Existing catalog-freshness CI and customer-governance gates remain mandatory.
