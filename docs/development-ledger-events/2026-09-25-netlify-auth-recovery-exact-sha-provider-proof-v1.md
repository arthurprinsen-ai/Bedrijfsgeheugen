# 2026-09-25 — Netlify auth recovery exact-SHA provider proof

- Fingerprint: `netlify-auth-recovery-exact-sha-provider-proof-20260925-v1`
- Prior blocker: Production Source Snapshot run `35991169738` failed with Netlify `401 Unauthorized`.
- Recovered provider checkpoint: deploy `6ab66640d19f130007c97fcb`, ready, production, commit `390e058e581874cb08f5b2d4608d886a5c9a7dcf`.
- GitHub readback `36134150890` completed exact identity + connector readiness, then was cancelled during route-browser verification.
- Durable rule: preserve immutable provider proof; resume only missing functional proof.
