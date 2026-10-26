# Development ledger — evidence-aware CI optimizer

- Date: 2026-10-08.
- Obligation: powerhouse-evidence-aware-ci-optimizer-20261008-v1.
- Baseline: main `d14cfb5068f9384ba14e78eb268ac5fb61791194`.
- Diagnosis: skipped-job rate conflated with runner waste; thin CI observations could drive optimizer decisions; upward retuning had no measurement cooldown.
- Change: existing autonomous engineering optimizer and CI intelligence only; new sample counters, confidence guard, skipped-job zero-runtime treatment, 30-hour upward cooldown.
- New regressions: `tests/brain-autonomous-engineering-fabric-v3.test.mjs`.
- Canonical learning: `brain/learning/2026-10-08-evidence-aware-ci-optimizer-v1.json`.
- Human documentation: `docs/changes/2026-10-08-evidence-aware-ci-optimizer-v1.md`.
- Rollback: revert protected PR if measured post-change first-pass success or p95 worsens; never skip gates.
- Status: candidate; GitHub protection, exact-head tests, merge and subsequent observed impact not yet proven.
- Side effects: none outside repository change.
