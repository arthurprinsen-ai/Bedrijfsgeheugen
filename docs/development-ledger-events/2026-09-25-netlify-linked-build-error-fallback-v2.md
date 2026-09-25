# 2026-09-25 — Netlify linked build error fallback v2

- Fingerprint: `delivery-netlify-linked-build-error-fallback-v2`
- Production Source Snapshot run: `36147611833`.
- Exact main: `994a5aa04a12ac22855986fb9987d3c9671ddf8a`.
- Linked deploy: `6ab68506e0ec0b14d66b7e24`.
- Provider result: state `error`, build exit code `2`.
- Root cause in delivery control flow: linked provider build errors terminated with exit 78 before the existing canonical exact-source fallback could run.
- Repair: retain deploy/build evidence, set `linked_fallback=true`, and continue through the existing authorized exact-source transport.
- Safety remains fail-closed: ready provider state, exact production SHA, pricing content, and production browser readback are still mandatory.
- Regression: `tests/brain-netlify-linked-build-error-fallback-v2.test.mjs`.
# Development ledger — Netlify linked-build error fallback v2

- Date: 2026-09-25
- Delivery lineage: PR #2954.
- Netlify linked build error handling was changed to continue into the existing authorized exact-source fallback.
- First regression attempt failed parsing because a regex literal contained a real newline.
- BRAIN backend run 36148136594 and Skill Projection run 36148136131 correctly failed closed.
- Regression repaired using explicit fragment assertions.
- Brain learning, delivery-failure lessons and Powerhouse continuity skill updated in the same lineage.
- Terminal state: pending exact-head re-verification, protected merge and production/provider readback.
