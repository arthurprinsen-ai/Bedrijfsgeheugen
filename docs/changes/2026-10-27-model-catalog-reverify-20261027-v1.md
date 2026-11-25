# AI model catalog re-verified against supplier pages

All 110 model records were re-checked on 2026-10-27 against official supplier pricing, model, lifecycle and deprecation pages. Confirmed claims (model id, status, pricing, context where stated) carry new receipts; Anthropic statuses, missing cache prices, Mistral and Google lifecycle changes and Bedrock context windows were corrected. Claims that could not be re-observed are marked not verified and the record scope is partial, so no date was reset without a supplier check. gemini-3-flash-preview was fully re-verified for the six public claims.

## Validation

`node --test tests/brain-ai-model-intelligence-v1.test.mjs tests/ai-model-supplier-evidence-accounting.test.mjs tests/brain-ai-model-catalog-evidence-recovery.test.mjs tests/ai-model-intelligence-freshness-v1.test.mjs`

## Boundaries

Data only. Tenant, DPA, region and entitlement facts are unverified. New supplier models are not added yet.
