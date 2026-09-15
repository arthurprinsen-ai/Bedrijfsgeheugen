# Production truth governance v2

Canonical lesson references:
- `brain/contracts/production-readback-v1.json`
- `docs/brain/lessons/production-readback-readiness-503-2026-09-15.json`
- `docs/brain/lessons/production-truth-governance-current-main-2026-09-15.json`

Rule: a green PR whose base is no longer current main is replayed on current main and revalidated before merge. Production is only live after protected gates are green, main SHA equals the Netlify production commit reference, and live readback is green.
