# Pricing production stable-scroll recovery — 24 september 2026

## Incident
Exact production identity and affected-route checks were green, but the 390px pricing browser proof failed before clicking `Verlies & herstel`.

## Root cause
Playwright `scrollIntoViewIfNeeded()` waited for the responsive control to become stable and timed out. The element existed and was visible; the timeout happened in the auto-scroll actionability phase before the pointer click.

## Fix
The verifier now:
- waits for the control to be visible;
- scrolls it deterministically into the center of the viewport using DOM `scrollIntoView`;
- checks for a non-zero bounding box;
- performs the actual interaction with a real Playwright `locator.click()`.

`force:true` and DOM `.click()` remain prohibited.

## Terminal rule
The fix is not complete until protected merge and a production readback prove lifecycle selection, plan tab, yearly billing and NL→EN switching on the exact production SHA.
