# 2026-09-25 — Problem Radar exact-main production refresh

Fingerprint: `powerhouse-50-problem-radar-production-recovery-v3`

Protected `main` is `390e058e581874cb08f5b2d4608d886a5c9a7dcf`.

Netlify provider readback before this recovery:
- state: `ready`
- context: `production`
- commit_ref: `63ab5bff7780bfb3ff6d5fa1f1d96eada7ae2cea`

The feature remains included in production lineage, but exact-current-main parity is not yet proven. This recovery uses only the existing `Production Source Snapshot` workflow to promote the current protected main.

Terminal contract:
- state = `ready`;
- context = `production`;
- commit_ref = current protected `main`;
- then production readback/function verification must be green.
