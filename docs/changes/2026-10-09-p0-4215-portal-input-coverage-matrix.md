# P0 #4215 — schema-to-renderer field coverage and honest gap ledger

## Observed gap
The existing `inventoryPortalCustomerFields()` lists known native schema paths with model dependencies, but the issue needs a field-level matrix and actual rendered controls across V2, next/legacy, dynamic workspaces and connectors. A native page-registry enumeration is **not** full DOM field coverage, and an empty dynamic `paths:[]` must not be treated as a read-only or verified form.

## Implementation
- Reuse the existing `portal-v2/page-registry.js`, `functionalSchema`, `companyInputSchema`, `fullCompanyInputSchema`, `fieldMarkup`, `classifyPortalInputPath`, and supplemental surface declarations. No parallel mapping authority.
- Generate `.artifacts/p0-4215-portal-input-coverage-matrix.json` containing for each native declaration: page, field ID, schema path, owner, tenant boundary, canonical write endpoint, readback endpoint, source-revision/Brain consumer evidence status, dependent models/pages, type, repeatable subfields, and declaration-render proof.
- Unknown dynamic/connector fields remain `UNENUMERATED_FIELDS_REVIEW_REQUIRED`, zero-field pages `NOT_AUDITED_NO_DECLARATIONS` (not read-only), while runtime readback and ACK are explicitly `NOT_OBSERVED`.
- CI fails on duplicate field IDs with conflicting paths, schema paths that are not canonical, missing impact mappings, and nonmatching form primitive binding identifiers. It does **not** fabricate 100% browser completeness or a real customer session.
- `required-test.yml` preflight executes this generator and the regression on every PR.

## Verification
`node tools/ci/p0-4215-portal-input-coverage-matrix.mjs && node --test tests/brain-p0-4215-input-surface-coverage-v1.test.mjs`

## Remaining independent acceptance
1. Real authenticated DOM scan of every access-appropriate rendered route, dynamic control, legacy/provider field; classify explicitly read-only/admin-only and verify complete input mappings.
2. Two independent authorized customer tenant sessions with write → server commit → ONE BRAIN consumer ACK → impacted card/priority/roadmap → persistent authenticated readback and negative cross-tenant checks.
3. Durable transactional split-batch and outbox for payloads >750 KB, restart/conflict/idempotency/revocation and 200-field/1000-observation stress.
4. Customer-specific national/EU applicability, legal review, ESG materiality and authoritative regulation-version source lineage.

This change must never be used alone to close issue #4215.

## Live admission discovery and repair
First exact-head Required admission run identified six conflicting rendered control IDs on the combined `gegevens-invullen` page: `freeCashFlow`, `nopat`, `governance`, `inventoryDays`, `creditorDays` and `investedCapital`. They mapped to different `portal.metrics`, `portal.valueFinance`, `portal.dataAi` or maturity state paths, so the browser's `bindFields` could select the wrong element by `data-field-id`. Repair in `portal-v2/modules/full-company-input.js` qualifies colliding control IDs by the form group *only in the aggregate view*, retaining each canonical path, legacy ID, individual specialist page definition and value. The same generated matrix now enforces no cross-path field-ID collisions and the test locks in all six pairs.
