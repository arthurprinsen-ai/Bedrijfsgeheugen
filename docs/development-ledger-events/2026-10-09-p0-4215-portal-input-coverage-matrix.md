# P0 #4215 development event — actual schema renderer control surface inventory

- Date: 2026-10-09
- Failure: existing schema inventory does not constitute exhaustive rendered DOM + provider input coverage.
- Obligation: `p0-4215-schema-render-coverage-admission-20261009-v1`.
- Reused canonical sources: `portal-v2/page-registry.js`, native `functionalSchema`, `companyInputSchema`, `fullCompanyInputSchema`, `fieldMarkup`, contextual impact mapping and explicit supplemental declarations.
- Repair scope: matrix generator, strict regression and existing Required CI preflight integration.
- Unknowns stay explicit: unenumerated connector/legacy fields, pages with no known declarations, signed-in runtime readback, Brain consumer ACK, 2 customer tenants and official CSRD/ESRS applicability.
- Test: `node --test tests/brain-p0-4215-input-surface-coverage-v1.test.mjs`.
- No new Brain, scheduler, database, fake customer/transaction or report-as-live shortcut.
- Release: protected exact-head Required/CodeQL, protected merge, exact-main Netlify production readback; parent P0 #4215 requires separate authenticated proof.
