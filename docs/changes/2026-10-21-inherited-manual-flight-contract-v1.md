# BRAIN baseline repair — manual diagnostic single-flight contract

Obligation: `ci-inherited-manual-flight-contract-v1`, related P0 [#3742](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742) and [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215). Evidence: [failed BRAIN backend job](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39554866582/job/119072398429) on Portal PR [#4573](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4573), where 355 failures reproduced on unmodified main.

## Root cause

The active test `tests/brain-actions-pr-single-flight-v1.test.mjs` expects `jobs.test` on the canonical brand shell workflow. The real job is `jobs.brand-shell-contracts`. It also requires GitHub PR-number concurrency in all four workflows although these are explicit diagnostics: the full-build workflow legitimately uses ref-scoped concurrency.

## Repair

Only the existing source-contract test changes. Against four current tracked workflows, it now checks:
- Explicit `workflow_dispatch`; **no automatic `pull_request`, `pull_request_target` or `push` fanout**.
- `github.ref_name` present in each concurrency group; `cancel-in-progress: true`.
- Current actual job keys and positive bounded `timeout-minutes`.

No workflow triggers, permissions, security gate, migration, production code or scheduler is changed. This is one inherited test repaired, **not 355 passing tests**. The other missing migrations are governed by #3742 and must not be restored as duplicate or placeholder versions.

## Release boundary

Keep PR #4573 and its owner unchanged. Run exact-head source test and the full protected BRAIN, Required and CodeQL checks. Do not merge or promote this patch based on a targeted pass if other mandatory gates fail. The affected V2 portal change requires provider readback and authenticated A/B customer checks after protected promotion. Record any failed or interrupted test as an open obligation.
