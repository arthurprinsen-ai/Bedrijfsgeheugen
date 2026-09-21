# SaaS agent-mode enforcement

Customer-facing AI autonomy is a plan entitlement, not a UI label.

Execution semantics:
- Control: `recommend` — agents may analyse and recommend, but cannot transition work into execution.
- Scale: `approval_required` — execution needs explicit approval evidence.
- Enterprise: `guardrailed_autonomous` — the plan permits autonomous execution, but normal safety controls remain authoritative.

The Agent Fabric gateway requires a trusted server-side entitlement resolver for `Executing` transitions. Client-supplied plan mode is never trusted.

Plan permission does not override safety. High-risk or high-blast-radius actions, non-reversible changes, missing tests/verifier, denied policy or missing budget continue to block execution.
