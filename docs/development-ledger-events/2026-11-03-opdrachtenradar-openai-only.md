# 2026-11-03 — Opdrachtenradar OpenAI-only provider corrective action
- Original source readback: Supabase ACTIVE v695 and GitHub main both use Anthropic despite owner OpenAI-only directive.
- Original incident: powerhouse|opdrachtenradar|active-anthropic-direct-provider-after-openai-only-directive|20261103-v1.
- Fix candidate: exact OpenAI forced-function schema; no missing/duplicate result IDs, no alternative model fallback.
- Scope: existing Edge function source and tests; existing native cron/token, source fetch, RLS and job evidence unchanged.
- Protected PR exact head and deployed provider readback are pending. No false GREEN. See canonical GitHub issue #4198.
