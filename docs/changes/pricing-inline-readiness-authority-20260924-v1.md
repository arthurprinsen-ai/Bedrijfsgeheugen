# Pricing inline readiness authority — 24 september 2026

Fingerprint: `pricing-inline-readiness-authority-v1`

## Production evidence

Production release readback run `36061517298` reached a healthy exact deploy, connector-readiness and route readback, but `verify-pricing-i18n-production.mjs` timed out at its first readiness wait:

`page.waitForFunction: Timeout 20000ms exceeded`

The pricing controls and primary inline interaction runtime are present in `prijzen.html`. The `ready-v3` marker, however, was only emitted by the deferred rescue asset `assets/js/pricing-interactions-rescue-v1.js`.

## Root cause

Readiness authority was split: the primary inline runtime owned the actual controls, while a secondary rescue asset was the only code allowed to declare them ready.

## Fix

The inline runtime now publishes:
- `bgPricingInteractions=ready-v3`;
- initial stage `grow`;
- initial group `start`;
- initial billing `monthly`;

immediately after its own initialization. The rescue asset remains a secondary recovery layer.

Regression: `tests/brain-pricing-inline-readiness-authority-v1.test.mjs`.
