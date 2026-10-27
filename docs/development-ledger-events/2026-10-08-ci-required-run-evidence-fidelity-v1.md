# Development ledger — CI Required evidence integrity

- Date: 2026-10-08.
- Obligation-ID: powerhouse-ci-required-run-evidence-fidelity-20261008-v1.
- Root cause: existing source used exact `Required test` name, but live workflow names include PR number and SHA; bounded 300-run list misrepresented as a seven-day complete window.
- Correction: add pure Required detection, reserved sample selection and window-coverage assessment to existing calibration engine; wire existing CI measurement script; regression fixtures.
- Touched runtime files: `tools/delivery/ci-calibration-engine.mjs`, `scripts/brain/powerhouse-ci-intelligence.mjs`.
- Tests: `tests/brain-ci-calibration-engine-v1.test.mjs`.
- New authority/storage/schedule: none. Existing 300-run fetch and 60 workflow-run sample preserved.
- Completion: protected PR → Required/CodeQL → protected merge → CI report readback → observed effect measured separately.
- State: candidate, not production-verified.
