# Development Ledger

This ledger is append-only operational memory for material engineering outcomes. New entries must include date/time, type, fingerprint, symptom/signal, impact, root cause or rationale, evidence, attempted approaches, final fix/experiment, owner, regression gate, verification, production SHA/deploy, rollback/last-known-good and reusable lesson.

Supported material outcome types are `ERROR`, `RECOVERY`, `IMPROVEMENT`, `OPPORTUNITY`, `EXPERIMENT_RESULT`, `PRODUCTION_PROMOTION`, `PRODUCTION_ROLLBACK` and `CONTRACT_CHANGE`.

## 2026-08-28 — ERROR — required-knowledge-files-missing
- **Fingerprint:** `docs-contract|required-files|missing-on-main`
- **Signal:** `AGENTS.md` mandates `docs/development-operating-system.md`, `docs/development-ledger.md` and `docs/superpowers/specs/2026-08-28-shared-agent-memory-design.md`, but these files were absent from `main` after the self-healing/team-memory promotion.
- **Impact:** agents cannot complete the mandatory read/writeback sequence from repository truth; release governance can report green while the knowledge contract is incomplete.
- **Root cause:** the Shared Agent Memory CI validated semantic learning/fingerprint/opportunity tests only and was scoped to the temporary `automation/green-production-gate` branch. It had no required-document contract test.
- **Evidence:** `main` SHA `e1e1dc4804091bbfef76b2bad8a26b4e013ff371`; PR #98 merged green but changed only nine files and did not add the three required docs.
- **Known failed approach:** relying on prose references in `AGENTS.md` without a machine-enforced existence/content gate.
- **Owner:** Knowledge & Governance / QA self-heal.
- **Last-known-good production:** `e1e1dc4804091bbfef76b2bad8a26b4e013ff371` remains protected during candidate repair.

## 2026-08-28 — RECOVERY — docs-contract-gate
- **Fingerprint:** `docs-contract|required-files|guarded`
- **Fix:** add the missing canonical operating-system, ledger and shared-memory design documents; add `tests/development-doc-contract.test.mjs`; broaden Shared Agent Memory CI to `automation/**` pushes and PRs targeting `main`.
- **Regression gate:** test asserts all mandatory files exist and that `AGENTS.md` references them; workflow executes the gate together with existing shared-memory tests.
- **Rollback:** revert the candidate commit; production is unchanged until candidate is green and promoted.
- **Reusable lesson:** every mandatory documentation dependency in an agent contract must be machine-validated by CI; branch-specific temporary gates are not production governance.

## 2026-08-28 — IMPROVEMENT — shared-memory-ci-scope
- **Fingerprint:** `shared-memory|ci-scope|automation-and-main-prs`
- **Baseline:** Shared Agent Memory Tests ran only for `automation/green-production-gate` pushes.
- **Change:** run the same bounded test suite for all `automation/**` pushes and pull requests targeting `main`.
- **Success metric:** future self-heal candidates receive an automatic shared-memory/documentation gate without modifying branch-specific CI.
- **Rollback:** restore the prior workflow trigger if the broader trigger causes an unexpected CI regression.

## 2026-08-28 — PRODUCTION_PROMOTION — self-healing-team-memory-contract
- **Fingerprint:** `shared-memory|contract|production-promotion`
- **Evidence:** PR #98 candidate `95f26fa3c7199a35ea9e9cdb4e6c5cbd9fc229d2` was merged to `main` as `e1e1dc4804091bbfef76b2bad8a26b4e013ff371` after green Shared Agent Memory tests.
- **Lesson:** promotion succeeded, but follow-up contract completeness must itself be gated; this ledger entry records the exact production transition for future agents.

## PRODUCTION_ROLLBACK event contract
When any production promotion regresses protected smoke/regression or metrics, append a `PRODUCTION_ROLLBACK` entry with failed production SHA/deploy, restored last-known-good SHA/deploy, evidence, rollback verification and the next candidate hypothesis. No rollback was required for the incident above because production remained on the last-known-good SHA during repair.
