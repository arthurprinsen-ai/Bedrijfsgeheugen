# Delivery browser visibility boundedness v1

The Required website browser lane previously depended on an outer job timeout while internal route/navigation and page-side waits could remain unbounded.

This recovery bounds:
- sitemap retrieval;
- route navigation attempts;
- font readiness;
- the total full-sitemap sweep.

The gate remains fail-closed and keeps visibility, occlusion, content-length and CLS assertions.

Regression: `tests/brain-standalone-visibility-boundedness-v1.test.mjs`.
