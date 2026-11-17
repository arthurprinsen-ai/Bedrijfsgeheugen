# P0 #4198 — Canonical Result Guardian, 17 november 2026

## Geregistreerde productieoorzaak
- De oorspronkelijke cron #116 en #171 lopen, maar de commerciële zeven-dagen-scorecard rapporteert 4 gebroken/onbewezen handoffs en 0 provider-verifieerde e-mailuitvoer.
- Brononderzoek `SOURCE_SPECIFIC_EVIDENCE_REQUIRED` levert voor een huidige voorbereide e-mail geen actuele, sluitende bron; oorspronkelijke research loopt veilig in `waiting`.
- 23.295 contacten worden dagelijks opnieuw geprojecteerd; dit is geen bewijs dat dezelfde hoeveelheid verse externe bronverrijking plaatsvond. 605 geregistreerde e-mailadressen, 123 intern goedgekeurde contacten; geen impliciet recht om te verzenden.
- De bestaande watchdog schreef reeds `fout`, maar genereerde geen andere veilige commerciële vervolgstap.

## Gekozen reparatie
De bestaande cron #171 roept via de **reeds bestaande** `powerhouse_email_execution_watchdog_v1` een `bg_gezondheid`-INSERT aan. Een beperkte, service-only BEFORE INSERT trigger op exact dat bestaande contract voert de original-result-guardian uit, zonder nieuwe cron, executor, database, Gmail-account of queue.

Per natuurlijke watchdog-tick:
1. Meet originele source-held e-mails, overige prepared berichten, onzekere providerstatus en originele commerciële handoffs.
2. Controleert of de vorige publicatiedag onafhankelijke `LIVE_PROVEN/MEASURED/LEARNED` en `live_proven_at` heeft. De contentowner blijft de bestaande #140; een dergelijke controle is geen nieuwe publicatie.
3. Leest originele research-producer vs consumentontvangst; ontvangst mag niet als verwerking worden geïnterpreteerd.
4. Indien alléén source-held werk bestaat, geen onzekere provideractie en daglimiet niet is overschreden, vraagt de bestaande reeds geautoriseerde selector één **andere** geschikte ontvanger te *voorbereiden*. De bestaande composer, SUPPRESSION, cooldown en oorspronkelijke Gmail-zender houden alle exclusieve uitgaande beslissingen.
5. Registreert op bestaande `powerhouse_runtime_events` een uur-ge-dedupliceerd diagnostisch resultaat. De bestaande `bg_gezondheid` bewaart ook het eigen guard-oordeel en faalt gesloten bij runtimefout.

## Grenzen en verplichte controles
- **Niet** achteraf source-held acties op `prepared` zetten, bronbewijzen verzinnen, mislukte provideractie blind herhalen, e-mail verzenden of een contentkanaal zelf publiceren.
- De interne contact-goedkeuringsvlag is niet automatisch wettelijke verzendtoestemming; oorspronkelijke contactrechtencontrole blijft beslissend.
- De guard is uitsluitend herstel van het commerciële *selectiepad*. Hij kan geen nieuwe bedrijfssignalen forceren en bewijst geen nieuwe adressen, verzendactie, klantreactie of omzet.
- Alle veilige acties gaan via bestaande natuurlijke owners #116 / #140 / #171 en hetzelfde action-ID / dedupe. De enige nieuwe foutstatus is OBSERVED/DEGRADED/ERROR met onafhankelijke bron-aanduiding.
- Na protected merge/Required/CodeQL: controleer migratie-installatie, triggerstatus, één natuurlijke watchdog-insert, `result_guardian` in de originele gezondheidsrij, stabiele dedupe, en geen providerattempt. Daarna pas een daadwerkelijke legitieme externe provideruitkomst plus readback als leveringsbewijs.

## Rollback
Revert via beschermde GitHub PR; verwijder uitsluitend de triggerfunctie en de trigger. Onaangeraakte #116/#140/#171 blijven aan. Geen historische provider-, toestemming- of Brain-bewijzen terugdraaien.

## Test
`tests/brain-original-result-guardian-existing-watchdog-20261117.test.mjs` — contracttest; geen bewijs van succesvolle live-verzending.
