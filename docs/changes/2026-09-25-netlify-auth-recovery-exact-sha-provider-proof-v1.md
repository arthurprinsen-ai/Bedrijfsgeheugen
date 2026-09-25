# Netlify auth recovery and exact-SHA provider proof

Fingerprint: `netlify-auth-recovery-exact-sha-provider-proof-20260925-v1`

The canonical production transport failed with `401 Unauthorized` because the temporary Netlify MCP proxy credential was no longer valid. This is an authentication/transport incident, not application-code evidence.

Netlify later reported production deploy `6ab66640d19f130007c97fcb` as `ready`, `context=production`, with `commit_ref=390e058e581874cb08f5b2d4608d886a5c9a7dcf`.

GitHub Production Release Readback run `36134150890` completed exact live release identity and connector readiness, then was cancelled while affected-route browser verification was still running. Immutable provider identity was therefore proven, while browser closure for that run remained incomplete.

Powerhouse permanently separates source/merge truth, provider deployment identity, functional production proof and learning/skill/ledger closure. A Netlify `401` is classified as an auth incident before product-code changes. Cancelled or skipped functional verification never becomes functional proof; resume only the missing gate on the newest canonical lineage.

Canonical references:
- `brain/learning/netlify-auth-recovery-exact-sha-provider-proof-20260925-v1.json`
- `brain/learning/branche-integrations-production-recovery-v1.json`
- `.agents/skills/powerhouse-netlify-production-truth/SKILL.md`
