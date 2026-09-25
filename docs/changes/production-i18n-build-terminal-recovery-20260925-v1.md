# Production i18n build terminal recovery — 25 september 2026

## Root causes

Two independent defects blocked the NL/EN production recovery:

1. `pricing-build-integrity.mjs` still required the retired single-goal copy `Belangrijkste doel nu`, while pricing and Portal use `Wat wil je bereiken?` with `Ondernemersdoelen`.
2. When a Git-linked Netlify deploy entered `state=error`, Production Source Snapshot exited before its existing authorized exact-source upload fallback could run.

## Fix

- Pricing build-integrity now validates the canonical multi-goal vocabulary.
- A regression forbids the retired single-goal token.
- Linked Netlify build errors are logged and routed once to the existing exact-source transport.
- Exact production SHA, provider-ready state, pricing content and NL→EN→NL browser proof remain mandatory.
- The versioned English cache on current main already covers the latest SEO copy and remains fail-closed.

## Prevention

Canonical product semantics, build oracles, translation cache coverage and terminal delivery fallback are one delivery contract. A change is not complete until these agree and production readback proves the same exact SHA.
