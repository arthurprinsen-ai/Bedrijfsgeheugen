# Development ledger — 2026-10-23

- Obligation: `portal|two-real-tenants|independent-signed-evidence-admission|20261023-v1`
- Canonical owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
- Fingerprint: `portal|customer-production-acceptance|deploy-green-without-two-real-tenant-outcome-and-learning-proof|20261023-v1`
- Writer: `feat/portal-independent-customer-acceptance-gate-20261023`; separate from PR #4796's goal-learning owner
- Base protected main: `ecbbba3916a30534a2aa7f0599a4ecad0c3177a4`
- Live source observation: read-only Supabase 2026-10-23, 1 portal state row, 0 connector definitions, 0 executions, 0 financial forecasts
- Change: signed read-only acceptance evaluator; regression in existing universal learning schedule, unchanged cron
- Negative tests: absent verifier, tampering, synthetic tenant, duplicate receipt, absent Brain ACK, missing outcome/forecast, stale exact SHA, tenant isolation fail
- Positive test: ephemeral local Ed25519 fixture only — not a real provider or customer receipt
- Customer outcome improvement: unknown / not claimed
- Next: exact-head Required+CodeQL; protected merge; independent signer/provider + A/B tenant production receipt and defensible Brain writeback, without second scheduler or security exception
- Status: CANDIDATE_UNVERIFIED
