# 2026-11-03 — Original experimentcyclus provider and source consistency
- Supabase production v8 was an untracked historical Edge source with a direct Anthropic call; cron job 23 remains active.
- Recovered original source to version control and converted approved AI contract to OpenAI only, no new scheduler or policy bypass.
- Regression tests/brain-experimentcyclus-openai-20261103.test.mjs; canonical issue #4198.
- Awaiting protected PR and exact-governance production handover. No green claims or AI inference output at source-change stage.
