# P0 #4215 — lossless cross-domain portal input impact delivery

Date: 2026-10-20
Parent-P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Existing PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4214
Obligation-ID: p0-4215-lossless-cross-domain-input-impacts-20261008
Delivery-Lane: portal
Candidate-Type: recovery

## Root cause and corrective code
Existing five-file impact/data-state candidate now integrated losslessly on protected main dd7e59484651bb6e3cb8902eaf467af15926075b, without replacing canonical tenant storage. Previous 50-record truncation loses field-level impact, while inflight mutations can otherwise be acknowledged as an earlier snapshot. Use the existing portal domain-state queue and Brain writer, preserve every impact, acknowledge only persisted writes, and retain later changes. Financial and external source mutations drive context-specific re-review; no invented monetary outcomes.

## Acceptance and source evidence
Production read-only inventory on 20 October: Supabase Auth 1 account / signed in 1, portal_state_layers 1 tenant, Brain records spanning 3 tenant IDs, portal_financial_forecasts_v1 0 rows / 0 tenants. These are private counts only, not names or identities; the 3 Brain tenants are not authenticated customer accounts. A passing local regression does not prove 2 independent customer sessions or dashboard finance values.

Historical, shadow, canary: tests/brain-p0-4215-lossless-form-impact-closure.test.mjs imports portal-v2/tests/all-field-brain-delivery-lossless.test.mjs. Safety: no production customer writes or synthesized revenue. Required CI, CodeQL, Netlify approved preview, protected merge, immutable deployment, and tenant A/B write→sourceRevision→Brain/Heartbeat ACK→all affected dashboards/finance plus negative cross-tenant readback remain mandatory. Financial evidence must carry actual source/provenance. Publication/email/DM provider receipts remain separately blocked.

Current phase: REVIEW_CANDIDATE, NOT_LIVE_PROVEN.
