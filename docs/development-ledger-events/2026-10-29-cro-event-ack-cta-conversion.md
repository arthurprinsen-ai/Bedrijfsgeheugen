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

## Verifieerbare incidentwriteback en agentoverdracht

- Supabase `public.brain_observe_failure` invoked once with stable occurrence `github:arthurprinsen-ai/Bedrijfsgeheugen:pr:5143:20261029-cta-alias-runtime`, content-derived SHA-256 and deduplicated fingerprint `powerhouse|cro|cta-event-alias-mismatch|20261029`.
- Verified registry readback: `maturity=OBSERVED`, `occurrence_count=1`, `version=1`, `root_cause`, `prevention_rule`, `regression_ref` populated, `proven_fix=NULL`. The registry is the existing authority; no second incident table.
- Existing `AGENTS.md` now routes current/future CRO/SEO/revenue/portal/release agents through this fingerprint, the ONE BRAIN registry, relevant skill and independently validated proof gates. Existing SEO conversion skill includes exact event-type parity, strict per-event Supabase ACK, experiment holdout, lead/paid-order provenance and portal tenant constraints.
- Human instructions and worked historical anomaly (2026-10-01 `/over-ons`: 1 persistently observed `primary_cta_click`, daily rollup 0) documented in `docs/changes/2026-10-29-growth-event-cta-and-commercial-evidence.md`.
- CI admission initially rejected missing Base-SHA metadata, repaired to immutable branch parent `1a7dbb3ddacef863f4fcb58b91868edd2cb0676c`. Second failure `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:activity_ledger,brain_learning` corrected with canonical learning/ledger. Supabase source contract rejected replaced `SECURITY DEFINER` function without explicit role revocation; migration now preserves production `anon=false/authenticated=false/service_role=true`.
- Latest modified HEAD requires fresh **exact-head** Required, CodeQL, migration source contract and protected release. Earlier green job or CodeQL on a different SHA **does not** satisfy the newest head.
- Final state **CANDIDATE_NOT_LIVE / REAL_LEADS_UNVERIFIED / ORDERS_UNVERIFIED** until actual main→Netlify→Supabase→browser→portal→provider evidence. No fake lead, invoice or order row was inserted.
