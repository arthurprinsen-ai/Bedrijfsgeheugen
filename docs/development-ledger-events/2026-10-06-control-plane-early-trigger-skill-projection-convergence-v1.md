# Development ledger — control-plane early-trigger and Skill Projection convergence

- Date: 2026-10-06
- Parent merge: `e902e07fef8b3411451280072b40f0d0aac24bb8`
- Netlify fan-out evidence: Production Source Snapshot `37478237193`; Production Release Readback `37478237085`.
- Skill Projection failure evidence: `37478237282`.
- Root causes: missing `tools/ci/**` in early push filters; stale regression requiring `fetch-depth: 0`.
- Fix: add `tools/ci/**` to both Netlify production workflow push filters; regress it; align Skill Projection test with bounded `fetch-depth: 2` and `github.event.before`.
- Safety: canonical Netlify applicability remains fail-closed for runtime changes; website/portal/Netlify-runtime deployment evidence is unchanged.