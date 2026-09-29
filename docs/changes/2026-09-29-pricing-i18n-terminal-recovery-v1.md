# Pricing + NL/EN terminal recovery — 29 september 2026

## Root cause

De exacte productie-deploy was aanwezig, maar de terminale browser-readback kon de pricing-runtime niet als `ready-v3` waarnemen. De Netlify-build herstelde pricing-integriteit **vóór** de laatste globale `normaliseer-site-ui`-transformatie. Daardoor kon de laatste shellprojectie de zojuist herstelde pricing-runtime opnieuw verwijderen.

Tegelijk liep een deel van de regressie-oracle nog achter op de actuele CMS/i18n-authority: publieke taalwisseling is canoniek route-driven via `data-bg-language-option` en `/en/*`, niet primair via een select-control.

## Permanente fix

De productiebuild gebruikt voortaan deze volgorde:

`global UI normalization → pricing restore → Bedrijfslek restore → i18n projection → localized routes`.

Daarmee zijn de feature-integrity restorers werkelijk de laatste authority na destructieve globale transforms. De productie-verifier test de actuele route-link authority en behoudt select alleen als backwards-compatible fallback.

## Gates

- `tests/brain-pricing-final-build-order-v1.test.mjs`
- `tests/brain-pricing-i18n-mobile-language-readback-v1.test.mjs`
- `tests/brain-production-verifier-v18-mobile-language-v1.test.mjs`
- bestaande pricing build-integrity en production readback gates

## Truth boundary

Broncode, build of exacte deploy alleen is niet genoeg. Terminal groen vereist opnieuw: pricing lifecycle + plan + billing interacties én NL→EN→NL readback op productie.
