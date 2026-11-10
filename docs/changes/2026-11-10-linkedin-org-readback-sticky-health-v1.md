# LinkedIn-organisatiemeting blijft eerlijk rood tot echt herstel

10 november 2026 — bestaande ONE BRAIN / Powerhouse / Heartbeat, originele P0 #4198.

## Wat was mis?
De LinkedIn-organisatieverbinding leek op basis van algemene activiteit gezond. Toch gaven twee geldige, verbonden Marketing-API-accounts een echte HTTP 401 terug bij het uitlezen van postgegevens, en de organisatie-statistiekverbinding HTTP 403. Het ging om organisatie `urn:li:organization:18234216`, bestaande post `urn:li:share:7525815714499170304`. De oorspronkelijke provider-log is `log_RHJ0G5Il1Gxp`.

De oude gezondheidsberekening keek alleen of er in de afgelopen 24 uur een fout was. Morgen kan de fout dus uit de telling verdwenen zijn, terwijl de ontbrekende leesbevoegdheid niet is hersteld. Dan zou de verbinding ten onrechte groen worden.

## Structurele verbetering
De **bestaande** `powerhouse_provider_health_v1` houdt een echte provider-readbackweigering nu in het ontwerp als onopgelost vast. Alleen een latere, onafhankelijke HTTP 200 voor **dezelfde** organisatie, dezelfde post, dezelfde kanalen en een onveranderlijk provider-event mag deze specifieke blokkade vrijgeven. Een succesvolle andere LinkedIn-functie, een cronrun of Windsor-meting bewijst niet dat deze OAuth-bevoegdheid is hersteld.

De bestaande Heartbeat- en Breinregistratie bevat reeds de concrete fout en originele eigenaar. Er wordt geen tweede publicatiesysteem, scheduler, database, bericht of experiment gestart. Bestaande provider-ID's mogen nooit opnieuw gepubliceerd worden. Het portaal mag technische verbindingen en echte leerresultaten afzonderlijk tonen.

## Bewijs en grens
- In productie is de nieuwe SQL-logica uitsluitend **read-only** getoetst: nu `degraded`, één openstaande weigering.
- Simulatie twee dagen later: nul fouten in het 24-uursvenster, maar nog steeds `degraded`.
- Source + regressietests + agentregel staan in kandidaat-PR #5586; historisch eerste Required-admission faalde door ontbrekende PR-metadata. Dit is gecorrigeerd zonder CI-bypass.
- Nog **niet bewezen** bij opstellen: beschermd gemerged, officiële Supabase-migratie actief, LinkedIn-leesrecht hersteld, nieuwe brongebonden social-learning-overdracht of commerciële uitkomst.

## Acceptatie
Required en CodeQL exact groen; beschermd gemerged; dezelfde view met `security_invoker=true` in Supabase; productiecontrole vóór/na 24 uur; hersteld LinkedIn org-readrecht met echte onafhankelijke provider-ID; originele analytics-/learning-consumer ACK en pas daarna een bewezen verbeterde volgende uitvoering.

Oorspronkelijk incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

Kandidaat: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5586
