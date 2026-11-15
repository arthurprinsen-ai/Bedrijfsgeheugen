# 2026-11-15 | original mixed-source hard boundary in canonical backfill

- Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Protected original main fanout fix already merged: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5835, exact main `ee7d13b347163eef345fee154cb7f56eb1fe14e7`, Netlify READY 2026-11-15T10:00:27Z. Do NOT re-implement coalescing in parallel.
- Independent code inspection: original backfill `activeDispatches` skipped each `WAIT_EXTERNAL` candidate before grouping remaining source rows by `obligationId`; a mixed original group could bypass a proven consent/security boundary via another source. No independently observed unauthorized provider side effect claimed.
- Same existing PR #5837 repurposed to only this missing fail-closed condition: veto the complete original owner group when any registered source is WAIT_EXTERNAL; retain all original source identity/candidate evidence. No additional scheduler, executor, queue, migration, customer sending or bulk-close.
- Original test `tests/brain-completion-supervisor-backfill.test.mjs` covers mixed blocked/unblocked source in both input orders with full candidate provenance and zero dispatch; existing original tests remain intact.
- Existing `.agents/skills/powerhouse-continuity/SKILL.md` updated; machine learning `brain/learning/2026-11-15-canonical-backfill-hard-boundary-group-v1.json`; human change `docs/changes/2026-11-15-backfill-hard-boundary-group.md`.
- Release and acceptance: protected exact-head Required+CodeQL, main merge, Netlify exact SHA and original live consumer backfill/source/Heartbeat readback. No false-green from a successful build alone; parent P0 remains OPEN for historical work.
