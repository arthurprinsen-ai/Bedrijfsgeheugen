# 2026-09-20 — SaaS entitlement enforcement v2

Follow-up on `BG-SAAS-PRICING-CHECKOUT-ENTITLEMENTS-20260920-01`.

The first production delivery proved pricing, checkout scaffolding, subscription storage and a source-count gate. V2 removes duplicated plan logic by introducing `platform/saas/entitlement-policy.mjs`.

The policy normalizes active subscription status and exposes one fail-closed interpretation for numeric limits, boolean capabilities and named modes. Connector creation now requires an active subscription and reads the maximum source count from this central policy. This prevents a future UI or connector endpoint from silently diverging from the purchased plan.

Regression coverage remains in `tests/saas-pricing-entitlements.test.mjs`, already wired into the backend release lane on main.
