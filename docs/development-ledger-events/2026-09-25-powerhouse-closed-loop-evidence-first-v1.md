# 2026-09-25 — Powerhouse evidence-first closed-loop standard

- Fingerprint: `powerhouse-closed-loop-evidence-first-v1`
- Failure class: delivery closure / false terminal state.
- Root cause: technical completion could be reported before observed outcome, realized value, calibration and next-decision evidence existed.
- Fix: one canonical evidence lifecycle from signal through next decision, enforced through AGENTS and the existing Powerhouse continuity skill.
- Prevention: intermediate technical/provider states never imply business completion; missing external evidence stays explicitly open.
- Regression: `tests/brain-powerhouse-closed-loop-evidence-first-v1.test.mjs`.
- Human documentation: `docs/changes/2026-09-25-powerhouse-closed-loop-standard.md`.
