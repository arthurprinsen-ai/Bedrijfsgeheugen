# Powerhouse Truth Reconciliation Learning v1

Fingerprint: `powerhouse-truth-reconciliation-stale-state-v1`
Date: 2026-09-17
Authority: Bedrijfsgeheugen Powerhouse / Supabase canonical state

## Problem

A technically healthy production estate can still be operationally unsafe when stale GitHub issues, synthetic blockers, retired Make-era recovery instructions and unresolved Supabase obligations remain mixed with current production truth. EXISTING-STATE-FIRST becomes unreliable if the state being read is historically correct but no longer current.

## Observed evidence

- Protected `main` is current and healthy, while older open issues still state that main protection is absent.
- Make is retired from the canonical Powerhouse architecture, while older open issues still prescribe BG168/BG166/Make replay routes.
- Supabase contained 4 ACTIVE blockers with explicitly synthetic scopes from 2026-08-31.
- Supabase still contained OPEN/BLOCKED obligations spanning current work and historical recovery state; current state therefore needs reconciliation rather than blind execution.
- Current real open work includes Supabase Auth hardening, social provider readback, whole-brain runtime proof and other production-verification obligations.

## Root cause

The system previously treated durable incident/history records and current executable obligations as if they were the same authority. State transitions were not always reconciled when architecture, provider authority or production evidence changed. Historical recovery instructions could therefore outlive the component or provider they referenced.

## Canonical prevention rules

1. **Current truth outranks historical instruction.** Before executing an obligation, verify its referenced authority, provider, component, environment and blocker still exist.
2. **Historical learning is immutable; executable state is not.** Preserve incident/learning history, but supersede or close obsolete executable obligations with explicit resolution evidence.
3. **Retired-provider instructions are never replayed.** Any obligation that depends on a retired provider (currently Make) must be migrated to the current canonical Supabase/GitHub-native path or closed as superseded.
4. **Synthetic proof records cannot stay ACTIVE.** Synthetic/test blockers require a terminal state after the proof run; production agents must exclude synthetic scopes from actionable queues.
5. **No stale P0/P1 authority.** Open GitHub issues describing controls that have since changed must be reconciled against fresh platform readback before they may drive recovery work.
6. **Every reconciliation is evidence-backed.** Closure/supersession records must contain current readback, reason, successor authority where relevant, and timestamp.
7. **Completion is bidirectional.** A change is not fully complete until both production truth and obligation/issue truth agree.
8. **Autonomous agents fail closed on ambiguity.** If current platform truth conflicts with an old issue/obligation, do not execute the old recovery path; create/continue one reconciliation obligation instead.

## Required reconciliation loop

`inventory -> classify current/stale/synthetic/retired-provider -> fresh readback -> resolve or migrate -> verify canonical state -> write learning -> regression guard`

Minimum classifications:
- `CURRENT_ACTIONABLE`
- `CURRENT_BLOCKED_EXTERNAL`
- `SUPERSEDED`
- `SYNTHETIC_PROOF_COMPLETE`
- `RETIRED_PROVIDER_MIGRATION_REQUIRED`
- `HISTORICAL_REFERENCE_ONLY`

## Regression requirements

The Powerhouse should continuously assert that:
- no ACTIVE blocker has a `synthetic:` scope beyond its bounded proof lifecycle;
- no actionable obligation references Make or another retired provider;
- no current-main governance issue contradicts direct GitHub branch-protection readback;
- open obligations are periodically reconciled against current production evidence;
- issue/obligation closure never deletes the underlying learning or evidence lineage.

## Definition of done for this learning

This learning is considered implemented only when the canonical Supabase learning/failure registry contains this fingerprint, one durable reconciliation obligation exists, and this documentation is merged through the protected-main path. Individual stale obligations/issues remain separate recovery work and must not be silently bulk-closed without evidence.
