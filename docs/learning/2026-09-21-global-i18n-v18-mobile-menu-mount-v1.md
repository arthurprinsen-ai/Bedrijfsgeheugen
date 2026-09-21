# NL/EN language selector in the V18 mobile menu

Fingerprint: `global-i18n-v18-mobile-menu-mount-v1`

## What failed

The NL/EN selector had been moved away from the floating WhatsApp area, but it was still missing from the mobile menu visible in production.

## Root cause

The first recovery mounted the control into the older shared-mobile navigation structure. The live V18 menu uses `data-bg-mobile-view="root"`, so the control never entered the actual drawer.

## Fix

The i18n runtime now detects the active V18 mobile root, inserts the language selector inside that menu before login/CTA where available, supports current desktop navigation variants, and remounts when navigation is created dynamically.

## Prevention

Production acceptance for navigation-level controls must inspect the canonical runtime DOM on mobile. Static source/build success is insufficient when multiple shell generations coexist.

## Evidence

- `assets/js/i18n.js`
- `assets/js/v18-mobile-drilldown.js`
- `assets/v18-mobile-drilldown.css`
- `tests/site-shell-global-i18n.test.mjs`
- PR #2537
