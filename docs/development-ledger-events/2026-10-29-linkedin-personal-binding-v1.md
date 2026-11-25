# Ledger event: LinkedIn persoonlijk meetbaar bij COMPANY_AUTH_REQUIRED

- Datum: 2026-10-29
- Event: `social_metrics_linkedin_personal_binding_declared_v1`
- Scope: supabase/functions/bg-social-metrics-sync/index.ts
- Schrijver: bestaande `bg-social-metrics-sync` (cron `bg-social-metrics-source-6h-v1`); alleen leesacties naar de provider
- Waarheid: branch-test; herstel pas bewezen als de eerstvolgende run `linkedin_personal.status=PARTIAL_SCOPE_OBSERVED` schrijft in `powerhouse_runtime_events`
- Invariant: bij `COMPANY_AUTH_REQUIRED` alleen LinkedIn en alleen met `personal_ready=true`; `ready` en `health_verified` blijven verplicht
- Bewijs: tests/brain-social-metrics-linkedin-personal-binding-20261029.test.mjs, tests/brain-social-metrics-verified-binding-20261019.test.mjs
