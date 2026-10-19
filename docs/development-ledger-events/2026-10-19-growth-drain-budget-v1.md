# Growth-drain bounded replay recovery — 2026-10-19
Obligation-ID: `powerhouse-growth-drain-15s-client-cutoff-20261019`
Idempotency: `growth-drain|netlify-499-runtime-budget|20261019`
Evidence: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4446

## Observed before change
Netlify's 24-hour observability counted 1,316 HTTP 499 client disconnects and 1,422 HTTP 204 responses on the scheduled `growth-drain` endpoint; p99 ~15 seconds. Independent request logs show some 499 invocations still write ten persisted records later. Do not infer lost evidence from a request timeout alone. Source code lists the entire blob catalog and starts up to 10 sequential mutating event/outcome cycles, always favoring event rows.

## Bounded repair (candidate)
Cooperative 10.5-second attempt window and 8-second remaining work reserve; paginated Netlify Blob traversal; alternating event/outcome priority each UTC minute; don't rewrite already-persisted records with currently disabled delivery. No new state store, no new scheduler, no automatic enablement, no data deletion or manual cleanup. Existing logical event IDs, Supabase ingest contract and provider receipts remain authoritative. An individual stalled I/O can still exceed the cooperative clock; full guaranteed termination requires an independently controlled async worker and lease, subject to separate authenticated evidence.

## Tests and prevention
`tests/brain-growth-drain-time-budget-v1.test.mjs` covers checkpointing before provider calls, resume, no duplicate persisted disabled transport, fairness and reactivation when an authorized provider is configured.

## Acceptance
Required CI, CodeQL, protected merge, Netlify exact commit/deploy and independent scheduled production telemetry. Success requires lower 499 rate without increased backlog age, lost events or duplicate provider receipts. RLS and other lanes unchanged. Terminal status stays unproven until after live readback and actual operational outcome.
