# Engineering Intelligence & Trust v1 — Design

**Status:** approved for implementation on 2026-09-16
**Canonical parent:** BRAIN-DELIVERY-v2
**Principles:** EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP

## Goal
Extend the existing Powerhouse Engineering OS with a self-optimising trust, candidate-environment and engineering-intelligence layer without creating parallel brains, delivery systems, analytics stores or learning loops.

## Architecture

### 1. Supply Chain Trust
The existing Required/Assurance delivery chain gains machine-verifiable artifact provenance, SBOM generation/attestation, dependency review, CodeQL, dependency lifecycle governance and machine-readable ownership. Candidate promotion must bind provenance and artifact digest to the exact tested Git SHA.

### 2. Candidate Environment Contract
One immutable candidate identity binds `change_id`, PR, Git SHA, Netlify deploy identity, Supabase preview branch identity, schema/migration revision, artifact digest and evidence bundle. Integration evidence is invalid when frontend, backend, database or artifact identities do not match.

### 3. Engineering Intelligence
Existing Brain events, component registry and learning lineage become the authority for DORA/flow metrics, dependency-graph-driven test selection, flaky-test reliability, performance/cost budgets, rollback drills, active-change leases/conflict detection and an Engineering Scorecard.

## Safety and rollout
Security/provenance and candidate-identity mismatches are fail-closed. Historical dependency, performance and reliability debt starts from a measured baseline and uses ratcheting so existing debt is not misclassified as a new regression. New regressions fail closed.

## Canonical integration
Extend `config/brain-delivery-system.json`, existing component registry/contracts, Required/Assurance workflows, BG166 error lineage, BG167 current-state projection, BG168 outcome/learning writeback and BG169 production authority. No second delivery authority or analytics database is allowed.

## Definition of done
Tests green; exact candidate identity proven; security/provenance green; preview evidence valid; rollback readiness proven; merge/promotion through existing authority; exact production SHA/readback proven; scorecard/current state updated; BG166/BG168 writeback completed; human-readable Powerhouse documentation updated.
