# 2026-09-24 — production pricing/i18n browser gate v1

Added the pricing/i18n interaction verifier to the canonical Production Release Readback.

Reason:
- prior release `b42ac10b4d04ba314f6494aee0b6be283a0f8afa` was exact-SHA LIVE_VERIFIED;
- generic route proof did not cover the incident-specific pricing controls;
- the repository already contained `tools/site-shell/verify-pricing-i18n-production.mjs`.

Permanent rule:
exact deploy identity + pricing lifecycle click + plan-tab click + billing click + NL→EN navigation + English visible-state assertion are required for website production closure.
