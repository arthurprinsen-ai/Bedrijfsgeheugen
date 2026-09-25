# Netlify static i18n cache completeness v2

## Incident

The exact-main Netlify build failed before publication because the immutable English translation cache was behind the current website source. The deterministic production build correctly stopped with `STATIC_I18N_CACHE_INCOMPLETE`; 1,926 strings were missing.

## Root cause

Website source and the versioned English cache could move independently. The production build was fail-closed, but cache completeness had not been made an unavoidable pre-promotion invariant for the exact candidate source.

## Fix

The cache was regenerated from the exact website source in GitHub Actions, then validated again with network access disabled. The generated cache is versioned in the delivery candidate. Netlify keeps `STATIC_I18N_NETWORK=0` and `STATIC_I18N_REQUIRE_CACHE=1`.

## Prevention

Every website production candidate must prove cache completeness against its exact source before protected merge. A provider-ready deploy is not production truth unless Netlify `commit_ref` equals protected `main` and public NL/EN routes pass readback.

## Evidence

- Diagnostic workflow: 36153434965
- Failed Netlify deploy: 6ab68cc1620347dff3081d39
- Proven failure: 1,926 missing translations
- Generated authority: `config/bg-static-i18n-en.json`
