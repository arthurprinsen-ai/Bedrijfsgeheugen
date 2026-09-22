# Activity event — static locale production build resilience

- **Fingerprint:** `global-i18n-static-locale-build-resilience-v2`
- **Obligation:** `global-nl-en-i18n-v1`
- **Date:** 2026-09-22
- **Observed failure:** the first production deploy containing static `/nl/` and `/en/` routes failed during the Netlify build even though PR checks were green.
- **Root cause:** the production translation stage covered too broad a surface and used provider batches that were not resilient enough for a full-site build.
- **Recovery:** restrict localization to public sitemap routes plus essential public menu routes, exclude portal trees, reduce batch size, recursively split failed batches, and run the same localization stage on deploy previews.
- **UX guard:** Dutch is now the first native select option so a Dutch page can never visually claim English before the locale runtime initializes.
- **Terminal state:** open until protected merge and exact Netlify production readback for the recovery SHA.
