# Portal V2 — deterministische werkruimte bij snelle navigatie

Een MKB-klant moet direct van het dashboard naar Canvassen, AI, roadmap of analyses kunnen navigeren, ook terwijl stylesheets en gespecialiseerde modules laden. Een vorige pagina mag de volgende pagina nooit onzichtbaar blokkeren.

**Exacte observatie** — GitHub [browser-run 39242832614](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39242832614) tegen live Netlify deploy `6ad5f4a3cdc6d23b784395e5` leverde 14 geslaagde, één overgeslagen en één gefaalde test. Het tweede Canvassen-scenario vond het specialistische werkvlak niet, terwijl `#portalView[data-page-id=canvassen]` bestond. Dezelfde code is asynchroon via browserstijl+module-import. De providerrelease zelf was READY met exact GitHub main, zodat dit een portaalrace is en geen Netlify-autorisatieprobleem.

**Implementatie** — behoud bestaande `mountWorkspace`, `mountSpecialist` en `attachLegacyAlgorithmParity` en maak hun asynchrone verwerking generatiegebonden. Het oude root-brede lock verdwijnt. De nieuwe pagina blijft verantwoordelijk voor render en auditbewijs; verouderde beloftes mogen niet meer schrijven.

**Tests** — native Node zonder extra npm-package, plus bestaande echte Playwright-integratietest met geauthenticeerde demoAI state, verificatie van de originele canvasinhoud, tijdelijk aanpassen/ongedaan maken en veilige serverbevestiging. Geen fictieve clientclaims.

**Release** — Required CI/CodeQL → protected merge → Netlify exact source/main SHA → nieuwe immutable real-browser readback. Een eenmalige groene run kan regressiegevoelige races niet wiskundig uitsluiten; frequentie en herhaaltesten blijven relevant.
