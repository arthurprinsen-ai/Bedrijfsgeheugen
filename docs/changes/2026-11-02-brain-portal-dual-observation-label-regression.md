# ONE BRAIN — Portaal historische fout en latere software-herstelproef afzonderlijk toetsen

**Datum:** 2 november 2026. **Oorspronkelijke eigenaar:** ONE BRAIN backend verifier + admin-only Andere-data Portal read-model. **Parent:** #4439.

**Oorspronkelijke fout:** Protected postmerge BRAIN run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41433667027, backend job 125238718390: 5.400 tests / 5.397 goed / **1 fout** / 2 overgeslagen. Fout #3050 in tests/brain-portal-latest-original-backend-observation-20261102.test.mjs verwachtte nog een oude enkele tekst 'Laatste vastgelegde BRAIN-hertest'. De door #5282 legitiem gemergede eigenaar toont twee duidelijkere labels: 'Laatste vastgelegde mislukte BRAIN-run' én 'Geregistreerde latere BRAIN-herstelproef'.

**Broncorrectie:** Laat de test beide originele bewijssoorten en de zichtbare statusregels afzonderlijk eisen: historisch incident blijft rood/zichtbaar; latere geregistreerde herstelproef is positief softwarebewijs maar niet automatisch onafhankelijk terminal- of bedrijfsbewijs. Verifieer nog steeds admin-only bron, originele ge-escapete absolute GitHub-URL en geen vals groen. Geen runtime-, database-, provider-, SQL-, portalweergave- of OAuth-wijziging. Geen test verwijderd, overgeslagen of hardcoded naar succes.

**Structurele preventie:** In de oorspronkelijke post-merge CodeQL agent skill is een fail-closed broninspectieregel toegevoegd voor splitsing tussen historisch incident, geregistreerde softwareherstelproef en business-outcome. Machine ONE BRAIN-learning gebruikt dezelfde originele historische/shadow/canary regressietests. Required, CodeQL, protected merge en volgende volledige exact-main BRAIN-run bepalen de uitkomst; dit document is geen bewezen terminal.

**Productie/portaal:** Het originele Portaal #5282 is al door Netlify exact SHA READY en de onafhankelijke productie-release #41433605759 en DOM #41433605793 zijn geslaagd, maar deze nieuwe testcorrectie is een afzonderlijke kandidaatrelease en niet groen tot nieuwe CI. De vier rode commerciële lussen blijven apart open.
