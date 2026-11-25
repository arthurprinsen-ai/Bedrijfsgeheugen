# Development ledger: Anthropic-only predictive engine recovery

- Date: 2026-10-09
- Obligation: p0-4198-anthropic-only-predictive-20261009, parent P0 #4198.
- Existing authority: one Supabase predictive Edge function and existing canonical AI governance; no additional executor, schedule, Brain, CRM or provider connection.
- Verified Groq issue: connected Groq provider reported restricted organization billing. Predictive fallback governance record was explicitly SUSPENDED; other use cases remain untouched.
- Verified Anthropic primary: `claude-sonnet-5` is ACTIVE/approved; existing API key present, direct real Anthropic response HTTP 200 with provider message receipt via request 1686. Secret never exposed.
- Predictive runtime: exact existing scheduler invocation request 1684 returned HTTP 500 (`canceling statement due to statement timeout`). This is still an independent production failure and is not falsely counted as success.
- Material change: delete Groq fallback import/dispatch from original predictive Edge function, preserve guarded Anthropic path, strict evidence and score validation, idempotent forecast upsert, proof fields and original scheduler.
- Regression: `tests/brain-predictive-approved-fallback-v1.test.mjs` includes a new no-Groq runtime invariant, retains shared historical fallback regression tests. Canonical learning replay passed protected admission on 2026-10-09.
- Closure: protected merge, precise Edge source production parity, authorized scheduled run and database readback, actual forecast receipts and attribution to verified external commercial outcomes must be observed before FULL_GREEN. No simulated delivery, generated results or unverified provider claims.
