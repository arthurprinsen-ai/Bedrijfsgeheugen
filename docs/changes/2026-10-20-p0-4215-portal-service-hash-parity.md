# P0 #4215 — Portal service-token hash authority, 20 October 2026

Netlify production `BG_PORTAL_EU_SERVICE_TOKEN` is configured, readable only as a secret, and its SHA-256 differs from the sole compiled `TOKEN_HASH` in live EU Edge `portal-state-eu` v220. The canonical Supabase URL matches. Authenticated Netlify Portal release check returns HTTP 502; a credential mismatch is a grounded candidate, not yet a confirmed exclusive cause.

This recovery accepts the existing Netlify portal production service credential **by its hash only**, in addition to the previously allowed service hash, preserving other callers. Secret plaintext and user information are not committed. The Edge action, Netlify Identity→tenant boundary and HTTP 401 for every other credential stay unchanged. No new external provider, route, cron, permission grant, data copy or SQL migration.

Release gates: Required CI, CodeQL, provider Supabase preview, protected merge, exact deployed Edge source-readback, authenticated production HTTP 200 on at least two isolated tenants, and source-backed portal freshness. No FULL_GREEN before proof. After proving all callers have migrated, create an independently reviewed follow-up to retire the legacy hash.
