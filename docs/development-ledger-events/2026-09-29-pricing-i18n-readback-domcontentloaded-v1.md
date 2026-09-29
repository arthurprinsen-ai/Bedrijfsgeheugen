# Pricing i18n production readback DOM-ready — 2026-09-29

Changed the production locale-switch verifier to treat DOM readiness as the navigation completion boundary. This removes false failures caused by slow non-critical assets while preserving route, language and visible-content verification.
