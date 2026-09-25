# 2026-09-25 — Netlify auth recovery exact-SHA provider proof

- Fingerprint: `netlify-auth-recovery-exact-sha-provider-proof-20260925-v1`
- Prior blocker: Production Source Snapshot run `35991169738` failed with Netlify `401 Unauthorized`.
- Recovered provider checkpoint: deploy `6ab66640d19f130007c97fcb`, ready, production, commit `390e058e581874cb08f5b2d4608d886a5c9a7dcf`.
- GitHub readback run `36134150890`: exact release identity and connector readiness passed; route-browser verification was cancelled before terminal completion.
- Durable rule: provider identity evidence and functional browser evidence are separate; preserve immutable provider proof and resume only missing functional proof.
- Powerhouse projection: dedicated skill `.agents/skills/powerhouse-netlify-production-truth/SKILL.md`.
- Delivery reconciliation: predecessor PR #2976 carried the same Obligation-ID and was closed as superseded; PR #2997 is the canonical successor owner.
