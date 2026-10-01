# Development ledger — pricing visual contract

- Date: 2026-10-01
- Obligation: pricing-visual-contract-20261001
- Failure: Required test website/browser lane failed with three `missing-required` violations on /prijzen for all viewports.
- Evidence before failure: 233 public routes x 3 viewports passed visibility + CLS; affected-route desktop/mobile checks passed; header contrast and mega menu passed.
- Root cause: stale visual-regression selectors referenced removed `.bgkruim` and `.pil` elements.
- Fix: replace them with stable selectors owned by the current pricing composer.
- Regression: `tests/brain-website-coherence-v1.test.mjs`.
- Production condition: merge only after Required test/browser gate is green, then verify exact-main Netlify deploy.
