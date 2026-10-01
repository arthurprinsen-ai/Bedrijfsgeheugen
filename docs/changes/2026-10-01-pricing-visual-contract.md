# Pricing visual regression contract — 1 October 2026

The pricing page moved to the canonical commercial pricing composer, but the visual-regression registry still required three elements from the previous hero implementation. This caused a false red browser gate on every viewport.

The protected pricing invariants now follow stable current markup:
- hero heading: `main .hero[data-bg-component="hero"] h1`
- SaaS/consulting tabs: `main .hero[data-bg-component="hero"] .tabs`
- pricing plan cards: `main #prijzen-pakketten .plan`

The Brain regression suite checks the registry against `prijzen.html` so this mismatch cannot silently return.
