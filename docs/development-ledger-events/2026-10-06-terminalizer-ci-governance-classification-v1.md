# 2026-10-06 — Terminalizer CI-governance classification

- Source PR: #3952.
- Merge SHA: `e902e07fef8b3411451280072b40f0d0aac24bb8`.
- Failed terminalizer run: `37478237670`.
- False-negative path: `tools/ci/netlify-ignore-build.mjs`.
- Failure: `UNWIRED_NON_NETLIFY_RUNTIME_READBACK`.
- Fix: classify `tools/ci/**` as non-runtime governance.
- Safety: Netlify/Supabase runtime function paths remain fail-closed.
- Replay target: #3952.
