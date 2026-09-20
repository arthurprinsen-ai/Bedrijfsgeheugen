# 2026-09-20 — SaaS refresh entitlement v1

The pricing model already defined freshness as paid operational leverage, but connector activation did not yet enforce that commercial contract.

This change closes the runtime gap:

- Control minimum interval: 1440 minutes.
- Scale minimum interval: 60 minutes.
- Enterprise entitlement value 0 supports event/realtime/custom cadence.
- Missing requested cadence safely defaults to the active plan cadence.
- Faster-than-plan activation fails closed with `PLAN_REFRESH_LIMIT`.
- No active subscription fails closed with `SUBSCRIPTION_REQUIRED`.
- The effective cadence and plan constraint are persisted into connector runtime state at activation.

The rule is centralized in the SaaS entitlement policy and reused by the portal connector activation boundary.
