# 2026-09-20 — SaaS pricing, checkout and entitlement delivery

Obligation: `BG-SAAS-PRICING-CHECKOUT-ENTITLEMENTS-20260920-01`

This change turns the existing pricing tiers into one canonical SaaS entitlement model. Control and Scale are designed for self-service subscription checkout; Enterprise remains sales-assisted. Every paid tier uses the same core intelligence. Commercial differentiation is enforced through operational leverage: connected-source limits, refresh cadence, automation mode, governance and advisory capacity.

## Delivery evidence

- Production Supabase now contains canonical plans, plan entitlements, checkout intents, subscriptions and usage counters.
- New billing tables are server-only with RLS; browser roles are revoked.
- `saas_active_entitlements` uses `security_invoker`.
- `/api/portal-entitlements` exposes the authenticated organisation entitlement projection.
- New connector creation enforces the purchased `data_sources` limit server-side.
- `/api/checkout/create` creates Stripe subscription Checkout sessions and fails closed when production billing is not configured.
- `/api/checkout/stripe-webhook` validates Stripe signatures before provisioning subscription state.
- The pricing page explains “same intelligence, more leverage” and routes Control/Scale to direct checkout.

## Failures encountered and closed

1. New route/test paths were initially unclassified by the delivery router. They were added to the canonical lane classification.
2. SaaS tables/functions were absent from the quality-surface registry. They are now registered with test evidence.
3. The schema security contract required explicit per-table revokes and a `security_invoker` view. Both were added and applied in production.
4. Repository migration timestamps initially did not match the already-applied production migration versions. Repository history now mirrors production versions exactly.
5. The checkout page initially missed required SEO metadata and later contained two H1 elements. Both site-contract defects were closed.
6. PR metadata initially omitted Delivery-Lane, Candidate-Type and Base-SHA. The candidate now carries complete immutable delivery metadata.

## External activation dependency

Online payment remains fail-closed until genuine production `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` values are configured in Netlify and Stripe is configured to send subscription events to `https://www.bedrijfsgeheugen.nl/api/checkout/stripe-webhook`. No secret is committed to GitHub.
