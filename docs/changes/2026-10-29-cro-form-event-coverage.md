# First-party website CTA and form-intent coverage

Date: 2026-10-29
Status: SOURCE_CANDIDATE_NOT_LIVE
Workstream: existing Powerhouse SEO Order Engine / issue #4900

## Public software change
The existing `bg-growth-measurement` script captures anchor CTA clicks. This candidate also captures explicitly marked button CTA actions and two **intent-only** stages for in-content forms: `form_start` and `form_submit_intent`. Both event types use the already established `/api/growth-event` pathway, event IDs and durable ingestion. This does not create another analytics system, scheduler, publisher, email tracker or CRM.

Only the declared CTA action name is sent. No input values, email addresses, names, form content or raw responses are sent. A submit intent is not evidence of completed delivery, permitted lead capture, a qualified lead, an order or realized revenue. Existing consent, tenant, first-party analytics and source-provenance constraints remain mandatory.

## Verification required
The existing Node regression file `tests/seo-order-measurement.test.mjs` checks generated JavaScript, once-only first form focus, button attribution, safe event allowlisting and rejection of PII. Full Required/BRAIN, CodeQL and repository integration controls must pass on the exact current candidate. Protected merge and a matching Netlify production commit/deploy ID are required, followed by independent public-page marker, browser event, Supabase ingestion and aggregate parity readback.

## Privacy boundary
This is public technical change documentation. It contains no private Brain record, private activity log, draft content, customer information, form submission, recipient identity or provider secret. Independent P0 security issue #5072 remains open. Do not publish any unapproved content or internal telemetry in the public repository.
