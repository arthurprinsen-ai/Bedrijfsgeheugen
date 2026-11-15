# Productiebewijs voor originele innovatiebron met bestaande signed-admin releasecontrole

**15 november 2026.** Originele kandidaat `55bb0754-355b-4940-aaea-aed7123e7e57` (engineering), P0 https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

## Aangetoonde resterende kloof

Beschermde oorspronkelijke code PR #5857, de structurele Netlify-importreparatie PR #5861 en de immutable writer-time reparatie PR #5866 staan in een door Netlify bevestigde productie-commit (`cbbaf6f046e920018396e612f2b2c542785ff59f`). De originele SQL-readback heeft 164/164 historisch writer-gekoppelde interne execution-events, met één later opnieuw ingeplande interne actie. Dit bevestigt **niet** dat de beveiligde admin-API die telling met een werkelijk ondertekende Identity-sessie terugleest.

De bestaande `powerhouse-control-plane.mjs` accepteerde alleen `admin`, `powerhouse_admin` en een bestaand app_metadata-veld, terwijl de reeds bestaande canonieke Powerhouse-autorisatie en ondertekende synthetic-releasecontrole `powerhouse-admin` gebruiken. Daardoor zou een geldig ondertekend test-account op het originele adminpanel niet worden toegelaten.

## Repareer uitsluitend het originele systeem

De bestaande adminfunctie gebruikt de bestaande `isPowerhouseAdmin`-helper, zonder de expliciete bearer-JWT-/getUser-/admin-role-poort te verplaatsen; het historisch ondersteunde ondertekende `app_metadata.powerhouse_admin`-veld blijft. **Geen autorisatie op gebruikersgestuurde metadata, e-mailheuristiek of headers van de aanroeper.**

Het reeds operationele Netlify-`deploySucceeded`-bewijs voor `portal-authenticated-production-proof` maakt tijdelijk twee Identity-testgebruikers, verifieert de ondertekende claims, meet twee gescheiden tenants en verwijdert de gebruikers in `finally`. Exact diezelfde bestaande sessies controleren nu ook op de **onveranderlijke deploy-URL** het origineel al bestaande `/api/powerhouse-control-plane`: ondertekende admin moet `200` plus `x-bg-innovation-audit-scope: FULL_LAST_7D` en inhoudelijk consistente **beperkte** originele 7-daagse event-/action-tellingen teruggeven; gewone tenant moet `403 FORBIDDEN` krijgen; anoniem `401 UNAUTHORIZED`. Bij bronfout, een steekproef in plaats van 7 dagen, mislukte autorisatie, foutieve telling, foutieve providerclaim of niet-verwijderde synthetic accounts is het bewijs **UNVERIFIED**, nooit stilzwijgend groen.

Het bestaande protected `Production Release Readback` vereist deze nieuwe, gesanitiseerde bewijsvlag bij wijzigingen aan het echte source-readmodel of de betrokken function/proof-modules. Andere sitewijzigingen worden niet door deze specifieke innovatie-controle onnodig geblokkeerd. Er is **geen nieuw endpoint, Netlify-event, Netlify-store, automatisering, scheduler, queue, worker, tenant of externe verzending**.

## Acceptatie en grens

Protected Required, CodeQL, exact main SHA, Netlify productie READY, de bestaande immutable-deploy signed-admin bewijsstore en drie echte HTTP-uitkomsten zijn noodzakelijk. `164/164` is een historische bronbaseline, geen statisch succescriterium: het productiebezoek gebruikt het dan geldende zeven-dagenvenster. De gesanitiseerde receipt bevat uitsluitend kleine aggregaten en expliciet `external_provider_proven=false` en `business_outcome_proven=false`.

De originele operatie `edebcb32-335b-49f0-b527-eb4289f95c5c` en overige 13 innovatie-intakes blijven OPEN/PLANNED zonder onafhankelijke uitvoeringsagent-ACK. Ook een geauthenticeerde broncontrole is geen bewezen autonome uitvoering of gerealiseerde klantwaarde. Pas na echte agentconsumptie, providerresultaat, Heartbeat-effect en onafhankelijk leerbewijs kan de oorspronkelijke verplichting sluiten.

Regression: `tests/brain-innovation-authenticated-original-production-proof-20261115.test.mjs`. Rollback alleen via bestaande protected GitHub/Netlify-lijn, bronhistorie ongewijzigd.
