# Development ledger — fast terminal delivery v2

- Date: 2026-09-19
- Obligation-ID: powerhouse-fast-terminal-delivery-v2
- Trigger: GitHub cleanup exposed avoidable terminal latency and a false-hard-failure path in Obligation Terminal Closure.
- Root cause: known failed canonical production readback exited before descendant proof; delivery scheduling lacked one explicit critical-path authority across chats/agents.
- Change: bounded fast canonical wait, direct descendant fallback, predictive landing coalescing, core agent/skill authority updated.
- Guard: speed may reduce waiting/duplicate work but may not bypass exact-head gates, protected merge, security, main containment or production proof.
- Status: RECOVERABLE_INCOMPLETE until exact-head gates, protected merge and production readback succeed.
- Governance incident: PR #2354 reached terminal closure while a late exact-head Required run exposed one stale release-lane assertion.
- Root cause: terminal closure did not independently aggregate exact-head Required/BRAIN/CodeQL before writing terminal state.
- Prevention: terminal closure now fails closed on any non-green/latest exact-head critical gate, and the stale browser-risk assertion is aligned with the bounded fast-fix contract.

