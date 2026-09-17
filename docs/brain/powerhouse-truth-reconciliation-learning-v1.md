# Powerhouse Truth Reconciliation Learning v1

Fingerprint: `powerhouse-truth-reconciliation-stale-state-v1`
Date: 2026-09-17
Authority: Bedrijfsgeheugen Powerhouse / Supabase canonical state
Runtime reconciliation authority: `powerhouse-canonical-truth-closure-v1`

This document records a specific stale-state failure class and its prevention rules. It does **not** create a parallel runtime authority. The existing `powerhouse-canonical-truth-closure-v1` remains the canonical reconciliation authority.

## Problem

A technically healthy production estate can still be operationally unsafe when stale GitHub issues, synthetic blockers, retired Make-era recovery instructions and unresolved Supabase obligations remain mixed with current production truth. EXISTING-STATE-FIRST becomes unreliable if the state being read is historically correct but no longer current.

## Observed evidence

- Protected `main` is current and healthy, while older open issues still state that main protection is absent.
- Make is retired from the canonical Powerhouse architecture, while older open issues still prescribe BG168/BG166/Make replay routes.
- Four historical `synthetic:` blocker records were already reconciled to `RESOLVED` by the existing canonical truth-closure flow; they remain as evidence, not actionable recovery state.
- Supabase still contains current OPEN obligations under `powerhouse-canonical-truth-closure-v1`, including `powerhouse-business-outcome-loop-v1` and `powerhouse-operations-assurance-v1`. These are real evidence gaps and must remain open until production evidence satisfies their completion gates.

## Root cause

The failure class is treating durable incident/history records and current executable obligations as if they were the same authority. Historical recovery instructions can outlive the component, provider or governance state they referenced unless current truth is reconciled back into executable state.

## Canonical prevention rules

1. **Current truth outranks historical instruction.** Before executing an obligation, verify its referenced authority, provider, component, environment and blocker still exist.
2. **Historical learning is immutable; executable state is not.** Preserve incident/learning history, but supersede or close obsolete executable obligations with explicit resolution evidence.
3. **Retired-provider instructions are never replayed.** Any obligation that depends on a retired provider (currently Make) must be migrated to the current canonical Supabase/GitHub-native path or closed as superseded.
4. **Synthetic proof records cannot stay ACTIVE.** Synthetic/test blockers require a terminal state after the proof run; production agents must exclude synthetic scopes from actionable queues.
5. **No stale P0/P1 authority.** Open GitHub issues describing controls that have since changed must be reconciled against fresh platform readback before they may drive recovery work.
6. **Every reconciliation is evidence-backed.** Closure/supersession records must contain current readback, reason, successor authority where relevant, and timestamp.
7. **Completion is bidirectional.** A change is not fully complete until both production truth and obligation/issue truth agree.
8. **Autonomous agents fail closed on ambiguity.** If current platform truth conflicts with an old issue/obligation, do not execute the old recovery path; continue the existing canonical truth-closure flow instead of creating another reconciliation system.

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
- issue/obligation closure never deletes the underlying learning or evidence lineage;
- no agent creates a second truth-reconciliation authority when `powerhouse-canonical-truth-closure-v1` already owns the concern.

## Applied learning in this session

A new `powerhouse-truth-reconciliation-v1` obligation was initially created while documenting this learning. Fresh readback then showed that `powerhouse-canonical-truth-closure-v1` already owned the runtime concern and had already reconciled the synthetic blockers. Following REUSE-FIRST / CANONICAL-INTEGRATION, the new obligation was immediately marked `FULFILLED` with classification `SUPERSEDED_BY_EXISTING_CANONICAL_AUTHORITY` and successor evidence pointing to the existing truth-closure flow. This is intentional evidence that duplicate authorities must be removed as soon as they are detected.

## Definition of done for this learning

The learning is documented when its failure fingerprint is present in the canonical learning/failure registry and this human-readable record is merged through protected `main`. Runtime work continues only through the existing `powerhouse-canonical-truth-closure-v1` obligations; no parallel reconciliation queue, scheduler or authority is introduced.
