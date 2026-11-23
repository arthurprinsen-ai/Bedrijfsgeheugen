# Static i18n patch keys aligned with build segments — 2026-11-06

## Problem
The BRAIN backend lane failed on every main merge since #5488 with `STATIC_I18N_CACHE_INCOMPLETE: 5 missing translation(s)`. Failing tests: `brain-static-i18n-production-cache-completeness-v1` and `brain-static-i18n-versioned-cache-v1`.

## Cause
`config/bg-static-i18n-en.d/powerhouse-blog-2026-11-06.json` keys the blog text sentence by sentence. The build looks up the final page blocks (for example heading plus paragraph, or a whole numbered list item), so five blocks had no matching key.

## Change
- `config/bg-static-i18n-en.d/powerhouse-blog-2026-11-06-segments.json`: the five exact keys from `STATIC_I18N_CACHE_MISSING`, translated by joining the existing sentence translations. The existing patch is untouched.
- One lesson and one active rule in the delivery preflight.

## Not changed
No test weakened, no change to the build script, the main cache or other patches. The check stays fail-closed.

## Known limit
Whoever generates blog patches still produces sentence-level keys; the generator is not fixed here. A later text edit can reintroduce the gap.

## Independent gates
Protected Required, CodeQL, original BRAIN backend lane and terminal closure.
