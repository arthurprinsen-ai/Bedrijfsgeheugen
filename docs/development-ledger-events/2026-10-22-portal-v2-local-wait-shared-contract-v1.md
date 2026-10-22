# Development event: 2026-10-22-portal-v2-local-wait-shared-contract-v1

- Event: CI_PORTAL_V2_READBACK_SHARED_WAIT_RECOVERY_CANDIDATE
- Obligation ID: delivery|portal-v2-readback|legacy-local-poll-versus-shared-wait-contract|20261022-v1
- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
- Immutable main epoch: a692659ae245689273238baa7e01ccbe38c0d0ea
- Existing failing check: Required run 39827594879 / automation job 119995933814 / test tests/delivery-readback-wachtvenster.test.mjs:53
- Root: local 30-attempt manual curl/sleep poll in approved-source visual baseline
- Fix: existing wait-for-url.sh, bounded local POGINGEN=30 INTERVAL=1
- Regression: existing RED test remains unmodified, expected GREEN pending real CI
- Runtime boundaries: preserve Playwright, approved PR SHA, local server trap, security/quality gates
- Writer lane: automation; distinct from active #4663 ghost-aware lane; no shared-file crosswrite
- Learning file: brain/learning/2026-10-22-portal-v2-local-wait-shared-contract-v1.json
- Final state: CANDIDATE until protected merge and exact main provider readback.

## Canonical admission recovery — exact-head first failure
- First candidate head: 4c23850bcaa3650defe63fd33c3559295d6159ac; Required run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39829501487
- Hygiene admission failed *as designed* with `LEARNING_EVALUATION_TEST_PATH_INVALID:historical_replay:tests/delivery-readback-wachtvenster.test.mjs`. The original RED test exists but is not named `brain-*.test.mjs`, which the canonical learning evaluator strictly requires.
- Correction: add independent executable `tests/brain-portal-v2-local-shared-wait.test.mjs` with deterministic assertions for source readiness, shared helper, visual proof and server cleanup. Reference this BRAIN runner for historical_replay/shadow/canary; preserve the original RED test unchanged.
- Full admission/Required/CodeQL and exact-head protected merge must rerun; no bypass or fabricated green.
