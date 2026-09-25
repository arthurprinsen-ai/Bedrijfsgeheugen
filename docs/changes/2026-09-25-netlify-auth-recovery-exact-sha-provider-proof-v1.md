# Netlify auth recovery and exact-SHA provider proof

Fingerprint: `netlify-auth-recovery-exact-sha-provider-proof-20260925-v1`

The canonical production transport failed with `401 Unauthorized` because the temporary Netlify MCP proxy credential was invalid. This is an authentication/transport incident, not application-code evidence.

On 2026-09-25 Netlify reported deploy `6ab66640d19f130007c97fcb` as `ready`, `context=production`, with `commit_ref=390e058e581874cb08f5b2d4608d886a5c9a7dcf`, equal to protected main at that checkpoint.

GitHub Production Release Readback `36134150890` completed exact live release-marker waiting and connector-readiness, then was cancelled while affected-route browser verification was still running. Therefore provider identity was proven, while full functional browser closure for that run was not.

Permanent rule: Powerhouse separates source/merge truth, provider deployment identity, functional production proof, and learning/skill/ledger closure. A proven immutable provider deploy survives a superseded verifier as evidence. A cancelled/skipped functional verifier never becomes functional proof. Recovery resumes only the missing gate on the newest canonical lineage.

A Netlify `401` is classified as credential/auth failure before product-code changes. LIVE_BEWEZEN requires every gate applicable to the obligation.
