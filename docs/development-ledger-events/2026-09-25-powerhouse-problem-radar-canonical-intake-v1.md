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
