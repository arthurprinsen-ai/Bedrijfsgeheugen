# Development ledger event — 2026-10-22

Obligation-ID: netlify|production-i18n-translate|http-502|20261022-v1
Parent-P0: #4215
Delivery-Lane: website
Change-Class: safe-observability
State: CANDIDATE_UNVERIFIED

Reused the existing Netlify /api/i18n-translate handler and the existing Brain failure fingerprint. Production provider exact request id 01M5HQR0S42BBGP87AG7PFMAGD returned HTTP 502. Root cause UNKNOWN; errors were previously flattened to translation_failed. Added no-PII structured error classification and scoped correlation without bypassing 409 sovereignty or 502 error semantics. Local node --test: 6 tests passed. Production, protected CI and first classified failure evidence remain required.

This is an append-only engineering event, not a green status, independent incident, or new scheduler.
