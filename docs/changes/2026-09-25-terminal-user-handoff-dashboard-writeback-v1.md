# Terminal user handoff + dashboard writeback v1

Fingerprint: `delivery|terminal-user-handoff|dashboard-writeback|v1`

## Problem
A material recovery could still be surfaced to the user while gates/readback/writeback were pending. That transferred execution ownership implicitly and left the user without a deterministic next action.

## Contract
Material Powerhouse work now stays owned by the executing lineage until protected delivery, production/provider readback, outcome, learning/prevention, relevant skill projection, and registration/readback in the existing Powerhouse dashboard/current-state and activity lineage are complete.

Pending CI, an open PR, auto-merge, deploy-start, readback pending, documentation pending, skill pending, and dashboard writeback pending are internal states. They are not terminal user handoffs.

Only `BLOCKED_HARD_BOUNDARY` may return ownership early. The response must name exactly one smallest required human action while preserving the prepared continuation in canonical state.

## Existing dashboard registration
The rule is registered in the existing Notion Dashboard Hub (`3e4da36a-ac8a-81fb-b340-daccce80dec8`) and Canonical System Map (`3dcda36a-ac8a-8152-be3d-edbb32b06239`). No new dashboard or truth store is created.

## Migration ledger reconciliation
Supabase production registered `composio_content_fallback_governance_v1` as version `20260925074007`. Repository migration identity is renamed from `20260925073300` to that exact provider ledger identity so terminal migration readback is deterministic.
