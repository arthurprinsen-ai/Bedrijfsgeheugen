# SaaS pricing and entitlement architecture

## Commercial rule

Bedrijfsgeheugen does not sell a deliberately weaker AI in lower paid tiers. Control, Scale and Enterprise use the same core intelligence. Customers pay for more operational leverage: more connected data, faster freshness, more autonomous execution, stronger governance, multi-entity scale and additional advisory capacity.

## Canonical authority

`public.saas_plans` and `public.saas_plan_entitlements` are the server-side source of truth. Checkout reads price and self-service eligibility from that model. Portal services read the organisation's active subscription projection. Runtime services must use those entitlements for enforcement instead of trusting browser state.

Current self-service tiers:
- Control: €1,495/month, up to 5 sources, daily refresh, recommend mode.
- Scale: €2,495/month, up to 15 sources, hourly refresh, approval-required automation.
- Enterprise: from €4,995/month, sales-assisted, multi-entity/SSO/audit/guardrailed autonomous workflows.

## Subscription lifecycle

1. Customer selects Control or Scale on the pricing page.
2. Checkout endpoint validates the canonical plan and `direct_checkout`.
3. Hosted Stripe Checkout handles the subscription payment.
4. Signed Stripe webhook is the payment-provider authority for subscription lifecycle events.
5. Organisation/customer/invitation/subscription state is provisioned server-side.
6. Portal resolves the authenticated tenant and returns its active entitlements.
7. Runtime services enforce purchased limits server-side.

## Security and failure behavior

Billing and entitlement tables are not browser-readable. RLS is enabled and anon/authenticated table grants are revoked. Webhook signatures are verified. If Stripe production secrets are absent, checkout and webhook endpoints fail closed rather than pretending billing is active.

## Learning / prevention

Root cause across the first delivery attempts was cross-layer registration drift: adding product surfaces without simultaneously extending the delivery classifier, quality-surface registry, migration identity, PR metadata and global HTML contracts. Prevention is to treat those controls as part of the same SaaS feature definition-of-done. Evidence lives in `brain/learning/saas-pricing-checkout-entitlements-2026-09-20.json` and `docs/development-ledger-events/2026-09-20-saas-pricing-checkout-entitlements-v1.md`.
