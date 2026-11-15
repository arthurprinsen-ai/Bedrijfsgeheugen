# P0 innovation delivery — permission-scope regression repair (2026-11-16)

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Production-triggered cause
The existing workflow `.github/workflows/powerhouse-daily-self-evolution.yml` has a global `contents: read`, `actions: read` permission block. Its one existing `original-innovation-code-candidate` job necessarily has job-local `contents: write`, `pull-requests: write`, `actions: read` to push a source-scoped code candidate and open a **protected** PR. Existing tests used unscoped global negative regexes, rejecting even a job-scoped least-privilege implementation. GitHub Actions run 43763904923 reported the resulting two BRAIN contract failures on 2026-11-15.

## Fix and safeguards
Two existing source-contract tests now separate the ordinary read-only workflow from the bounded PR-writing job. They assert read-only global defaults and no writes in all other jobs; exactly one `contents: write` and `pull-requests: write` occurrence in that particular job; never `issues: write`; `persist-credentials: false`; and a genuine `gh pr create` code path. No workflow, rights, secrets, scheduler, provider sender or production mutation is changed.

## Evidence gates
A test edit alone is **not** a production repair. Required checks and CodeQL must pass at exact PR head, then protected merge, current-main readback and next natural workflow run must prove green. This fixes only the identified regression mismatch. The original 14 innovation obligations, 16 escalated reconciliation jobs, provider-side content/readback gaps, commercial outcomes and end-to-end applied learning remain OPEN unless separately independently proven.

## Rollback
Protected revert of these two scoped assertions and docs if they prove invalid. Do not broaden privileges, weaken protected PR checks or make duplicate outbound attempts.
