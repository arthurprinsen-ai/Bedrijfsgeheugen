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
