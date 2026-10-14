# Open-weight supplier-identity correction — 2026-10-14

- Obligation: `ai-model-exact-open-weight-identifiers-20261014`.
- Source finding: `llama-open-weight` and `qwen-open-weight` are family placeholders, not concrete runnable model identifiers.
- Official sources: https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct and https://huggingface.co/Qwen/Qwen3-32B.
- Change: replace exactly those two rows in `data/ai-model-catalog-v1.json`, preserving 110 entries and adding explicit checkpoints and fail-closed governance fields.
- Regression: `tests/brain-ai-model-exact-open-weight-ids.test.mjs` protects identity, unknown pricing and unverified tenant controls.
- Evidence: the analogous Supabase supplier rows are PARTIAL, not client-governance verified. The dated source review proves published model weights only.
- Remaining acceptance: the 108 other catalog freshness checks, mandatory CI, protected merge, deployment, production source-of-truth reconciliation, and customer contract/configuration checks.
