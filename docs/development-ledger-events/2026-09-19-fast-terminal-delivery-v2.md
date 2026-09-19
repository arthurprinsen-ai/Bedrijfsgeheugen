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
- Parallel PR #2356 contained a useful unique optimization. Its route mapping and high-risk-only sitewide browser rule were coalesced into this canonical successor instead of keeping a duplicate delivery lane.

## Recovery — stale terminal readback oracle

- Trigger: exact-head BRAIN run for merged PR #2358 failed in backend and automation lanes.
- Root cause: two historical regression tests still encoded the retired cancelled-only descendant-fallback rule.
- Fix: align both tests with the canonical non-green -> independently verified descendant-live contract and add them to the learning historical replay set.
- Safety: no runtime workflow, branch protection, production proof or security gate is weakened; this recovery changes test authority and documentation only.
