# 2026-11-15 | original mixed-source hard boundary in canonical backfill

- Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Protected original main fanout fix already merged: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5835, exact main `ee7d13b347163eef345fee154cb7f56eb1fe14e7`, Netlify READY 2026-11-15T10:00:27Z. Do NOT re-implement coalescing in parallel.
- Independent code inspection: original backfill `activeDispatches` skipped each `WAIT_EXTERNAL` candidate before grouping remaining source rows by `obligationId`; a mixed original group could bypass a proven consent/security boundary via another source. No independently observed unauthorized provider side effect claimed.
- Same existing PR #5837 repurposed to only this missing fail-closed condition: veto the complete original owner group when any registered source is WAIT_EXTERNAL; retain all original source identity/candidate evidence. No additional scheduler, executor, queue, migration, customer sending or bulk-close.
- Original test `tests/brain-completion-supervisor-backfill.test.mjs` covers mixed blocked/unblocked source in both input orders with full candidate provenance and zero dispatch; existing original tests remain intact.
- Existing `.agents/skills/powerhouse-continuity/SKILL.md` updated; machine learning `brain/learning/2026-11-15-canonical-backfill-hard-boundary-group-v1.json`; human change `docs/changes/2026-11-15-backfill-hard-boundary-group.md`.
- Release and acceptance: protected exact-head Required+CodeQL, main merge, Netlify exact SHA and original live consumer backfill/source/Heartbeat readback. No false-green from a successful build alone; parent P0 remains OPEN for historical work.

## Actual protected-main scope correction, no guard weakening
- Original Required #43702270318 ran with stale GitHub PR event base `5cc1a86f44e93e733d8027f01da278fc23c862b3`, even though the existing PR base/main had already been refreshed to the verified original protected fanout release `ee7d13b347163eef345fee154cb7f56eb1fe14e7`. The original strict scope guard therefore correctly rejected 9 path changes versus 6 allowed, because it included protected #5835 source modifications not owned by this PR.
- The actual exact current-main diff remains only 6 files (the original mixed hard-boundary veto, regression, continuity skill, machine learning and human/ledger documentation). This same original ledger change is a new PR commit to obtain fresh GitHub event base without increasing `Scope-Budget: 6`, adding any SQL, bypassing protection or recreating fanout.
