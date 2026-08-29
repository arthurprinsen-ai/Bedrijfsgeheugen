# 2026-08-29 — PRODUCTION_PROMOTION — native legacy portal batch 2

- **Fingerprint:** `portal|legacy-native-migration|batch-2|production-green`
- **Type:** `PRODUCTION_PROMOTION`
- **Scope:** migrate `AI-scan: kansenkaart`, `Businesscase`, and `Cijfers en maatstaven` from the temporary same-origin iframe bridge to native Business Operating Intelligence views.
- **TDD RED:** exact head `59611a99af38a689a1fff5c74d673f44018bedde`; V18 run `33273665031`; 51 tests total, 46 pass, 5 fail. Failures were exactly the three bridge-bypass requirements plus the missing intelligence and impact native renderers. Existing portal security, canonical projection, server-state and accepted-site-baseline contracts remained green.
- **Fix:** `portal/legacy-runtime.mjs` now bypasses the iframe bridge for `aiscan`, `business`, and `cijfers`; `portal/render-intelligence.mjs` renders a native AI-scan opportunities map from verified `state.signals`; `portal/render-impact.mjs` renders native Businesscase and Cijfers en maatstaven surfaces from evidence-backed impact/value view models. Empty states remain explicit and no missing values are invented.
- **Security invariant:** `portal/app.mjs` was not changed. Portal AI still submits only `{vraag}` and authenticated server-derived tenant context remains authoritative.
- **TDD GREEN:** exact candidate `89736f8907ced43960df149ee0ad473efb2f6a50`; V18 run `33273724218`; 51 tests, 51 pass, 0 fail. Release-PR context V18 run `33273784234` also completed successfully. Shared Agent Memory runs `33273724219` and `33273784251` were green.
- **Preview:** Netlify deploy-preview `6a9341b58e4a20000851dcbc`, `state=ready`, exact `commit_ref=89736f8907ced43960df149ee0ad473efb2f6a50`; 75 redirect rules and 16 header rules processed without errors; 7 functions and 1 edge function deployed; 0 secret-scan matches across 3,599 files.
- **Promotion:** release PR #248 merged with expected-head SHA lock as `38084d0946dc9783fde9d8940e6a15e899befb59`.
- **Production:** Netlify deploy `6a934231638a360008ab20c4`, `state=ready`, exact `commit_ref=38084d0946dc9783fde9d8940e6a15e899befb59`, published `2026-08-29T20:34:33.013Z`; 75 redirect rules and 16 header rules processed without errors; 7 functions and 1 edge function deployed; 0 secret-scan matches across 3,599 files.
- **Rollback:** remove `aiscan`, `business`, and `cijfers` from `NATIVE_LEGACY_WORKSPACES` and restore bridge rendering for those routes; the original `/klantportaal.html` remains available.
- **Reusable lesson:** read-heavy legacy workspaces can be migrated safely by reusing the normalized/canonical state and preserving explicit empty states. Keep write-heavy or transactional legacy workspaces bridged until equivalent native behavior is implemented and tested.
