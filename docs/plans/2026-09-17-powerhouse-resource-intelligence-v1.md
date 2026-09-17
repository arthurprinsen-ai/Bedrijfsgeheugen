# Powerhouse Resource Intelligence v1 — Implementation Plan

**Date:** 2026-09-17
**Goal:** make resource intelligence, evidence quality and continuous optimization a canonical Powerhouse capability used by all relevant agents/chats without creating a parallel authority plane.

## Architecture constraints

- Reuse `public.powerhouse_resource_impact_v1` and `public.powerhouse_business_value_v1` as canonical resource/business-value authorities.
- Unknown physical telemetry is `NULL`, never synthetic zero.
- Every physical estimate carries method/provenance and confidence.
- Evidence-oriented compliance state never asserts blanket legal compliance.
- Autonomous optimization is limited to safe, reversible actions and remains subordinate to existing BG169 production authority, security/integrity gates and rollback rules.
- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.

## TDD delivery sequence

1. Add `tests/powerhouse-resource-intelligence-contract.test.mjs` first and wire it into the backend/required test lanes. The contract must fail until implementation exists.
2. Add an additive Supabase migration that extends the canonical resource ledger with nullable energy/water telemetry, provenance/confidence, compliance evidence, optimization candidates and daily intelligence views/functions.
3. Add `config/powerhouse-resource-intelligence-v1.json` as machine-readable policy for agent decisions, confidence thresholds, NULL semantics, autonomy bounds and daily learning.
4. Add `scripts/brain/resource-intelligence-audit.mjs` to validate configuration/migration/workflow/agent wiring and fail closed on drift.
5. Add a daily + manual GitHub workflow that runs the audit/contracts and routes optimization through existing delivery authority; it may discover/prioritize opportunities but may not bypass BG169 or perform destructive/paid/security-weakening actions.
6. Update `AGENTS.md` so all relevant agents/chats read resource/business-value evidence before applicable decisions and write measured outcomes back afterward.
7. Register the capability in `powerhouse/assurance/component-registry.json` and existing lane coverage.
8. Inspect Portal V2 conventions; expose only provenance-aware fields if an existing canonical surface can be extended without creating a second state store.
9. Open PR, run required gates, fix all RED states, and merge only when protected-branch requirements are terminal green.
10. Verify exact production/readback evidence and write learning/remaining obligations back into Powerhouse. No `LIVE & BEWEZEN` claim without fresh evidence.

## Acceptance criteria

- Canonical resource rows support energy and water as nullable physical telemetry with provenance/confidence.
- CO2e has explicit provenance/confidence alongside legacy compatibility fields.
- Daily resource intelligence exposes cost, tokens, CO2e, energy, water and business value without converting unknown values to zero.
- Compliance evidence has explicit evidence status, provenance, confidence and review state.
- Optimization candidates include baseline, expected impact, confidence, safety class, rollback and measured outcome fields.
- All autonomous actions remain bounded by existing Powerhouse authority and rollback contracts.
- All relevant agent instructions reference the capability.
- Required CI and backend lane tests are green, followed by exact merge/deploy/readback evidence.