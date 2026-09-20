# SaaS refresh entitlement enforcement

Freshness is an operational-leverage entitlement.

A connector can be drafted and tested with any desired cadence, but it can only become **Active** when that cadence is allowed by the organisation's active SaaS plan.

Runtime rules:

- Control: no faster than every 1440 minutes.
- Scale: no faster than every 60 minutes.
- Enterprise: 0 represents event/realtime/custom capability.
- No explicit cadence: use the plan cadence as the safe default.
- No active subscription: activation is blocked.
- Requested cadence faster than plan: activation is blocked with `PLAN_REFRESH_LIMIT`.

The activation response does not depend on UI enforcement; the server is authoritative.
