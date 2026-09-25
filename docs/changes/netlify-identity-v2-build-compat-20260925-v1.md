# Terminal NL/EN build and release recovery — 2026-09-25

## Root cause
The production build depended on the undocumented internal file `node_modules/@netlify/identity/dist/main.js`. With the current Netlify Identity package that path is not a supported contract. This aborted production before static NL/EN generation and browser proof could complete.

The same delivery lane exposed three stale release contracts: a file-wide billing ARIA assertion that matched the wrong earlier statement, a pricing rescue query key that no longer matched the JavaScript Git blob, and a locale verifier that did not prove all three required public routes.

## Repair
Legacy Identity vendoring is optional when those old package internals are absent; customer-portal auth race and token guards remain mandatory. Billing regression scope is bound to `setBilling`. Pricing rescue cache identity is synchronized across HTML/build/production gates. The mobile verifier preserves the active v18 drawer and proves NL→EN→NL on `/`, `/prijzen`, and `/systemen-koppelen`.

## Prevention
No production build may depend on undocumented package-internal paths. Content-addressed asset identities must stay synchronized. LIVE requires protected merge, exact-main production identity, and functional three-route browser roundtrip evidence.
