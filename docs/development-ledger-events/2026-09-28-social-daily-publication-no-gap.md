# 2026-09-28 — CONTRACT_CHANGE — Daily social publication no-gap authority

- **Fingerprint:** `social-daily-publication-no-gap-v1`
- **Signal:** daily LinkedIn/Instagram obligations could remain unresolved even while Composio showed ACTIVE connections; the LinkedIn company path could reuse a personal member connection lacking live organization capability.
- **Impact:** missed daily posts, repeated manual OAuth recovery, misleading scope diagnosis and risk of duplicate replacement publication during recovery.
- **Root cause:** provider identity was insufficiently channel-specific. Auth-config scope metadata, connection aliases/defaults and personal token health could be mistaken for company-page capability.
- **Final fix:** separate LinkedIn company connection resolution from personal resolution; require exact live organization ACL on the exact account used for company create/readback; keep atomic daily claims and provider-ID preservation; make unresolved approved daily obligations self-healing; treat missing Instagram media as an autonomous Mira production obligation.
- **Owner:** Powerhouse Social Publisher + Content Orchestrator + Daily Publication Watchdog.
- **Regression gate:** `tests/brain-linkedin-composio-authority.test.mjs` plus the existing atomic claim, uniqueness, identity and provider-readback gates.
- **Rollback/last-known-good:** retain the existing single-writer publication authority and provider-ID lineage; if the new company resolver regresses, fail closed for company only while personal and Instagram stay isolated. Never fall back to Buffer/Make and never issue a replacement for a provider-created ID.
- **Reusable lesson:** an OAuth configuration can advertise correct scopes while a connected token still lacks the capability needed for a specific channel. Runtime selection must be capability-proven per channel.
