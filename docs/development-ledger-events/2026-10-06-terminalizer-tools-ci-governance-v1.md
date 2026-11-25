# 2026-10-06 — Terminalizer tools/ci governance

- Source PR: #3952.
- Source merge: `e902e07fef8b3411451280072b40f0d0aac24bb8`.
- Failed terminalizer run: `37478237670`.
- Failure: `UNWIRED_NON_NETLIFY_RUNTIME_READBACK` for `tools/ci/netlify-ignore-build.mjs`.
- Fix: classify `tools/ci/*` as control-plane governance.
- Safety: unknown non-governance runtime paths remain fail-closed.
- Replay target after protected merge: PR #3952.
