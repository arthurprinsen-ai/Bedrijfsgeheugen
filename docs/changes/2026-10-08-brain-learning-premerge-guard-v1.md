# Brain learning pre-merge guard — 8 October 2026

## Observed production-chain failure
PR #4111 merged after exact-head Required, CodeQL and Netlify preview passed. Its post-merge Powerhouse Skill Projection run [37743054827](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37743054827) then failed `LEARNING_EVALUATION_TEST_PATH_INVALID:historical_replay:tests/delivery-powerhouse-supervisor.test.mjs`. This is genuine missing pre-merge validation, not a transient Actions failure.

## Structural recovery
- Add the existing canonical `scripts/brain/learning-canonicalization-gate.mjs` to Required **after scope classification and before integration**, with explicit immutable candidate base/head identities.
- Add a minimal Brain-compatible regression wrapper in `tests/brain-github-delivery-continuity-v1.test.mjs` that executes the original supervisor tests, plus assertions guarding the new pre-merge gate.
- Correct the prior learning record's historical, shadow and canary test paths to that actual in-repository Brain regression.
- Preserve original protected branch checks, CodeQL, auto-merge, production authority and durable terminal readback. Do not bypass the failing Skill Projection or manufacture a green historical run.

## Acceptance criteria
Required preflight must reject malformed learning references **before merging**, the exact candidate must pass CodeQL/preview, and a protected successor merge must trigger successful current-main Brain Skill Projection and canonical terminal evidence. The historical failing run remains in immutable audit history.

State at authoring: **RECOVERY_CANDIDATE; NOT LIVE_PROVEN**.
