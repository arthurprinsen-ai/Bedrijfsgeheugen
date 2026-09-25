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

## Terminal closure

Status: `LIVE_PROVEN`.

- Feature protected merge: `2d2f33393064da9cfb86730fb0d08238c985d8d5` (#2888).
- Learning canonicalization recovery: `288fb63a2255198e9125a3328316a624e62beb20` (#2891).
- Netlify production deploy: `6ab626a11214c7000808a8fb`, state `ready`.
- Production `commit_ref`: `c0e79c704cc7597b71764e14f67754e9c8f60195`.
- GitHub ancestry proof: production commit is 2 commits ahead of the feature merge and uses `2d2f33393064da9cfb86730fb0d08238c985d8d5` as merge base.
- The #2891 recovery only corrects learning metadata; it introduces no runtime/portal behavior requiring a separate runtime promotion.
