# Explicit public language-option navigation recovery

**Date:** 2026-09-30  
**Fingerprint:** `website|i18n|explicit-language-option-navigation|v1`

## Signal
The Company Brain release reached exact-main Netlify production and affected-route readback was green. The shared production locale canary still timed out after clicking English on mobile pricing.

## Root cause
The public language-option click stored the requested locale but left the actual route transition to default anchor navigation. The mobile navigation also has delegated close/teardown behavior on the same click. That made the default browser action an implicit second owner and the transition non-deterministic.

## Fix
`assets/js/i18n.js` now owns the whole language-option click:
1. prevent the default anchor action;
2. call `setLocale(target)`;
3. public `setLocale` navigates explicitly via `location.assign(localizedHref(target))`;
4. portal locale behavior remains in-place;
5. semantic hrefs remain present for SEO/no-JS.

## Terminal proof
The existing production verifier remains strict and click-driven. LIVE requires exact production plus real-control NL→EN→NL URL and language readback.
