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

## v2 recovery

- Exact deploy: `6ab58aa6affd510008595b0f`, commit `984f679515fff2d9e4a4f10c0b187e95e96a1561`, state `ready`, context `production`.
- Failed readback run: `36056415545`.
- New failure mechanism: `locator.evaluate` auto-wait on `[data-bg-stage="loss"]`.
- Fix: direct `page.evaluate + document.querySelector` for lifecycle existence, visibility, scrolling, geometry and selected-state readback; real `page.mouse.click` retained.
- Regression strengthened: `tests/brain-pricing-production-dom-geometry-pointer-v1.test.mjs`.
- Status remains `IMPLEMENTED_CANDIDATE` until protected merge + production readback.

