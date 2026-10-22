# 2026-10-22 — Repair stale BRAIN single-flight workflow oracle

Source: full BRAIN run [39671036043](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39671036043), failure `not ok 39`.

Actual `canonical-brand-shell-test.yml` job is `brand-shell-contracts`, not `test`. The manual `canonical-brand-shell-full-build.yml` workflow correctly uses `github.ref_name` for single-flight grouping. The inherited test asserted the wrong job and wrongly required a PR-number selector for manual dispatch.

Change scope: `tests/brain-actions-pr-single-flight-v1.test.mjs`; Brain learning and append-only documentation only. Verify *all four* current workflow sources: their actual job, positive timeout, `cancel-in-progress: true`, and correct event identity. No workflow, runtime, scheduler, SQL, RLS, provider, credential or production code changed.

Acceptance is fail-closed: exact-head required checks, independent full BRAIN 0 failures and protected merge still pending. This is one observed root-cause repair, **not** proof that 321 errors are gone.
