# Powerhouse Production NL/EN Delivery

## Purpose
Keep public Dutch/English delivery deterministic, provider-independent at runtime, and terminally verifiable.

## Permanent contract
- Dutch canonical routes are unprefixed: `/`, `/prijzen`, etc.
- English canonical routes are `/en/*`.
- Production builds use `STATIC_I18N_NETWORK=0`.
- Production builds use `STATIC_I18N_REQUIRE_CACHE=1`.
- The immutable English cache is versioned in `config/bg-static-i18n-en.json` plus approved patches.
- An incomplete cache MUST fail the production build. Never publish Dutch source under an `/en/*` URL as a fallback.
- Volatile operational metadata such as build timestamps/version stamps MUST be excluded with `data-bg-no-translate` and `translate="no"`.
- Translation providers may enrich the versioned cache in CI, but production deployment must not depend on a translation provider or runtime AI key.

## Terminal delivery proof
A language change is not LIVE_BEWEZEN until all applicable checks are true:
1. protected candidate merged to `main`;
2. Netlify production `commit_ref` equals the current protected `main` SHA;
3. production browser readback proves NL→EN→NL on mandatory public routes;
4. `/en/prijzen` renders English pricing copy and must not contain the Dutch H1 `Prijzen voor digitalisering in het mkb`;
5. no visible `Switching language failed. Try again.` error is exposed;
6. mobile language selection is visible and actionable in the active mobile navigation;
7. Brain learning, regression test, human documentation and ledger evidence are written in the same lineage.

## Failure handling
- If Netlify is ready but `commit_ref != main`: production is stale, not live.
- If `commit_ref == main` but browser language proof fails: treat it as a product defect, not a deployment success.
- If static cache validation reports missing strings: repair cache/source classification; do not disable `STATIC_I18N_REQUIRE_CACHE`.
- If the only missing string is volatile build metadata, exclude the metadata from the translation corpus rather than caching timestamp-specific translations.
- Never classify backend-only or documentation-only success as proof that website NL/EN behavior is live.

## Queue discipline
Production snapshot work is coalesced to the latest canonical main candidate. Do not create parallel deploy lineages for the same obligation. A stale or obsolete candidate must not outrank the current protected main.
