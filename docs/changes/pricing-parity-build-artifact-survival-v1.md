# Pricing parity build-artifact survival — 2026-09-23

## Production finding
The prior release reached the exact intended main commit, but the public `/prijzen` artifact did not contain the new Portal capability contract. Netlify runs multiple HTML transformations and `pricing-build-integrity.mjs` only restores `section#pakketten`; the new block had been placed outside that protected section.

## Fix
The full Portal capability block now lives inside canonical `section#pakketten`. The pricing integrity guard also requires its core tokens, so downstream build transformations cannot silently remove it.

## Acceptance
Source test green, exact Netlify build green, and public `/prijzen` readback must show the Portal capability heading plus Trusted Advisor and Resource & Sustainability Intelligence.
