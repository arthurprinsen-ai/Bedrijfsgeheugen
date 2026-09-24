# 2026-09-24 — Pricing production DOM-geometry pointer recovery

- Fingerprint: `pricing-production-dom-geometry-pointer-v1`
- Scope: production browser verifier only.
- Exact production and route readback were healthy.
- Sequential false-negative mechanisms: locator scroll stability, locator visible wait, locator bounding-box auto-wait.
- Fix: computed DOM visibility + direct DOM rect + real `page.mouse.click`.
- Genuine hidden/zero-sized control remains fail-closed.
- No `force:true`; no DOM `.click()`.
- Regression: `tests/brain-pricing-production-dom-geometry-pointer-v1.test.mjs`.
- Status: `IMPLEMENTED_CANDIDATE` pending protected gates, merge and production readback.

## Follow-up direct DOM readiness

- Production release readback run `36056415545` proved exact deploy `984f679515fff2d9e4a4f10c0b187e95e96a1561` before failing in the pricing verifier.
- Failure: `locator.evaluate` timed out waiting for `[data-bg-stage="loss"]`.
- Fix: readiness now requires both `ready-v3` and concrete DOM target presence; geometry/scroll use direct `page.evaluate` DOM lookup.
- Regression strengthened: `tests/brain-pricing-production-dom-geometry-pointer-v1.test.mjs`.
- Genuine missing/hidden/zero-sized controls remain fail-closed.

