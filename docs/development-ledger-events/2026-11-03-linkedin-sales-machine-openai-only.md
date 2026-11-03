# 2026-11-03 — original LinkedIn Sales Machine provider reconciliation
- Production and protected GitHub main had Anthropic comment API while canonical checked AI use-case was already OpenAI.
- Root cause: provider-vs-approval mismatch, resulting in no valid comment-generation route.
- Fix candidate: OpenAI gpt-5-mini same original guarded action pipeline, preserve no-send and SalesRobot independent readback.
- Regression: tests/brain-linkedin-sales-machine-openai-only-20261103.test.mjs.
- Not yet live: protected merge, original Supabase Edge exact source readback, actual model result, recurrence.
- Canonical incident #4198, original ONE BRAIN action/failure lineage and skill owner.
