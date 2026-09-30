# AI Modelwijzer v2 production hotfix — 30 september 2026

Root cause: the v2 Modelwijzer added new visible filter labels on a top-level static-i18n route. Netlify production uses STATIC_I18N_REQUIRE_CACHE=1, so missing English cache entries correctly failed the build.

Fix:
- add the missing English cache entries;
- preserve fail-closed i18n behavior;
- convert every internal href in the eight newly created SEO pages to an absolute https://www.bedrijfsgeheugen.nl/... URL;
- regression coverage for both invariants.

No capability, recommendation or commercial authority changed.
