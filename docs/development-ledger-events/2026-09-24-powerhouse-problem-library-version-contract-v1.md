# 2026-09-24 — Problem Library version contract recovery

- Obligation: `powerhouse-people-problem-radar-p0-v1`
- Trigger: post-merge BRAIN backend regression after PR #2796.
- Root cause: canonical library moved to 1.1.0 / 40 problems while the baseline test remained 1.0.0 / 30.
- Fix: align baseline test to 1.1.0 and >=40.
- Prevention fingerprint: `powerhouse-problem-library-version-contract-v1`.
- Terminal rule: protected recovery merge + production/main readback required.
