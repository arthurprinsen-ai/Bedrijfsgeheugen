# 2026-10-31 — Powerhouse original portal status severity regression
- Parent: #4198; original canonical ONE BRAIN 15-loop / Heartbeat.
- Fingerprint: `powerhouse|portal|status-label-substring-false-green|20261031-v1`.
- Observed cause: `UNVERIFIED`, `NOT_LIVE`, `UNPROVEN`, `UNFULFILLED`, `UNSUCCESSFUL` match positive substring tokens; `RED` and `AMBER` are omitted from generic portal tone.
- Change: one pure status projection imported by existing `portal-v2/modules/powerhouse-observability.js`; no second state, job or publisher.
- Prevent: fail-closed negative/evidence-gap precedence with regression tests, no green based on a word.
- Verification: local test, protected checks, exact main→Netlify→browser; original publication/provider and revenue proofs separate.
- Release truth: this record is implementation documentation, not independent evidence of a live or green deployment.
