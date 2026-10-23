# SaaS checkout preflight availability — 23 October 2026
Obligation-ID: website|saas-checkout|preflight-provider-availability|20261023-v1
Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Base-SHA: 82609b2175ce60e3991f998976471c62bb6b335a

Observed: Netlify has no STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET registered, and Supabase has no SaaS subscriptions or checkout intents. The checkout endpoint has been safely made fail-closed by merged PR #4814, yet the rendered pricing-to-checkout page still shows enabled company/email fields and payment CTA before informing visitors the provider is unavailable. That contradicts a truthful SaaS buying journey.

Fix: Reuse GET /api/checkout/readiness without session_id; block the form and its company/email inputs by default until a successful HTTP response explicitly reports selfServeAvailable=true. If not ready, show the existing Dutch payment-unavailable text in aria-live status and disable the submit button; no checkout or event writes. Preserve existing success-session server confirmation flow irrespective of new purchase availability. Keep the same billing authority and single scheduler.

Independent browser tests: desktop/mobile, Dutch/English, mocked provider-ready response for normal checkout plus mocked blocked state with no checkout-create call; never execute a real payment in CI. Required/CodeQL and production Netlify readback are needed before claiming live. Root cause and replay recorded in canonical Brain learning.
