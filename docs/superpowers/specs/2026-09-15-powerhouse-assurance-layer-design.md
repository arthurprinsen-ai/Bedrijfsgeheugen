# Powerhouse Assurance Layer v1 — Design

## Goal
Make documentation, operational evidence and recovery status enforceable parts of the existing Bedrijfsgeheugen Powerhouse so that a component can only be treated as fully live when code/runtime, tests, production evidence, documentation, security, observability, recovery, cost/capacity and learning lineage are all accounted for.

## Constraints
- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- No parallel brain, database, queue, calendar, analytics store or learning store.
- Supabase/Powerhouse remains runtime/data authority; GitHub current main + required checks remains code/release authority; providers remain execution authority; Notion remains human knowledge/audit projection.
- `LIVE & BEWEZEN` is invalid while a required coverage dimension is missing or stale.
- Existing evidence-first calibration, market-truth, Portal V2, canonical scan loop, resource footprint and no-partial-stop contracts are reused.

## Architecture
The Assurance Layer is a control-plane capability over existing Powerhouse components. A machine-readable registry in GitHub defines the expected component inventory and assurance contract. A deterministic audit script evaluates required dimensions and emits a stable JSON report. GitHub CI runs the audit as a required-style gate. Runtime drift/recovery/parity inputs are represented as evidence records consumed by the audit rather than creating a second source of truth.

Flow:

`discover current components -> registry -> deterministic coverage audit -> CI gate -> runtime/provider proof -> open obligation on gap -> learning/writeback -> documentation projection`

## Component registry
Every active or experimental production-affecting component has one canonical record with at least:
- `canonical_id`
- `name`
- `lifecycle`: `experimental|active|deprecated|retired|superseded`
- `authority`
- `code_paths`
- `runtime_surfaces`
- `docs`
- `owner`
- `dependencies`
- `data_contract`
- `security_contract`
- `observability_contract`
- `recovery_contract`
- `cost_capacity_contract`
- `test_contract`
- `evidence_contract`
- `learning_contract`
- `last_verified_at`

Secrets are never stored in the registry; only the secret-store authority/reference is allowed.

## Coverage gate
Required dimensions for active production-affecting components:
`authority, owner, code/runtime location, data, security, observability, recovery, cost/capacity, tests, documentation, evidence, learning`.

The audit fails closed when:
- a required field is absent;
- an active component has no documentation reference;
- an active component has no evidence contract;
- a deprecated/superseded component has no retirement/migration reference;
- Portal V2 parity entries are incomplete;
- duplicate canonical IDs exist.

The first version validates contract completeness deterministically. Runtime freshness checks remain evidence supplied by existing Powerhouse/provider readbacks and are not faked by CI.

## Portal V2 parity
A dedicated parity manifest maps each legacy portal capability to:
- canonical capability ID;
- V2 route/component;
- Powerhouse data authority;
- interaction/writeback contract;
- tests;
- production evidence status.

Parity is complete only when every legacy capability is `verified` or explicitly `retired` with rationale and migration path. `unknown` or `missing` fails the gate.

## Drift detection
The registry is the expected inventory; deterministic discovery adapters compare repository-owned surfaces (functions, workflows, Portal V2 routes where discoverable) to the registry. Any discoverable production-affecting surface without a registry mapping fails CI. Provider/runtime discovery that requires credentials is handled by existing scheduled Powerhouse jobs and written back as evidence/open obligations rather than bypassing canonical authority.

## Recovery and failure proof
Each active critical component declares a recovery contract and proof reference. Recovery proof distinguishes `documented` from `tested`. Full-live status requires tested evidence for critical components; a missing test is an obligation, not a green state.

## Legacy obligation lifecycle
Open obligations are re-evaluated against current architecture. Each must become one of `open`, `resolved`, `superseded`, or `retired`, with owner, evidence and next action where open. Duplicate obligations are forbidden by fingerprint.

## Market-truth / calibration integration
The Assurance Layer does not replace the evidence-first calibration system. It verifies that market-learning components declare and preserve prediction-before-outcome, observed cost/time, human override/edit/skip, downstream response/meeting/proposal/win-loss/revenue and calibration lineage contracts.

## CI and tests
Tests cover registry schema validation, duplicate IDs, required coverage, lifecycle rules, Portal V2 parity completeness, discoverable repo-surface drift and deterministic report generation. CI runs the audit and tests on pull requests and main.

## Documentation writeback
Structural changes update:
1. repository design/runbook/current-state docs;
2. Powerhouse Canonical System Map;
3. Powerhouse Menselijk Handboek;
4. relevant Latest Verified State/component records;
5. learning/error/outcome lineage where runtime write access is available.

## Definition of done
The Assurance Layer is done only when it is merged to current main, CI is green, production/repository readback proves the expected artifacts are live, Portal V2 parity has no unmanaged `missing/unknown` rows, and the canonical Powerhouse documentation reflects the change with an explicit evidence trail.

Fingerprint: `powerhouse-assurance-layer-v1`.