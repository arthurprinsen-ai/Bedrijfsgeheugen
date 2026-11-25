# 2026-10-06 — Terminalizer repository-only readback recovery for PR #3984

- Source PR: #3984.
- Source merge: `2c3664a5882303b68ad174b2b35ebb769f2fa41b`.
- Failed terminalizer run: `37515221054`.
- Failure: `UNWIRED_NON_NETLIFY_RUNTIME_READBACK` on repository-only control-plane files.
- Root cause: verifier-only classification was split between workflow hardcoding and exact-only contract paths.
- Fix: centralize exact paths + safe prefixes in `brain/contracts/production-readback-v1.json`.
- Safety: `config/` is not broadly exempted; unknown runtime remains fail-closed.
- Replay target after protected merge: PR #3984.
