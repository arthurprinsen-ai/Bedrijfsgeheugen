# Development ledger — Netlify tools/ci early trigger

- Date: 2026-10-06
- Base: current protected main after `e902e07fef8b3411451280072b40f0d0aac24bb8`.
- Evidence: Production Source Snapshot `37478237193`; Production Release Readback `37478237085`.
- Root cause: `tools/ci/**` existed in canonical governance classification but not in early GitHub push filters.
- Fix: add `tools/ci/**` to both Netlify production `paths-ignore` lists and regress it in main-push/readback tests.
- Safety: mixed/runtime changes still trigger because GitHub `paths-ignore` suppresses a workflow only when all changed paths are ignored.