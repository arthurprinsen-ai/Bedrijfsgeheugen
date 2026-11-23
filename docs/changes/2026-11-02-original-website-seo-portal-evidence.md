# Website/SEO incidentstatus in bestaande ONE BRAIN-beheerdersportaal

Datum: 2 november 2026. Bestaande verantwoordelijkheid: originele Powerhouse observability en Supabase Brain failure coverage. Oorspronkelijk incident: #4439.

## Bronoorzaak
Een geaggregeerde foutenteller toont niet afzonderlijk of een checkoutfout technisch is hersteld, of de SEO date-only broncorrectie live staat en of GitHub Actions een PR autonoom kan aanmaken. De eerste twee zijn na beschermde merges en provider-readback aantoonbaar live, maar native PR-create is geweigerd; de afgeschermde portaalweergave mag dit niet tot één groen systeem reduceren.

## Geïmplementeerd
De bestaande server `brain/observability/failure-coverage-projection.mjs` haalt vanuit de bestaande beveiligde admin-only bron maximaal drie expliciet allowlisted incidentrijen op. Alleen statuscodes en begrensde bewijs-gates worden aan de frontend toegevoegd. Geen ruwe fingerprint, interne gebeurtenisdetails, persoonsgegevens of sleutels. Fout, ontbrekende gegevens of dubbelzinnige bronnen: UNVERIFIED.

De bestaande portalmodule `portal-v2/modules/powerhouse-observability.js` toont drie begrijpelijke kaarten voor de beheerder: checkout technisch live, SEO-bronfix live maar volgende natuurlijke run nog open, en GitHub Actions PR-autorisatie nog open. Een bronfix is niet gelijk aan een betaalde order of bewezen marketingresultaat. De kaart voert geen opdrachten uit.

## Regresie en acceptatie
`tests/brain-portal-failure-coverage-readback-20261029.test.mjs` bewijst de bronbeperkingen, scheiding, misleidende PROVEN zonder ontvangsten, dubbele/missende rijen en ongevraagde blootstelling. Beschermde Required/CodeQL, Netlify exact-SHA en onafhankelijke echte portaalprovider-readback blijven verplicht. Source release in PR is geen live claim; brongebrek blijft oranje.

Het oorspronkelijke native GITHUB_TOKEN PR-create incident blijft afzonderlijk open tot een echte nieuwe autonome PR-overdracht is geverifieerd. Geen bypass van beleid, OAuth of nieuwe parallelle scheduler.
