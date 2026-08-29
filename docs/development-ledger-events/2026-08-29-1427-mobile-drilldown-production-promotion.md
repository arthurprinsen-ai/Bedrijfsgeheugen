# PRODUCTION_PROMOTION — sitewide white mobile drilldown navigation

- Time: 2026-08-29 14:27 Europe/Amsterdam
- Candidate fingerprint: `mobile-nav|shared-pages|white-drilldown`
- Root cause: homepage V18.8 used the approved white drilldown navigation, while shared pages such as `/over-ons` still executed the legacy `#bgkopMob` accordion. The first real browser gate correctly failed because `#bgkopKnop .bg-mobile-menu-label` did not exist on shared pages.
- Recovery: the shared `assets/js/menu.js` now builds a sitewide `#bgSharedMobileNav` drilldown from the canonical server-rendered navigation links while preserving the original links for SEO/no-JS fallback. Homepage retains `#bgMobileNav`; shared pages receive the same Menu/Sluit, category drilldown, Back, Escape and scroll-lock interaction model.
- Regression contract: `tests/integration/v18-live-runtime.spec.js` verifies homepage and `/over-ons` at mobile viewport, including white Menu pill, full-height sheet, category drilldown, Back and Escape. Asset-presence assertions also guard both shared and V18 mobile navigation layers.
- Exact candidate SHA: `4b853d1a214be7a2d450b95e016a1ebf5599ffb2`
- Tested synthetic merge tree: `4c858a4e51a47ec2acd6ce45643e5df85e5a36b3`
- Candidate base: `1b7ceb9d6fa6f4384b18f9afbfbd85b06e10d6f2`
- Candidate evidence:
  - Live Preview Smoke run `33252340539` — success, including real Playwright browser interaction and desktop/mobile visual capture.
  - Pagina- en SEO-controle run `33252340534` — success, including page checks, SEO and internal-link checks.
  - Shared Agent Memory Tests run `33252340834` — success.
  - V18 Production Promotion run `33252340541` — success.
- GitHub draft-tool workaround: PR #165 could not be transitioned from Draft to Ready because the connector GraphQL mutation queried a removed `Repository.fullDatabaseId` field. No code was changed. #165 was closed and non-draft PR #168 was created from the exact same branch/head. Its synthetic merge tree was identical to the fully tested #165 tree.
- Production merge: PR #168 → `55b0455fae2dec6aee4f47cb90d48b6c78c2fb38`.
- Production Configuratiewacht: run `33252490134` — success on exact production SHA.
- Production Netlify deploy: `6a92cfe03797340009f58a3e` — `ready`, context `production`, exact `commit_ref=55b0455fae2dec6aee4f47cb90d48b6c78c2fb38`, 68 redirects without errors, 16 headers without errors, 3 functions, 1 edge function, 688 files secret-scanned, 0 matches.
- Public smoke: `/` and `/over-ons` both resolve successfully on `https://www.bedrijfsgeheugen.nl`; the production tree is byte-identical at Git tree level to the synthetic merge that passed the real Playwright interaction gate.
- Rollback: not required. Last-known-good before promotion was `1b7ceb9d6fa6f4384b18f9afbfbd85b06e10d6f2`.

## Reusable lesson

A navigation design is not sitewide merely because the homepage passes. Shared templates must be included in the same browser-interaction acceptance gate. When static pages already contain canonical server-rendered navigation links, progressive enhancement should derive the mobile drilldown from those links instead of duplicating a separate manually maintained menu source.
