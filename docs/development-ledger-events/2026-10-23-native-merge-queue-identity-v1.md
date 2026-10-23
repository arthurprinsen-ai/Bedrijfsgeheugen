# Development ledger — merge-group identity and organization readiness
Date: 2026-10-23
Owner: delivery|merge-queue|run-id-as-pr-number|20261023-v1
Canonical parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
Source evidence: tools/delivery-github-event-context.mjs; .github/workflows/required-test.yml; .github/workflows/powerhouse-delivery-hygiene.yml.
Observed source defect: merge_group.prNumber was set to GitHub Actions runId, not a real PR number; provider queue activation is NOT yet possible while owner is a personal account.
Correction candidate: queue has no PR number; provider queue SHA must match GITHUB_SHA and checked-out exact SHA; empty PR output; test negative cases.
Migration gate: approved organization and authorized transfer + app/Netlify/Supabase readback; one-candidate/one-build/squash pilot; unchanged security/release controls.
Decision: prepare source only. No branch protection mutation, org transfer, production deployment or queue enablement.
Outcome: NOT VERIFIED. Exact-head Required, hygiene, CodeQL and protected squash merge plus provider and customer readback remain to be independently observed.

Runner feedback on PR #4782 Required run 39951080247: admission and metadata succeeded; protected Brain canonicalization correctly blocked a non-`tests/brain-*.test.mjs` historical replay path (LEARNING_EVALUATION_TEST_PATH_INVALID). Same-lineage fix: add `tests/brain-merge-group-event-identity-v1.test.mjs` as canonical replay, shadow and canary; retain the validator unmodified. Source-level additional correction: synthetic composite merge-group requires its own strict scope cap; stale PR manifest would make all native groups falsely red. Outcome still unproven until new exact-head Required/CodeQL results.

Runner feedback on PR #4782 Required run 39951615973: Brain canonicalization and admission passed, CodeQL succeeded. Preflight's existing `tests/delivery-required-branch-hygiene-wiring.test.mjs` asserted the old checkout expression and failed after the provider exact merge-group SHA was inserted. Repair only this outdated source oracle to require the additional `github.event.merge_group.head_sha` fallback, preserving PR head and github.sha checks. No gate skipped or waived.
