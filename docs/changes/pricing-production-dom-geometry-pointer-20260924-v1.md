# Pricing production DOM-geometry pointer recovery — 24 september 2026

Fingerprint: `pricing-production-dom-geometry-pointer-v1`

## Evidence

Production was provider-proven while interaction readback failed in the verifier, not in route delivery:
- `396b0ca1...`: `scrollIntoViewIfNeeded` stability timeout;
- `3628225d...`: `waitFor({state:'visible'})` timeout after exact Netlify deploy `6ab587bb252bef45dc3b20d5`;
- `c0e255d2...`: `locator.boundingBox()` timeout after product-specific readiness was reached.

Repository inspection shows exactly one `data-bg-stage="loss"` control. Mobile pricing CSS renders lifecycle tabs as a grid with buttons at least 48px high.

## Recovery

The production verifier now:
1. waits on `ready-v3`;
2. reads computed visibility and bounding rect directly from the DOM;
3. fails closed for hidden, transparent or zero-size controls;
4. scrolls the control to the center;
5. re-reads DOM geometry;
6. performs a real `page.mouse.click` at the center;
7. retains lifecycle, tab, billing and English-route assertions.

No `force:true` and no DOM `.click()`.

Regression: `tests/brain-pricing-production-dom-geometry-pointer-v1.test.mjs`.

## Follow-up: direct DOM readiness

Exact-main production `984f679515fff2d9e4a4f10c0b187e95e96a1561` was provider-proven, but the production browser verifier still timed out in `locator.evaluate()` while waiting for `[data-bg-stage="loss"]`.

Root cause:
`ready-v3` proved the rescue runtime had started, but not that the concrete lifecycle target was already observable to Playwright's Locator API.

Recovery:
- wait until both `ready-v3` and `document.querySelector('[data-bg-stage="loss"]')` are true;
- read computed visibility and geometry through direct `page.evaluate`;
- use Locator only for semantic assertions after the real pointer interaction;
- fail immediately with explicit diagnostics if the control disappears between readiness, scroll and pointer geometry.

This removes the remaining Locator auto-wait from lifecycle target acquisition without weakening the real-pointer proof.

