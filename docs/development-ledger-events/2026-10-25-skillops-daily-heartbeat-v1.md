# SkillOps daily Heartbeat integration

- Obligation: skillops|daily-heartbeat|immutable-source-receipt|20261025-v1
- Change: attach existing source-hash inventory to existing daily self-evolution improve job. No additional schedule, independent writer, or bypass.
- Evidence: `artifacts/quality/skillops-inventory.json` in the existing daily job artifact; validation via `tests/brain-skillops-inventory.test.mjs`.
- Status: candidate only; actual daily run, merge and production evidence pending.
