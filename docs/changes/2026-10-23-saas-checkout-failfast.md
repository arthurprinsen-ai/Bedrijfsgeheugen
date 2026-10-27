# SaaS checkout configuration safety fix

The existing public pricing and self-service checkout remain under one Stripe/Supabase authority. The production Stripe configuration is currently incomplete, so real self-service subscriptions cannot yet be accepted.

A valid customer request now checks both required Stripe server-side secrets before accessing the plan database. With incomplete configuration it immediately returns HTTP 503 `billing_not_configured`, without contacting Supabase or Stripe. Invalid plans and contact details are still rejected; with a configured account, normal catalog-price verification, idempotent checkout and signed webhook provisioning are unchanged. The existing checkout UI explains that online payment is unavailable.

Release requires exact-head Required, CodeQL, Netlify preview, protected merge and production readback. Commercial acceptance separately requires authorised Stripe production keys in secret settings, webhook events delivered to `https://www.bedrijfsgeheugen.nl/api/checkout/stripe-webhook`, a real approved purchase, and negative tenant-isolation tests for two genuinely distinct customers. No secret values belong in GitHub or logs.

Incident and test: `brain/learning/2026-10-23-saas-checkout-unconfigured-failfast-v1.json`; `tests/brain-saas-checkout-unconfigured-failfast-v1.test.mjs`. Owner: existing Powerhouse/Brain/Heartbeat SaaS loop, no duplicate scheduler.
