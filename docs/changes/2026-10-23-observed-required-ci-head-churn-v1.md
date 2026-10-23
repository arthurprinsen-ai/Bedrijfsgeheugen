# Observe repeated PR-head CI work without modifying release gates

Date: 2026-10-23
Canonical owner: [#4661 — measured CI and agent coordination](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661)
Source: existing hourly Powerhouse Repository Janitor `tools/delivery/ci-throughput-telemetry.mjs`

## Real observed bottleneck

The repository's recent GitHub Actions list contains consecutive `Required test PR #4765` and `Required test PR #4761` runs on different commit SHAs. These are distinct completed Required *candidate* evaluations, not proof that their rebuilds were wasteful or all caused by `main` drift. Existing telemetry measures verified per-job wait and execution percentiles, and recurrent slow jobs, but not repeated **PR-head versions**. Thus a key component of the measured developer feedback loop had no separate baseline.

## One bounded measurement within the existing Janitor

The new pure read-only `observeRequiredHeadChurn` projection receives one bounded **workflow-scoped** first page (40) of completed `required-test.yml` GitHub Actions runs. The original general 40-run page contained just four Required runs in the live provider sample; therefore the Janitor now spends exactly one additional authenticated read to avoid false absence of repeated PR commits. It accepts only exact `Required test PR #N <40-hex-SHA>` run-name and actual GitHub `pull_request` event, `completed` status, matching `head_sha`, unique provider run ID, positive attempt and valid timestamp within seven days. It groups by PR number and distinct **candidate head** so reruns of the same SHA and matrix jobs cannot manufacture head churn.

The artifact now includes `required_head_churn`, with per-PR sample counts, lower-bound additional versions, paging disclosure and explicit non-causality flags. Provider malformed/incomplete identities fail closed. A truncated sample is labeled as such, never treated as full repository history or DORA deployment performance.

Two separate PRs with repeat candidates and at least three additional candidate versions produce only an **admin-led native GitHub merge queue review advisory**, not an automatic settings mutation. Official queue eligibility, `merge_group` workflow checks, branch protection, CodeQL and transactional production readback remain prerequisites. Docs: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue ; throughput/instability framework: https://dora.dev/guides/dora-metrics/ .

## Acceptance and controls

`node --test tests/brain-ci-required-head-churn-v1.test.mjs` covers actual current-day repeated-PR pattern, malformed/mismatched provider identities, same-head reruns, merge-group exclusion, page truncation, and an unavailable job endpoint. It also asserts the existing Janitor cadence plus Required/CodeQL `merge_group` support. Exactly one additional bounded GitHub GET per existing hourly Janitor (two list reads total), no polling job, extra job-list fan-out, token, scheduler, branch protection change, CI green claim, agent promotion or provider charge.

Only protected exact-head Required and CodeQL success, merge to `main`, a subsequent real hourly Janitor artifact with `required_head_churn` and reviewed comparison over representative periods can promote the result from candidate to proven operational learning. No speed improvement is currently established.
