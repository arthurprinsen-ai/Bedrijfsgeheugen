# AI Modelwijzer v2 static-i18n production build closure

Date: 2026-09-30  
Fingerprint: `powerhouse|ai-modelwijzer|static-i18n-cache|build-closure|v1`

## Root cause
Netlify build exit code 2 was isolated with a temporary step-by-step reproduction. `build-localized-routes.mjs` failed closed because four exact governance strings were missing from the static English cache while `STATIC_I18N_REQUIRE_CACHE=1`.

## Repair
The four exact source strings now have deterministic English entries in the canonical Modelwijzer v2 cache. A Brain regression locks those keys. The temporary diagnostic PR was closed without merge.

## Terminal proof
The repair is only complete after the exact protected main SHA builds on Netlify and public production readback proves the Modelwijzer route, catalog, English route and lead endpoint behavior.
