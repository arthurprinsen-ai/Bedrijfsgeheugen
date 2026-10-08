# 2026-10-08 — Supabase managed preview classifier and recovery diagnosis

- **Obligation:** `supabase-preview-provider-diagnostics-20261008-v1`
- **Owner:** Existing `.github/workflows/required-test.yml` and its native Supabase Preview provider check.
- **Observed evidence:** PR #4114 failed in hosted migration replay on a missing Identity Graph relation; after repository-baseline repair, its exact-HEAD provider check passed and it was protected merged as `a11ff12c2f5015d7e0d8b81bbebc0422bb81d89c`. PR #4115 failed separately with a native provider `skipped` result because its Git branch was not associated with a Supabase Branch.
- **Structural correction:** A single shared, tested classifier extracts the newest genuine Supabase preview check, identifies missing branch association vs missing migration dependency, keeps both fail-closed, and preserves existing single-flight required gate. Regression executes in Required preflight; a skipped placeholder receives two bounded five-second grace observations before remaining fail-closed.
- **Not done:** No replacement Supabase branch, production migration, reset, RLS weakening, new cron, provider-side delivery or branch protection changes.
- **Proving completion:** CI regression, protected Required + CodeQL, protected merge, and readback of updated workflow at exact main SHA. Current status: implementation candidate only until current exact-HEAD checks, protected merge and main readback pass. No CI/production success is fabricated.
