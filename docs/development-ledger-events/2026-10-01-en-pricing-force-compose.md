# Development ledger — English pricing force-compose

- Root cause: locale-agnostic idempotency guard skipped English recomposition.
- Fix: marker skip remains Dutch-only; `/en/prijzen` always gets the canonical English pricing renderer.
- Regression: `tests/brain-commercial-pricing-last-writer-v1.test.mjs`.
