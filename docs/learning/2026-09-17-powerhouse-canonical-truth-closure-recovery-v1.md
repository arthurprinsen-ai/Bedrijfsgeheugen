# Powerhouse canonical truth-closure recovery learning v1

Date: 2026-09-17
Fingerprint: `powerhouse-canonical-truth-closure-recovery-v1`
Scope: Bedrijfsgeheugen Powerhouse / GitHub / Supabase / BRAIN delivery / Completion Supervisor
Status: CANONICAL LEARNING

## Incident

The canonical truth-closure release line could not safely complete on the first candidate. During exact-head verification, independent failures appeared in migration identity, BRAIN diagnostics, exact-file regression references and truth/materiality classification. After merge, production readback exposed a second truth problem: the production Supabase migration ledger already contained the same semantic migration under a different unique version than the temporary repository filename.

The correct recovery was not to weaken gates, rerun already-applied DDL, or force the wider Completion Supervisor green. The release was repaired through the existing protected release lane and the repository was reconciled to proven production truth.

## Root causes

### `supabase-migration-version-lineage-drift-v1`

Repository migration identity diverged from the already-applied production ledger identity during concurrent recovery. The production migration ledger was the runtime authority for what had actually executed. Replaying DDL or treating a temporary repository alias as superior would have introduced a second truth.

### `migration-rename-test-reference-drift-v1`

After renaming the migration to remove a duplicate version, an exact-file regression test still referenced the old filename. The migration itself was corrected, but the test oracle was stale.

### `content-loop-shared-diagnostics-leak-v1`

The content-loop persisted raw backend/step diagnostics into shared result state. Detailed diagnostics belong in server-side logging; public and persisted failure contracts must expose only a stable generic error code.

### `materiality-classification-contract-drift-v1`

The SQL material-claims read model was fail-closed in intent but did not explicitly encode the same canonical material classifications as the truth classifier. The contract therefore drifted even though both components were trying to express the same semantics.

## Fixes

- duplicate migration-version validation remained fail-closed;
- detailed backend/provider diagnostics were retained in server logs while persisted/public failure state uses `CONTENT_LOOP_INTERNAL_ERROR`;
- exact-file regression references were updated with the migration rename;
- SQL materiality explicitly aligned with `CURRENT_DEFECT`, `CURRENT_EXTERNAL_BOUNDARY` and `EVIDENCE_MISSING`, while unknown non-terminal states remain fail-closed;
- PR #1911 was merged only after exact-head Required, BRAIN, Supabase Preview/Security, RLS, CodeQL and trust/quality gates were terminal green;
- PR #1921 reconciled the repository filename to production migration version `20260917123749` without replaying production DDL;
- production readback verified the migration ledger, `powerhouse_material_claims_v1`, and the live `powerhouse-content-loop` Edge Function;
- the existing Completion Supervisor obligation was updated with release evidence instead of creating a parallel status authority.

## Verified release lineage

- canonical truth-closure PR: #1911;
- PR #1911 head: `94db12f646f95915c449663bb8e1862eee3ce75e`;
- PR #1911 merge SHA: `37215eb18054ae6513b4e5dff71a2335ed01bbbe`;
- production-lineage reconciliation PR: #1921;
- PR #1921 head: `02224ec4b076c6926a4d8a7297b18464e37737ca`;
- PR #1921 merge/main SHA: `b1790e23916f0f4a2350a10e1c4b7f7431dbebc0`;
- production migration: `20260917123749_powerhouse_canonical_truth_closure_v1`;
- production content-loop version: `2`;
- release scope: `LIVE_VERIFIED`;
- manual production DDL replay: **not performed**.

## Truth-scope rule

A narrower release and the whole Powerhouse have separate truth scopes.

For this release line, the canonical truth-closure capability is `LIVE_VERIFIED`. At the same readback moment, the broader `completion-supervisor-v1` remained `BLOCKED` because 14 unrelated material Powerhouse obligations still existed. That broader state must not be overwritten merely because one release is complete.

Permanent rule: `RELEASE_STATUS_AND_WHOLE_POWERHOUSE_STATUS_ARE_SEPARATE_TRUTH_SCOPES`.

## Permanent prevention rules

1. `MIGRATION_VERSION_COLLISION_FAILS_CLOSED` — never weaken duplicate-version validation to make CI green.
2. `PRODUCTION_MIGRATION_LEDGER_OUTRANKS_TEMPORARY_REPOSITORY_ALIAS` — when production has already applied the semantic migration, reconcile repository lineage to the proven ledger identity.
3. `NO_ALREADY_APPLIED_DDL_REPLAY_FOR_LINEAGE_RECONCILIATION` — identity reconciliation is not authorization to rerun production DDL.
4. `MIGRATION_RENAME_UPDATES_EXACT_FILE_TEST_REFERENCES_ATOMICALLY` — a migration rename and all exact-path regression references belong in the same change lineage.
5. `PUBLIC_ERROR_CONTRACT_NEVER_PERSISTS_RAW_INTERNAL_DIAGNOSTICS` — internal provider/backend traces stay server-side; shared/public failure state uses stable codes.
6. `TEST_ORACLE_IS_NOT_WEAKENED_TO_MAKE_RELEASE_GREEN` — diagnose stale tests separately from product defects and correct the actual mismatch.
7. `TRUTH_CLASSIFIER_AND_SQL_MATERIALITY_MODEL_SHARE_THE_SAME_CANONICAL_CLASSIFICATIONS` — classifier and read model must encode one vocabulary and one materiality rule.
8. `EXACT_HEAD_GATES_MUST_BE_TERMINAL_GREEN_BEFORE_PROTECTED_MERGE` — old-head evidence is invalid after head movement.
9. `POST_MERGE_PRODUCTION_READBACK_AND_CANONICAL_WRITEBACK_ARE_DEFINITION_OF_DONE` — merge alone is insufficient.
10. `NO_FALSE_WHOLE_SYSTEM_GREEN_FROM_NARROW_RELEASE_PROOF` — never close unrelated Powerhouse obligations from a narrower successful release.

## Reusable diagnostic sequence

1. Refresh current PR head and protected `main` before every release decision.
2. On Supabase preview failure, distinguish migration identity/version collision from SQL semantic failure.
3. On BRAIN failure, inspect the exact failing assertion and delivery lane before changing tests or implementation.
4. After any migration rename, search all exact filename/path references before rerunning CI.
5. Compare SQL materiality labels with the canonical truth-classifier constants.
6. Require fresh exact-head Required/BRAIN/security/trust evidence after every head change.
7. After merge, read back production migration history, live Edge Function identity/version and the material-claims view.
8. If repository and production migration identities differ, reconcile to already-proven production history without rerunning DDL.
9. Write release evidence into the existing canonical Completion Supervisor while preserving unrelated blockers.

## Canonical writeback

The existing `completion-supervisor-v1` obligation was updated, not replaced. Its evidence records the two merged PRs, production migration identity, live Edge Function version, exact-head green gates and the fact that no manual DDL replay occurred. The obligation remained `BLOCKED` because the whole Powerhouse still had 14 material obligations at that readback. This preserves one shared truth instead of manufacturing a parallel release-status store.

## Definition of done for future truth-closure changes

A future truth/materiality release is complete only when the exact candidate head has terminal green required gates, protected merge has landed, production readback proves the intended migration/runtime identity, repository lineage matches proven production history, material truth is read back from the canonical view, and learning/evidence is written into the existing Powerhouse authority. A green CI result or merged PR alone is not sufficient.