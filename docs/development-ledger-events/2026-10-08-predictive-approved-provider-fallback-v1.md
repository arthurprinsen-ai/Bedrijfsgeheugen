# Development ledger — approved predictive provider fallback

- Date: 2026-10-08
- Obligation ID: one-brain-predictive-approved-fallback-20261008-v1
- Incident: after production-fix PR #4177, authorized pg_net request #984 returned Anthropic HTTP 400 (insufficient credit), and a correctly persisted `bg_gezondheid` failure at 15:00:35 UTC.
- Existing state: AI governance registry already approves `supabase-powerhouse-predictive-first-mover-fallback-v1` using `Composio/Groq`, model `openai/gpt-oss-120b`; Composio credential presence confirmed without revealing the secret.
- Cause: engine hardcoded primary Anthropic and had no reviewed fallback adapter.
- Fix: keep primary; approve routing only through the existing exact fallback-use-case registration; sanitize allowed signal context and verify output against a strict evidence-bound forecast schema.
- Verification: RED tests captured before implementation, new unit/integration tests plus existing predictive/auth/production-lineage regressions; protected source and provider readback must still be confirmed.
- Scope: supabase/functions/powerhouse-predictive-engine/index.ts, supabase/functions/_shared/predictive-approved-fallback.mjs, tests/brain-predictive-approved-fallback-v1.test.mjs, brain/learning/2026-10-08-predictive-approved-provider-fallback-v1.json, docs/changes/2026-10-08-predictive-approved-provider-fallback-v1.md, this ledger.
- Current truth at commit: candidate; external provider response and future forecast creation remain unverified until authorized production run.
- Safety: no new secrets, tables, cron, public messages, private contacts, raw DM fields or false commercial execution claims.
