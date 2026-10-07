# Development ledger — Netlify tools/ci early-trigger suppression

- Date: 2026-10-06
- Parent main: `441fe997aedeb3016a72e6b2689d2a124dfd3a9a`
- Evidence source: merge `e902e07fef8b3411451280072b40f0d0aac24bb8`
- Unnecessary runs: Production Source Snapshot `37478237193`; Production Release Readback `37478237085`.
- Root cause: `tools/ci/**` was governance-only in the canonical applicability module but absent from both workflow-level `push.paths-ignore` lists.
- Fix: add `tools/ci/**` to both early trigger filters and enforce it in fan-out/readback regressions.
- Safety: mixed runtime commits still trigger production workflows; canonical in-job applicability remains fail-closed.
