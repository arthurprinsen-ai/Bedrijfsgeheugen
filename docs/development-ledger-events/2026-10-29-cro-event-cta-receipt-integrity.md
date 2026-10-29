# 2026-10-29 — canonical CRO telemetry to evidence repair
**Obligation**: SITE-CRO-EVENT-LEAD-ORDER-PROOF-20261029
**Fingerprint**: powerhouse|cro|cta-event-alias-mismatch|20261029
**Owner**: existing Powerhouse Growth/SEO + ONE BRAIN/Heartbeat recovery writer.
**Issue**: #4446. **Implementation PR**: #5143. **Separate portal PR**: #5140.
**Live state**: SOURCE_COMMITTED / PENDING_PROTECTED_RELEASE; NOT_LIVE, NOT_REVENUE_VERIFIED.

## Observation and cause
Observed live Supabase base tables on October 29: 222,770 growth events (12,144 in last seven days), 0 rows in commercial_leads, 1 experiment assignment and 1 revenue-message policy. In the latest 30 days no positive revenue in powerhouse_sales_outcomes. The live SQL in bg_growth_ingest_event was not counting the website's emitted primary_cta_click, secondary_cta_click, money_link_click aliases in the daily CTA total. The existing Netlify replay accepted HTTP 200 without a matching RPC record receipt.

## Action and evidence
- Preserve single canonical bg_growth_ingest_event ingestion RPC and existing Netlify growth-drain scheduler.
- SQL migration reconciles first-party non-robot CTA IDs using idempotent aggregate repair.
- Netlify event replay and commercial outcome path check table, exact event/outcome ID, queue ID and stored XOR deduped. Invalid ACK stays queued.
- Canonical service-role-only read-only projection flags missing experiment-arm evidence, linked contact and provider readback.
- Two SQL read projections parsed successfully via Postgres EXPLAIN; 10 positive/negative JS receipt assertions passed in isolated evaluation (not entire CI).
- Regression tests and Brain-learning file added; not independent customer validation.
- PR original admission failure was missing required Base-SHA metadata; corrected using first commit's parent 1a7dbb3ddacef863f4fcb58b91868edd2cb0676c.
- Second Required admission error: INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:activity_ledger,brain_learning; both artifacts now included in this PR. Exact-head checks must rerun.

## Prevention, privacy and remaining verification
Never count 202 or submission intent as stored, qualified lead, paid order or revenue. Never promote an A/B experiment on one assignment or unmatched arms; require sample-size, SRM, matured controls and actual independent outcomes. Keep real contact/private customer data in authenticated systems only, no raw PII in public git. Retain per-ID durable idempotency and robot filter.

Release gates: Required+BRAIN+CodeQL, writer-lease, System Map reconciliation, exact main + Netlify deploy SHA, Supabase migration ledger/readback; consent denied/granted browser test, unique event receipt and persisted Supabase event ID; owner-only tenant-isolated portal verification; independent lead/order/payment provider proof. Record each step into existing Brain/Heartbeat. NOT_GREEN until all required evidence exists.
