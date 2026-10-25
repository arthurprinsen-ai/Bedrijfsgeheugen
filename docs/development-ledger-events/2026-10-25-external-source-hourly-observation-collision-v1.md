# Canonical source recovery evidence — 2026-10-25

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Fingerprint: external-intelligence|same-hour-run-dedupe-hides-recovery|20261025-v1
- Real 09:49 UTC partial source producer observation: 2 successes, 1 failure
- Real provider request 12509 at 09:50 UTC: HTTP 200, 3/3 successes, 27 search results, 1 admitted
- Root: hourly source observation dedupe key coalesced distinct provider executions into one event
- Fix: exact invocation timestamp in existing provider and canonical producer observation keys, URL-upsert still idempotent
- Regression in existing Required suite, protected merge, Supabase deployment, real run readback
- Status: CANDIDATE until exact CI, deployment and real observation proof; no synthetic results or revenue
