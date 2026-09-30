# 2026-09-30 — RECOVERY — Persistent public locale navigation v1

- **Fingerprint:** `website|i18n|persistent-public-navigation|v1`.
- **Signal:** na kiezen voor English werd de huidige pagina Engels, maar een volgende menu-/paginalink kon terugvallen naar een onprefixte Nederlandse route.
- **Impact:** de website gedroeg zich niet als één tweetalige CMS-shell; de bezoeker moest taal opnieuw kiezen en kreeg inconsistente NL/EN journeys.
- **Root cause:** de i18n-runtime beheerste dezelfde-route language switching, maar gewone interne publieke links behielden hun oorspronkelijke Dutch href.
- **Final fix:** normaliseer alle geschikte same-origin public hrefs op de actieve locale, inclusief dynamisch toegevoegde navigatie; behoud query/hash; sluit portal/klantportaal en technische paden uit.
- **Owner:** Website/UX + Powerhouse continuity + System Map governance.
- **Regression gate:** `tests/brain-i18n-persistent-navigation-v1.test.mjs`.
- **Evidence:** runtime fix in `assets/js/i18n.js`, PR #3406, same-lineage governance writeback.
- **Production truth:** pas terminal groen na Netlify current production op actuele main en cross-page NL→EN→NL browser-readback.
- **Reusable lesson:** locale is navigatiestatus. Een taalkeuze die alleen de huidige route vertaalt maar gewone links niet locale-aware maakt, is architectonisch onvolledig.
