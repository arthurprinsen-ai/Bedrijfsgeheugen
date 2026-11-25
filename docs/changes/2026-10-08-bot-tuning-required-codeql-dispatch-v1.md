# POWERHOUSE — make bot-created tuning PR checks execute autonomously

Date: 8 October 2026. Obligation: `powerhouse-bot-tuning-protected-dispatch-20261008-v1`.

## Root cause
The recovered scheduled optimizer [run 37797973046](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37797973046) generated [PR #4182](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4182) with four closure files and a valid protected-delivery contract. GitHub nevertheless returned `action_required` for both native `pull_request` runs because the triggering actor was `github-actions[bot]`; neither run contained test jobs.

Authorized approval and subsequent main synchronization allowed Required/CodeQL to run and PR #4182 merged. That was safe but not yet fully autonomous.

## Existing-state-first correction
The scheduled optimizer already has `GITHUB_TOKEN`, the correct exact candidate SHA, PR number and base SHA. Enable only `actions:write` in this existing trusted-main workflow and use GitHub's allowed `workflow_dispatch` event to start the existing `required-test.yml` and `codeql.yml` workflows against the branch's **exact provider-verified HEAD**. The Required dispatch receives explicit PR number, base SHA, candidate branch and head SHA. CodeQL dispatch uses the same branch HEAD. If any dispatch fails, the optimizer run fails; it may not claim an executed gate. The existing protected auto-merge still waits for checks; no bypass, no alternative tests and no separate scheduler.

## Verification boundaries
Static regression in `tests/brain-engineering-tuning-candidate.test.mjs`; protected Required and CodeQL on this code PR; subsequent actual bot-generated tuning candidate must prove dispatched check jobs and protected merge. We cannot claim provider-side successful dispatch or reduced development latency until read back from that later run.
