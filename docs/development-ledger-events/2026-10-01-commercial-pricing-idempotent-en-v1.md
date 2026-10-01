# Development ledger — idempotent pricing locale generation

- Root cause: pricing marker caused early return in the composer.
- Fix: remove marker-based skip and always render canonical NL/EN pricing main.
- Regression: `tests/brain-commercial-pricing-last-writer-v1.test.mjs`.
- Closure requires exact-main production plus public NL/EN readback.
