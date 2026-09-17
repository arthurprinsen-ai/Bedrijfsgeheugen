# Development ledger event — Portal V2 legacy parity + Powerhouse

- **Timestamp:** 2026-09-17 09:02 Europe/Amsterdam
- **Fingerprint:** `portal-v2-legacy-powerhouse-parity-v1`
- **Type:** `IMPROVEMENT` + `PRODUCTION_PROMOTION` + `LEARNING`
- **Status:** `LIVE & BEWEZEN`
- **Owner:** Portal V2 / Powerhouse engineering

## Problem / request

Portal V2 had to contain everything from the old customer portal, but work natively with the Bedrijfsgeheugen Powerhouse.

## Existing-state finding

The protected repository already contained a complete legacy migration authority rather than an incomplete greenfield V2:

- `klantportaal.html` as immutable baseline;
- `portal-v2/legacy-functional-inventory.js` with 24 protected capabilities;
- `portal-v2/parity-gate.js` with implementation, persistence and production-evidence ownership;
- fail-closed parity tests;
- existing Powerhouse/Supabase domain-state and delivery contracts.

The correct intervention was therefore verification/reconciliation, not a duplicate rebuild.

## Changes

1. Approved Portal V2 legacy + Powerhouse parity design was recorded.
2. A concrete execution plan was recorded under `docs/superpowers/`.
3. Existing current-main parity and delivery evidence were re-run through the protected PR path.
4. No unsupported duplicate implementation was added because no functional regression was found.
5. This reusable learning was written into `docs/brain/portal-v2-legacy-powerhouse-parity-learning.md` and projected into the existing Notion Powerhouse Menselijk Handboek and Direct Knowledge Base.

## Evidence

- PR: `#1846`
- Candidate: `568aed3bbab56c6233e98cc10f829b31bc239f02`
- Merge: `05f9cc58c629e6ab9991b7ca1d6bc6e9222a336b`
- Required test: green on candidate.
- Portal V2 suite: green.
- Portal production contracts: green.
- Supabase/security: green for the candidate scope.
- Backend Brain / Quality Intelligence: green.
- BRAIN delivery: green.
- CodeQL: green.
- Netlify deploy preview: green.
- Post-merge Canonical brand shell live readback run `35137918209`: `completed/success` on exact merge SHA, including exact Netlify production commit and browser/visual production readback.

## Root cause / learning

The main failure mode was not broken code but **incorrect problem classification**: visible UI differences can be mistaken for missing legacy functionality when the underlying capability contract already exists and is working. Rebuilding from perception would create duplicate owners, duplicated logic and Powerhouse drift.

## Permanent prevention

- EXISTING-STATE-FIRST before all portal parity work.
- Inspect immutable legacy baseline + functional inventory + executable owner + persistence + production evidence before declaring a gap.
- A route/menu/card alone is not parity.
- Repair only the existing canonical owner when a gap is proven.
- Never create a parallel portal database, Brain, queue or calculation authority.
- Require exact-SHA candidate gates and exact production readback before `LIVE & BEWEZEN`.
- Write every material parity finding/fix back into the existing Powerhouse learning chain.

## Outcome

Portal V2 remains the consolidated customer experience on top of the existing Powerhouse and retains the protected 24-capability legacy contract without introducing parallel architecture.

## Open obligations

None for `portal-v2-legacy-powerhouse-parity-v1`.
