# SaaS entitlement enforcement v2

Paid capabilities are now interpreted through one server-side policy module: `platform/saas/entitlement-policy.mjs`.

Rules:
- No active/trialing/past-due subscription projection means paid capability access fails closed.
- Numeric entitlements are enforced as maximum purchased capacity.
- Boolean entitlements such as SSO or audit trail are explicit true/false capabilities.
- Named modes such as `recommend`, `approval_required` and `guardrailed_autonomous` are treated as plan policy, not browser state.
- Connector creation uses the same policy and therefore cannot bypass the purchased source limit by calling the backend directly.

This module is the intended reusable authority for future agent, SSO, audit and automation gates.
