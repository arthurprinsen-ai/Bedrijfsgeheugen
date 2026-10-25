# Development ledger event — 2026-10-25 — commerciële evidence-kwalificatie

- Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Fingerprint: `growth|daily|latent-demand-2900-without-buyer-proof|20261025-v1`
- Canonical owner: existing daily Growth Intelligence and commercial Heartbeat
- State: `CANDIDATE_NOT_PRODUCTION_PROVEN`
- Findings: 837 open opportunities, all without positive economic value evidence in opportunities table; 9 quotes of which 4 signed; independent Sales/Revenue outcome sum €0. Existing latent-demand daily builder gave every engagement-company an assumed €2900.
- Root cause: score-driven economic hypothesis was written as per-buyer value without first-party purchase evidence; independent discovered SQL gate: numeric forecast columns are NOT NULL, so null attempt would fail canonical batch.
- Minimal repair: exact `opportunity_key` sales-event assessment, need-discovery qualification, bounded missing-evidence classification, daily Brain writeback with observed/unexecuted state, commercial portfolio evidence gates, account-specific source refs, existing numeric zero sentinel and true unknown flag, payment-receipt dedupe; no new scheduler.
- Prevent: never treat engagement as purchase intent, accepted quote as cash, old provider events as fresh, or an unverified numeric estimate as real. Do not write SQL-null to existing NOT NULL columns. Require exact tenant/contact and provider guards on any actual contact.
- Tests: `tests/brain-commercial-opportunity-evidence-20261025.test.mjs`, `tests/brain-commercial-opportunity-daily-integration-20261025.test.mjs`, existing `tests/growth-intelligence-daily.test.mjs`.
- Production acceptance remaining: exact current-head Required, CodeQL, protected main merge, exact-SHA Netlify READY, future genuine daily schedule readback, real provider stage receipts and first independently verified orders/revenue. The historical P0 #4198 remains open until independently proven.

Duplicate incident policy: reuse canonical issue #4198 and learning fingerprint; do not create another queue, incident registry or second executor.
