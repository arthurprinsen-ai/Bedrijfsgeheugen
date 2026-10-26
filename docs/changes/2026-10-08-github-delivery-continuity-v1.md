# GitHub Delivery Continuity v1 — 2026-10-08

## Context and observed failure
The existing five-minute `Powerhouse Delivery Recovery Supervisor` runs independently of a ChatGPT conversation. It already delegates protected checks to Required, CodeQL and the canonical production/obligation-closure authority. Inspection found a stale-queue branch that called an undefined `dispatch_brain`, a duplicate-run detector that relied on a display title without an immutable head identity, and a 24-hour closure recovery horizon that could strand merged obligations after a longer interruption.

## Scope of this recovery candidate
- Keep the existing scheduled GitHub control plane. **No new workflow, scheduler, content publisher, database writer or parallel source of truth.**
- Give Required workflow runs an immutable PR-number + candidate-SHA display identity (also retain native pull-request head-SHA evidence).
- Detect active exact-head Required runs before dispatch and suppress duplicate recovery.
- Remove the nonexistent `dispatch_brain` call. BRAIN is deliberately not dispatched by this supervisor.
- Count recovery budget only after a real dispatch or cancellation; do not consume it on a no-op.
- Recheck merged, nonterminal obligations across seven days rather than 24 hours, with a 90-minute re-dispatch cooldown and a hard three-attempt cap for canonical terminal closure.
- Preserve the existing queue circuit breaker, exact-head writer lease, same-lineage refresh requirements, branch protection, CodeQL, protected auto-merge, and production authority/readback checks.

## Truth and safety conditions
A green supervisor workflow means that a supervisor pass completed, **not** that any candidate is live. Only the canonical `Obligation Terminal Closure` can assert `Terminal-State: LIVE_BEWEZEN`, and only after its protected merge, exact-head gates, production readback, provider checks and durable control-plane evidence succeed.

A deterministic check or production failure remains nonterminal after bounded retries. Manual or separately reviewed repair may be required; the scheduler must not falsely turn a failed action into green. No bypass merge and no temporary disabling of safeguards is authorized.

## Validation
- `node --test tests/delivery-powerhouse-supervisor.test.mjs`
- `node tools/ci/check-control-plane-budget.mjs`
- `node tools/ci/check-pr-trigger-ratchet.mjs`
- Exact-head Required + relevant CodeQL/preview → protected merge → canonical production readback → durable terminal claim.

Current evidence status: **CANDIDATE_ONLY**, not live-proven. This document is design/change evidence, not independent production proof.
