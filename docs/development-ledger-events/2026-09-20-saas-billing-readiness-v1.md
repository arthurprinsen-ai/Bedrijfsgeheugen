# 2026-09-20 — SaaS billing readiness v1

This follow-up makes payment-provider activation an explicit runtime contract instead of an implicit environment assumption.

- `platform/saas/billing-readiness.mjs` requires both `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
- `/api/checkout/create` fails closed unless both are present.
- `/api/checkout/readiness` exposes only provider/state/selfServeAvailable and never secret names or values.
- The SaaS regression suite verifies blocked and ready states.

Current production observation at implementation time: Stripe production credentials are absent in Netlify, so self-service billing must remain blocked until genuine provider configuration is supplied.
