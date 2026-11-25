# Development ledger — 2026-11-05, SEO generated owner mismatch

- Fingerprint: `seo|website|generated-keyword-title-conflicts-canonical-owner|20261105-v1`.
- Owner: ORIGINAL SEO Order Engine and canonical website release, not a new sender, writer or scheduler.
- Cause: legacy `tools/zoekwoorden.mjs` generated copy overrides became inconsistent with canonical `site/seo-baseline.json` and `site/seo-order-map*.json` (generally `api-koppeling-laten-maken` falsely called an AFAS-only service).
- Evidence: provider live OnPage title `AFAS API koppeling laten maken | Bedrijfsgeheugen`; repository generic source title and canonical route; baseline keyword route `api koppeling laten maken`.
- Correction: source-only keyword mapping for API, Exact, Twinfield, webshop + truthful generic API page title; retain AFAS-specific original owner pages and all link/CTA/schema/locale policies.
- Prevention/regression: `tests/brain-seo-commercial-generated-keyword-owners-20261105.test.mjs` enforced on four buyer routes.
- Approval/prod: SOURCE_CANDIDATE_NOT_LIVE until protected Required/CodeQL/browser, Netlify exact prod SHA, and live API general page title `API-koppeling laten maken: kosten | Bedrijfsgeheugen` plus canonical and source-intent readback. No invented improvement in GSC or revenue.
- 28/56 day experiment: qualified Google query impressions, clicks, user sessions, leads, provider-verified sales; compare same complete weekly periods with GSC lag and bot filtering.


## Protected preflight recovery (same original PR, no bypass)

- First Required attempt surfaced `STATIC_I18N_PREPARE_NETWORK_REQUIRED` for the new title. Corrected by same-lineage, offline `config/bg-static-i18n-en.d/2026-11-05-api-commercial-title-intent-v1.json`. No translation API or production-time bypass.
- Following attempt reached `BRAIN` historical replay **passed** and then failed to load `scripts/ci/select-tests-for-changed-paths.mjs` from the PR's earlier base snapshot. The independently merged canonical Required preflight repair PR #5454 subsequently added that exact test selector on `main` (GitHub main commit `285e16e58414c51d097959259d9f0a9fb705703e`).
- New source event in the *same* candidate branch triggers original required checks against latest main; only record DONE after exact-head green and Netlify published SHA/live API-title readback. Preserve independent CodeQL and no forced merge.
