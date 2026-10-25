# Development ledger — preview quota diagnosis 2026-10-23

- **OBSERVED:** Supabase exact-head provider preview on original PR #4733 returned `cancelled` with `Maximum number of concurrent branches reached`; canonical diagnosis fell through to generic provider non-success.
- **CANONICAL OWNER:** Existing capacity control issue [#4120](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4120), related healed migration PR #4733; no second incident or owner.
- **CHANGE:** Existing regex recognizes new provider vocabulary; action remains read-only, strict, and no successful preview forged.
- **REGRESSION:** `tests/brain-supabase-preview-diagnosis-v1.test.mjs` asserts exact cancelled text and stale-success precedence.
- **RELEASE:** CANDIDATE ONLY until exact-head Required/CodeQL and protected merge; production readback after merge. No second schedule, queue, API cost, customer data change or guardrail relaxation.
- **EFFECT:** Faster causal triage is a hypothesis, not a measured speedup; no business-value assertion.
