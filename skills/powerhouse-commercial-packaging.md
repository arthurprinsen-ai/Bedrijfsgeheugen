# Powerhouse commercial packaging

Use this skill for pricing, packaging, checkout, consulting bundles and Portal V2 entitlements.

## Canonical rules
1. `config/commercial-offers-v1.json` is the commercial catalog.
2. Public SaaS plans are Starter, Pro, Groei and Enterprise.
3. Every public feature or limit must match server-side entitlement truth.
4. Portal V2 derives the active plan from `/api/portal-entitlements`.
5. Checkout uses the exact canonical plan code; Enterprise is sales-led.
6. Consulting packages state temporary portal plan and duration where included.
7. A commercial change is incomplete until pricing, checkout, portal access, server-side plan data, tests and production readback agree.
8. Legacy Control and Scale are not public offers.
