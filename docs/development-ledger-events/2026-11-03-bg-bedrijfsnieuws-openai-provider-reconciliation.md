# Provider drift follow-up — 2026-11-03
- Original P0 #4198, owner openai-only directive.
- Original native Edge bg-bedrijfsnieuws v11 was still Anthropic against an ACTIVE OpenAI Kansenradar governance use case; static code/registry mismatch.
- Original protected source only: use OpenAI forced oordeel tool with existing schema, preserve source facts, privacy, suggested-only actions and bg_bewijs.
- No new writer/scheduler; no external send; no claim production GREEN before independent run.
- Test: tests/brain-bedrijfsnieuws-20261029.test.mjs. Original main merge, Supabase Edge deployment and independent effect pending.
