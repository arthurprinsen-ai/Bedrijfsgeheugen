# CRO website event coverage — public software change record

Date: 2026-10-29
Status: NOT_LIVE; candidate requires current-head gates and exact production verification
Obligation-ID: cro-website-event-coverage-20261029
Owner: existing Powerhouse SEO Order Engine

- Source-level fix: observe explicitly marked button CTA clicks alongside ordinary anchor clicks.
- Source-level fix: emit `form_start` only on the first focus in a main-content form; emit `form_submit_intent` on form submit attempts, never imply server success.
- Backend: extend the existing privacy-preserving event-type allowlist; retain recursive PII-field rejection.
- Regression: `tests/seo-order-measurement.test.mjs`, including generated JavaScript validity and forbidden form-value assertions.
- Provenance: public source-level code and tests only. No original visitor data, raw form information, private Brain learning, draft content, internal tasks or tenant/customer information is included.
- Delivery boundary: Required/BRAIN/CodeQL, single-writer protected merge and exact Netlify/site event-provider readback are still required.
- Outcome: actual browser collection, provider persistence and downstream qualified leads/orders/revenue remain unverified until independently measured.

This file is a generic public development record and is not an internal activity-ledger export.
