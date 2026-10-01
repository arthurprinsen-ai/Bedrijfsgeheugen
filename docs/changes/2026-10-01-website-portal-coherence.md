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

## Professional parity recovery — second pass

Live screenshot review exposed presentation and journey defects that were not covered by the first technical coherence pass:

- internal implementation copy on the public product page looked like a second header instead of customer-facing proposition copy;
- the pricing recommendation button led to contact instead of an actual package recommendation;
- pricing and consulting cards ended with CTAs at different vertical positions;
- the portal preview exposed oversized legacy visual models outside their cards;
- important AI routes had become hard to discover;
- contact hash links could still survive in runtime-generated CTAs.

### Recovery
- The three Powerhouse product lines remain canonical, but are now explained in customer context.
- The architecture section is inserted after the existing product hero, never above it.
- /pakketadvies is a real contextual recommendation route driven by the three pricing choices.
- /portaal-demo is a purpose-built interactive sales demo and no longer exposes the customer runtime as a public demo.
- Pricing cards use equal-height flex layout and bottom-aligned CTAs.
- Portal visual models are constrained to their containers.
- AI Modelwijzer and AI Governance are restored to canonical navigation/footer discovery.
- Contact navigation is normalized to /contact.

### Acceptance
The website is not considered coherent when only the copy matches. Header/footer, hero hierarchy, CTA geometry, routing, product taxonomy, portal demonstration and AI discovery must all agree.
