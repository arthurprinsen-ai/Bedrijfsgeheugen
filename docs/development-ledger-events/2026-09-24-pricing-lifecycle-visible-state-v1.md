# 2026-09-24 — pricing lifecycle visible state v1

Observed production failure:
`loss stage panel after click is not visible` in Production Release Readback run `35996587112`.

Repair:
- hardened active/inactive lifecycle panel display state in `assets/js/pricing-interactions-rescue-v1.js`;
- added rescue CSS with explicit important visibility;
- added observable selected-stage root state;
- retained canonical browser proof as terminal verification.
