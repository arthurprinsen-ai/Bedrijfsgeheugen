# Original innovation: from planned decision to protected engineering candidate (15 November 2026)

Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Verified production defect

Original native EU source holds 14 canonical candidates, 14 PLANNED `INNOVATION_INTAKE` and 14 OPEN `INNOVATION_DELIVERY`. All 14 have a source-bound pre-review and original owner decision; none has a consumer ACK or measured innovation outcome. Existing Self Evolution has no real code-building consumer. A successful job must not count as shipped innovation.

## Same original workflow engineering step

The current `.github/workflows/powerhouse-daily-self-evolution.yml` gains one bounded **job**, not a second scheduler or separate AI agent. It runs only after the existing improvement job succeeded in a natural daily execution. The source selector reads original candidates/obligations/operations from the original Supabase project and verifies exact candidate, source SHA, revision, original owner, pre-review and decision. It skips generic research, CRO holdout designs, already referenced historic PRs and previously generated candidate PRs. It picks at most one concrete reversible engineering source and creates an immutable, sanitized local work order.

The existing SHA-pinned Codex action (workspace sandbox, no Git credentials) may edit only selected first-party implementation paths and create a fresh `tests/brain-innovation-*.test.mjs` plus a fresh `brain/learning/2026-11-*-innovation-*.json` record. The deterministic guard rejects modifications to workflows, migrations, secrets, security controls, arbitrary dependencies, existing tests, deletions, and path leaks. The runner executes new tests, creates one candidate branch and GitHub PR under the existing protected release, and requests GitHub auto-merge **only after enforced checks and reviews are satisfied**. It does not disable Required, CodeQL, tenant RLS, or review gates.

The original immutable `brain_operations` row receives a source-bound PR receipt through `brain_transition_operation` expected-version CAS and independent provider GET. It remains `PLANNED`; `remote_ref` remains NULL; there is no fictional consumer ACK, production mutation success or measured business effect.

## Important operational limitations

This change is not claimed live until exact-head Required/CodeQL, protected merge, original workflow successful natural run, and PR receipt readback are independently verified. A candidate must not be recreated if an original source PR already exists; old fixes must be reconciled to the original source rather than duplicated. Generic older candidate ideas still need a measured baseline, hypothesis and safe scope before automatic code authoring. New source-backed code PRs remain subject to protected review and postmerge exact production readback.

Test: `tests/brain-innovation-original-code-delivery-20261115.test.mjs`. Rollback by protected revert of the job and scripts; never erase prior receipts or original obligations.
