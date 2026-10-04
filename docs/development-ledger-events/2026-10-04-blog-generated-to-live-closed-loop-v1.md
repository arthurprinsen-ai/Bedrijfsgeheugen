# Development ledger — blog GENERATED → LIVE_PROVEN

- Date: 2026-10-04
- Fingerprint: `powerhouse|blog-generated-to-live-hourly-reconciliation|v1`
- Incident: the 2026-10-04 canonical blog remained GENERATED although its content artifact and publication obligation already existed.
- Root cause: durable Supabase queueing was coupled to only two GitHub schedule windows; no frequent same-obligation reconciliation existed.
- Repair: hourly canonical publisher, executor-change push trigger, one-writer guard, repository-native queue/export Edge Functions, idempotent missing-artifact handling.
- Terminal condition: same content-publication obligation reaches protected merge, Netlify production and exact public readback; no replacement content claim is allowed.
