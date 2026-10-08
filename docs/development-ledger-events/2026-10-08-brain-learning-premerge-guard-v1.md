# Development ledger event — Brain learning pre-merge gate

- Date: 2026-10-08
- Obligation-ID: github-delivery-continuity-v1
- Recovery of: PR #4111; post-merge Skill Projection run 37743054827
- Failure signature: `LEARNING_EVALUATION_TEST_PATH_INVALID`
- Root cause: Canonical test-path gate was only enforced on main after merge, not during Required candidate admission.
- Implemented fix: Reuse canonical gate within Required preflight; fix learning test reference to a real `tests/brain-*.test.mjs` wrapper; add a preventing regression.
- Rollout authority: protected CI + protected auto-merge + current-main production/learning readback.
- Truth: failing historical run stays failed; no fabricated terminal status.
- Current state: candidate pending protected validation.
