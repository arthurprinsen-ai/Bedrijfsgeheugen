# 2026-09-25 — static i18n provider fallback regression v3

Observed:
- linked Netlify production trigger succeeded;
- deploy `6ab6744ae51cac6be3a28a20` was created for exact main SHA `abdfd8d7dd9bf08dbf95a9fb76a8d5266ef853c1`;
- build failed before publication;
- exact source contained `STATIC_I18N_PRODUCTION_TRANSLATION_FAILED` and `STATIC_I18N_PRODUCTION_TRANSLATION_REQUIRED`;
- repository also contained the canonical fallback regression test that explicitly forbids both fatal guards.

Repair:
- remove both production-fatal translation guards;
- retain provider diagnostics and non-transient 4xx fail-fast behavior;
- preserve locale route emission and runtime fallback metadata;
- update the older fail-closed test so fail-closed authority sits at browser-visible English proof;
- add v3 learning to prevent older test contracts from overriding newer canonical architecture.
