# Powerhouse CRO actual event + lead/order provenance ledger

Date: 2026-10-29
Status: CANDIDATE — NOT_DEPLOYED
Obligation-ID: SITE-CRO-EVENT-LEAD-ORDER-PROOF-20261029
Owner: existing Growth/SEO/ONE BRAIN owner; current P0 issue #4446.
Fingerprint: `powerhouse|cro|cta-event-alias-mismatch|20261029`

- Existing HTTP datahub RPC undercounts the client-emitted CTA event type aliases in `growth_page_daily`. Existing Netlify `growth-replay`/outcome assumed HTTP OK meant Supabase commit without validating event ID + queue ID + exact persisted/deduplicated result.
- Fixed via one canonical RPC migration, cautious non-robot historical reconciliation, and fail-closed exact backend ACK contract without adding a second writer/scheduler.
- Added service-role-only security-invoker projections for observed persisted events, controlled experimental treatment/holdout maturity, recorded leads, linked qualification and provider-evidenced orders.
- Validation at candidate phase: SELECT/EXPLAIN parses against the actual production PostgreSQL schema; ten matching/mismatching receipt contract checks pass in isolated JavaScript. These are **not** a production write/readback or true experiment test.
- Before protected merge: Required/BRAIN/CodeQL, source and migration guards, lease-owner contract. After: exact live Netlify SHA, Supabase migration log, real consented browser event ID persisted in source and aggregated daily view, two authenticated tenant visibility checks, trial assignment maturity, independent order proof.
- Measured: 222,770 persisted growth events, 12,144 in past week, 0 `commercial_leads` and only 1 experiment assignment, no independently verified paid order. Never turn missing data into zero uplift or sales.
- Keep #5140 `Andere data` portal visibility on its own guarded release path; #5143 implements the underlying data accuracy, not the portal UI deployment.
- No invented customers, fabricated provider IDs or bypassed verification steps; no customer PII, API tokens, direct paid retry or private logs committed.
- Human details: `docs/changes/2026-10-29-growth-event-cta-and-commercial-evidence.md`; prevention learning: `brain/learning/2026-10-29-cro-event-ack-cta-conversion-v1.json`.
