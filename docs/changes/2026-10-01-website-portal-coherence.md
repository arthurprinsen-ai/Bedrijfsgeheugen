# Website / Portal coherence — 1 October 2026

Bedrijfsgeheugen now has a terminal public-site coherence pass after all other website composers.

## Fixed surfaces
- Contact navigation resolves to `/contact` instead of a homepage hash.
- Pricing uses the canonical Bedrijfsgeheugen visual system and remains aligned with SaaS entitlements.
- AI ecosystem and systems-integration pages are protected from global class-name collisions.
- The public product page uses the same Powerhouse taxonomy as Portal V2: Intelligence, Agents and Connect.
- Portal V2 loads a final parity stylesheet after its existing styles.
- Dutch and English public routes receive the same terminal build treatment.

## Build contract
`tools/site-shell/finalize-website-coherence-v1.mjs` runs after localized route generation, commercial pricing and revenue-link projection, in both production and deploy previews.

## Regression
`tests/brain-website-coherence-v1.test.mjs` protects routing, route-scoped layout guards, product taxonomy, portal parity and build inclusion.

## Pricing visual-contract recovery
The commercial pricing composer now preserves the canonical hero hooks used by the browser regression suite: `.held[data-bg-component="hero"]`, `.bgkruim` and `.pil`. This keeps the new pricing design compatible with the site-wide visual contract instead of weakening the regression gate.
