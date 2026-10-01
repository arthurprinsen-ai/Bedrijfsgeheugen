# Development ledger — pricing clean-route terminal writer

- Root cause: terminal composer skipped the clean-route index files served by Netlify.
- Fix: compose NL/EN source and clean routes after localized-route generation.
- Gate: visual regression selectors now target the final commercial pricing DOM.
- Production proof: requires `data-bg-commercial-pricing-v1`, Starter/Pro/Groei/Enterprise and consulting offers on public `/prijzen`.
- Regression: `tests/brain-commercial-pricing-last-writer-v1.test.mjs`.
