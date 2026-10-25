# Append-only recovery entry — 2026-10-22

- Fingerprint: `powerhouse|brain|linkedin-preaction-forecast-retired-sql-oracle|20261022-v1`
- Source evidence: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39755490943/job/119746782219
- One historical SQL source read path corrected in `tests/supabase-powerhouse-linkedin-sales-prediction-activation.test.mjs`, no assertion changed.
- Immutable archive source verified blob `8daf835dc5ff3f79fc11c7c4505755b436ed9522`.
- Regression: `tests/brain-linkedin-forecast-retired-source-guard-20261022.test.mjs` verifies non-executable retained SQL, source pointer, buying-window gates, and no schema write.
- Keep existing #3742 and #4215 obligations open. Full BRAIN zero-failure gate not yet proven. No production side effects.
