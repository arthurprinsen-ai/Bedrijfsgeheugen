# 2026-09-21 — SaaS agent-mode enforcement v1

The commercial plan model already distinguished recommend, approval-required and guardrailed-autonomous behavior. This change makes that distinction executable in the existing Agent Fabric.

- The Agent Fabric gateway resolves the active tenant entitlement server-side before any transition to `Executing`.
- Missing resolver fails closed with `AGENT_ENTITLEMENT_RESOLVER_REQUIRED`.
- `recommend` blocks execution.
- `approval_required` requires explicit approval evidence with approver and timestamp.
- `guardrailed_autonomous` permits the plan gate, but the existing autonomy envelope still evaluates policy, autonomy level, risk, blast radius, reversibility, tests, verifier and budget.
- Non-execution lifecycle transitions remain unaffected.
