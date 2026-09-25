# 2026-09-25 — Problem Radar canonical intake & routing

- Obligation-ID: `powerhouse-problem-radar-canonical-intake-v1`
- State: `CANDIDATE_UNTIL_PROTECTED_MERGE_AND_PRODUCTION_READBACK`
- Scope: cross-domain MKB evidence intake, dedupe, PH-Pxxx mapping, portal projection, opportunity/content reuse and outcome learning.
- Contract: `config/powerhouse-problem-radar-intake-contract.json`
- Regression: `tests/brain-powerhouse-problem-radar-canonical-intake-v1.test.mjs`
- Skills: `skills/mkb-voice-of-customer-problem-radar.md`, `.agents/skills/trigger-based-mkb-acquisition/SKILL.md`
- Terminal rule: protected merge + exact current-main production/provider readback before LIVE_BEWEZEN.

## Integration recovery

Required exposed an inherited current-main regression-contract drift: the visibility runner had already moved to bounded route concurrency, while an older baseline test still required serial `for (const route of routes)`. The same lineage updates that stale assertion to the canonical worker-concurrency contract without weakening full-route, viewport, CLS or fail-closed verification. This is not a rollback of the queue-amplification fix.

## Post-merge skill canonicalization recovery

After #2888 merged, Powerhouse Skill Projection correctly rejected a non-canonical `historical_replay` entry pointing to `tests/site-shell-website-release-risk.test.mjs`. The recovery keeps that file as ordinary repair evidence but binds canonical learning replay to `tests/brain-standalone-visibility-bounded-concurrency-v1.test.mjs`. LIVE_BEWEZEN remains blocked until this recovery is protected-merged and terminal readback is green.
