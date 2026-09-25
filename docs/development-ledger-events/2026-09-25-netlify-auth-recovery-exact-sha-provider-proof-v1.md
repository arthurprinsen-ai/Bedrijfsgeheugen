# 2026-09-25 — Netlify auth recovery exact-SHA provider proof

- Fingerprint: `netlify-auth-recovery-exact-sha-provider-proof-20260925-v1`
- Prior blocker: Production Source Snapshot run `35991169738` failed with Netlify `401 Unauthorized`.
- Recovered provider checkpoint: deploy `6ab66640d19f130007c97fcb`, ready, production, commit `390e058e581874cb08f5b2d4608d886a5c9a7dcf`.
- GitHub readback run `36134150890`: exact live release marker and connector readiness passed; run later cancelled while route-browser verification was in progress.
- Durable rule: provider identity evidence and functional browser evidence are separate; preserve immutable deploy truth and resume only missing functional proof.
- Subsequent provider observation: deploy `6ab66b7bb3dd8b0008d0c2a1`, ready, production, commit `f45ad02f8f719958c00b7ff8e39e3ca2104353b1`.
