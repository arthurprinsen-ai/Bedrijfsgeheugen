# 2026-09-29 — Static i18n memory bound

Production deployment of the Bedrijfslek growth loop exposed an exit-137 failure in `build-localized-routes.mjs`.

Root cause: the localization builder retained a complete parse5 DOM tree and translation-reference graph for every public route while also reparsing every page during output generation. With more than 100 public routes this created an avoidable memory peak during Netlify production builds.

Fix: the discovery pass now retains only unique source strings. Each DOM tree becomes eligible for garbage collection immediately after its translatable strings are collected. The output phase continues to parse and serialize one route at a time.

Production contract: localization output remains identical in semantics; the change only bounds peak memory.
