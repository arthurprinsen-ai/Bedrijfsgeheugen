# Route-aware NL/EN mobile switch — 29 september 2026

De productie-readback bewees dat de pricing-runtime zelf werkte, maar de mobiele taalwissel op `/prijzen` naar de Engelse homepage `/en/` wees. De broninjector gebruikte voor iedere pagina dezelfde hard-coded links.

De injector bepaalt nu per bestand de logische route en schrijft symmetrische links:
`/prijzen ↔ /en/prijzen`, `/systemen-koppelen ↔ /en/systemen-koppelen`, en alleen de homepage gebruikt `/ ↔ /en/`.

Bestaande mobiele switchers worden bovendien herschreven in plaats van stil overgeslagen. Daardoor kan een oude foutieve link niet blijven staan.

Terminale waarheid blijft: protected merge → exact production → pricing-interacties → NL→EN→NL browser-readback.


## Syntax-hotfix

De eerste route-aware injectorwijziging bevatte in het legacy compact-mobile pad één syntactisch ongeldige stringconcatenatie. Die regel is gecorrigeerd naar de bedoelde invoeging van `mobileLanguage + '$&'`.

Om herhaling te voorkomen is `tests/brain-apply-i18n-syntax-regression-v1.test.mjs` toegevoegd. Deze voert `node --check tools/site-shell/apply-i18n.mjs` uit, zodat een syntaxfout voortaan vóór build, merge en productie faalt.

De functionele truth-boundary blijft ongewijzigd: same-route NL/EN is pas terminal bewezen na een actuele productie-browserreadback.
