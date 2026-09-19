# Regulatory source-state delivery classification v1

- Date: 2026-09-19
- Obligation-ID: regulatory-source-state-delivery-classification-v1
- Trigger: PR #2327 failed admission with `unclassified delivery path: data/regulatory-source-state.json`.
- Root cause: automation lane covered regulatory code/tests/workflows but not the canonical state projection.
- Change: add the exact state projection path and regression coverage; keep unrelated data paths fail closed.
