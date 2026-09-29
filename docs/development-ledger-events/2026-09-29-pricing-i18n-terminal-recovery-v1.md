# 2026-09-29 — RECOVERY — Pricing/i18n terminal production readback

- **Fingerprint:** `pricing|final-normalizer|post-restore-runtime-strip|2026-09-29-v1`
- **Signal:** exact production deploy was ready, homepage/portal browser routes waren groen, maar pricing/i18n terminal readback time-outte op `ready-v3`.
- **Root cause:** `pricing-build-integrity restore` stond vóór de laatste `normaliseer-site-ui` transform; de laatste globale transform kon de pricing runtime daarna opnieuw strippen. Daarnaast verwachtten oude verifier-regressies nog het historische language-select contract in plaats van de huidige route-link authority.
- **Fix:** final normalizer vóór pricing/Bedrijfslek restore; verifier regressions naar route-link-first met select fallback; nieuwe build-order gate.
- **Evidence:** production readback run 36583975442; exact deploy 6abbcd01978b9400086f9766; exact commit 571ecf8624b56388d760bcfc3e578f03f30c9adb.
- **Prevention:** destructive/global transforms precede feature integrity restorers; test oracle must track canonical runtime authority.
- **Owner:** Website/i18n + Whole Brain Reliability.
- **Terminal requirement:** fresh protected merge → exact production deploy → pricing + NL/EN browser readback green.
