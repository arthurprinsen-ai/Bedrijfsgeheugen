---
name: powerhouse-truthful-green-assurance
description: Use whenever checking, repairing, reporting or closing Powerhouse health, green/red status, end-to-end loops, evidence freshness, provider failover, daily execution or system-wide assurance.
---

# Powerhouse Truthful Green Assurance

Fingerprint: `powerhouse|truthful-green-assurance|current-evidence-only|v1`.

## Purpose
Make “green” mean objectively working now. Never optimize the dashboard label; repair the underlying capability and recompute health from current canonical evidence.

## Green contract
A capability is green only when every required step relevant to that capability is proven:

`trigger → execution → action → exact external/provider/runtime readback → outcome/evidence → learning/writeback`.

A commit, workflow success, provider ACK, generated asset, queued publication, stale prior proof or human statement is not enough by itself.

## Required operating rules
- Start from canonical current state and classify every gap as current-required, current-optional, retired, historical/pre-contract or hard external boundary.
- Repair root cause. Do not delete evidence, hide rows, alter requirements or rewrite status merely to make a dashboard green.
- Re-read the exact provider/runtime result after mutation and then recompute health.
- Provider-neutral capabilities may use an approved alternative governed producer with fresh provenance.
- Preserve historical evidence append-only.
- Already-created external side effects are immutable. Reconcile exact IDs; never republish/re-send to obtain evidence.
- Daily social/content green requires each operational channel to reach its own terminal proof without duplicate publication.
- Security, IAM, destructive, legal/financial or explicit human-consent boundaries remain fail-closed.
- Write every material assurance learning back to the existing Brain/skills/AGENTS/ledger/docs/System Map lineage.

## Canonical sources
- `config/powerhouse-truth-status-contract.json`
- `brain/policies/powerhouse-agent-continuity-v1.json`
- `public.powerhouse_one_brain_runtime_health_v1`
- `public.powerhouse_terminal_control_plane_health_v1`
- `public.powerhouse_evidence_operating_health_v3`
- `public.powerhouse_evidence_source_coverage_v1`
- `platform/system-map/canonical-system-map.mjs`

## Terminal rule
Only report green when a fresh health recomputation and exact readback support it. Otherwise continue autonomous repair until a true hard boundary is reached.
