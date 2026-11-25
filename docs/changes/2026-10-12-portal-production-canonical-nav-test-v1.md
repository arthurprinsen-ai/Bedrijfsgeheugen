# Productie-browsertest volgt de echte portaalnavigatie

De op 12 oktober gepubliceerde Bedrijfsgeheugen Portal V2 gebruikt een vijfstappenmodel voor dagelijkse bedrijfssturing en verbergt fictieve dashboardcijfers voor echte klanten. Daardoor zijn de oude dashboardtegels (en hun `data-open-page`-links) bewust verborgen. De echte portaalnavigatie bestaat uit precies één via `navigation-model.js` gegenereerde zijbalk met `[data-nav-target]`-knoppen.

In de handmatig gestarte productie-readback (workflow `38236074462`) zijn 14 Playwright-tests geslaagd, één overgeslagen, en één vastgelopen op `[data-open-page="roadmap"].first()` omdat deze oude demotegel verborgen is. Dit is **geen** reden om de voorbeeld-KPI's voor echte klanten weer zichtbaar te maken.

De standalone test kiest nu via `.sidebar .nav [data-nav-target="<pageId>"]` de werkelijk door een klant bedienbare navigatie voor roadmap, AI-scan en wijzigingen. Daarna valideert hij de route-URL, de native V2-view en de afwezigheid van alle legacy portaalverzoeken. De gebruikersflow, backend en data-status blijven ongewijzigd.

Eisen: beschermd CI, CodeQL, merge, handmatige bestaande production-dom-readback tegen de reeds gepubliceerde SHA met de test-only override, volledige mobiele en visuele tests. Supabase remote migratiehistorie is een afzonderlijk repo-migratieledgerprobleem; voeg geen verzonnen SQL toe.
