# 2026-09-30 — Publieke taalkeuze blijft actief bij navigatie

## Aanleiding
De taalwissel zelf werkte: een bezoeker kon van een Nederlandse pagina naar de equivalente Engelse `/en/*` route schakelen. Daarna verwezen gewone menu- en paginalinks echter nog naar onprefixte Nederlandse routes, waardoor de site na de volgende klik terugviel naar Nederlands.

## Root cause
De publieke i18n-runtime beheerde de locale-selector en dezelfde-route-switch, maar niet de href-state van alle overige interne publieke links. De taalstatus was daardoor pagina-lokaal in plaats van navigatiebreed.

## Oplossing
`assets/js/i18n.js` normaliseert nu alle in aanmerking komende same-origin publieke links naar de actieve locale:
- English: `/x -> /en/x`;
- Nederlands: `/en/x -> /x`;
- querystrings en hashes blijven behouden;
- portal/klantportaal, API, Netlify, assets en functions blijven buiten deze herschrijving;
- dynamisch ingevoegde menu-links worden eveneens genormaliseerd.

## Borging
De regel is vastgelegd in AGENTS, continuity skill, NL/EN delivery skill, System Map governance, de canonieke System Map en Brain learning. Regression authority: `tests/brain-i18n-persistent-navigation-v1.test.mjs`.

## Terminal bewijs
Voor LIVE_BEWEZEN moet productie aantonen: taal kiezen → via de echte navigatie een andere pagina openen → dezelfde taal blijft actief → terugschakelen → opnieuw navigeren → Nederlands blijft actief. Alleen de huidige pagina correct vertalen is niet voldoende.
