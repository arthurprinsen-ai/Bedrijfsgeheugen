# 2026-08-29 — PRODUCTION_PROMOTION — native legacy portal batch 1

- **Fingerprint:** `portal|legacy-native-migration|batch-1|production-green`
- **Type:** `PRODUCTION_PROMOTION`
- **Scope:** migrate `Profiel per onderdeel`, `Data en AI`, and `Wat je hebt ingevuld` from the temporary same-origin iframe bridge to native Business Operating Intelligence views.
- **TDD RED:** exact head `f7dab79a929e0a3b15738da8ac457a54439857e1`; V18 run `33273378167`; 46 tests total, 43 pass, 3 fail. Failures were exactly the three new native-migration requirements: native workspace allowlist absent, company native routes absent, memory native answers route absent.
- **Fix:** `portal/legacy-runtime.mjs` now bypasses the iframe bridge for `profiel`, `dataai`, and `antwoorden`; `portal/render-company.mjs` renders native profile and Data/AI surfaces from existing normalized health/graph state; `portal/render-memory.mjs` renders native recorded answers/history from normalized memories/audit. Remaining legacy workspaces stay bridged, so no capability is silently removed.
- **Security invariant:** `portal/app.mjs` was not changed. Portal AI still sends only `{vraag}` and server-side authenticated tenant context remains authoritative.
- **TDD GREEN:** exact candidate `d692f963787139765727722cd7200e6ab78f660c`; V18 run `33273472261`; 46 tests, 46 pass, 0 fail. A second PR-context V18 run `33273543008` also completed successfully. Shared Agent Memory runs `33273472225` and `33273542992` were green.
- **Preview:** Netlify deploy-preview `6a9340522964f200080a32b0`, `state=ready`, exact `commit_ref=d692f963787139765727722cd7200e6ab78f660c`; 75 redirects and 16 header rules processed without errors; 7 functions and 1 edge function deployed; 0 secret-scan matches across 3,597 files.
- **Promotion:** release PR #245 merged with expected-head SHA lock as `b3a51dd46e3f2682931d0bde81d0de547d686470`.
- **Production:** Netlify deploy `6a9340dea1ef3600084955b1`, `state=ready`, exact `commit_ref=b3a51dd46e3f2682931d0bde81d0de547d686470`, published `2026-08-29T20:28:52.118Z`; 75 redirects and 16 header rules processed without errors; 7 functions and 1 edge function deployed; 0 secret-scan matches across 3,597 files.
- **Rollback:** remove the three ids from `NATIVE_LEGACY_WORKSPACES` and restore bridge rendering for those routes; the legacy source remains available at `/klantportaal.html`.
- **Reusable lesson:** native migration can proceed incrementally over the normalized legacy state without exposing raw browser state to AI or removing the bridge fallback. Each batch must prove RED for exact missing routes, GREEN in the full portal/security release gate, exact preview SHA, and exact production merge SHA.
