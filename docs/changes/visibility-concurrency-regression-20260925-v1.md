# Visibility concurrency regression alignment — 25 september 2026

The production visibility checker was intentionally changed from sequential viewport execution to bounded parallel viewport batches to stay within the existing fail-closed wall-clock budget.

One backend regression still asserted the old implementation detail `for (const viewport of viewports)`. This caused BRAIN to fail even though complete route × viewport coverage and all visibility/CLS assertions remained intact.

The regression now asserts:
- route concurrency remains bounded;
- viewport concurrency is explicit and bounded;
- all viewport batches use the same route worker;
- total reported coverage remains routes × viewports.

No production assertion is weakened.

## Production sizing
The canonical sitemap currently contains 93 public routes. Production readback therefore uses an explicit bounded worker budget of 8 route workers × 3 viewport workers, while the global 480s fail-closed sweep budget and all semantic assertions remain unchanged.
