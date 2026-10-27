# Daily Self Evolution — late-schedule duplicate work fence

Date: 23 October 2026
Canonical issue: [#4367](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4367)
Existing recovery owner: [PR #4748](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4748)

## Observed rather than inferred

GitHub created the expected 04:47 UTC `schedule` event at **09:33:37 UTC**, after a `workflow_dispatch` at **09:31:34 UTC**. They became runs `39932748334` and `39932498219`. Both actually ran `improve=success`; both separately failed `model-freshness` with `REFRESH_REQUIRED` because the supplier catalog was last source-verified on **30 September**. Therefore a recovery decision after two hours, even with a double read, cannot predict a future delayed scheduled trigger.

## Correct once-per-day work authority

Keep the original `.github/workflows/powerhouse-daily-self-evolution.yml`, same scheduled time and `workflow_dispatch`. Inside this workflow, use one shared provider-grounded `daily-admission` GitHub Actions job as a prerequisite for BOTH existing `improve` and `model-freshness` jobs. This job checks a complete current UTC-day provider run list, current run ID and event, active workflow, and protected `main` branch. An earlier scheduled/manual run, even failed or queued, causes an **explicit failing admission** before the later run executes content. Unknown/incomplete GitHub evidence also fails closed. The existing workflow concurrency group now serializes instead of cancelling the first run.

This does not stop GitHub from creating a late event; it avoids executing the substantive learning twice and preserves visible failure states. It does not bypass or weaken the separate model supplier evidence audit.

## Regression and release acceptance

`tests/brain-daily-learning-run-admission-v1.test.mjs` replays the **actual** two October 23 run IDs, both possible event orders, invalid/missing/partial provider data and existing schedule/permissions. The canonical Brain learning record references this regression alongside the original liveness tests in historical, shadow and canary modes. Protected exact-head Required, CodeQL and GitHub merge must pass; after merging, read back the main workflow, Brain skill projection and a real provider run with separate daily-admission, improve and model-freshness outcomes.

No second schedule, independent agent, external queue, added token privilege, altered customer ACL/SQL, unverifiable model upgrade or fabricated business uplift. Model freshness remains `REFRESH_REQUIRED` until official supplier facts are actually reverified.
