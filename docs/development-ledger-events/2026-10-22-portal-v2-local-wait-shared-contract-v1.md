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
