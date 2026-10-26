# POWERHOUSE commerciële continuïteit: afzonderlijke uitvoeringsstappen

Het bestaande, elk uur actieve commerciële proces voerde onderzoek, externe signalen, groei, LinkedIn-sales, e-mailvoorbereiding, verzendstap en leren strikt achter elkaar uit. Eén fout brak de totale rest van de commerciële uitvoerketen af. De cron-wrapper is al actief en blijft ongewijzigd.

## Wijziging

De veertien bestaande functies worden in precies dezelfde volgorde, elk eenmaal, aangeroepen met een onafhankelijke foutgrens. Een falende stap levert een expliciet foutresultaat op en de resterende geldige stappen worden alsnog geprobeerd. `degraded=true` wordt gemeld als iets mislukt. De provider-side controles blijven gelden: geen verzending zonder bestaande autorisatie, geen dubbele DM, e-mail of publicatie, en geen groene commerciële assurance zonder echte providerontvangstbewijzen.

## Oplevering en toets

Het originele cron-jobnummer, schedule, uitvoerders, security-definer eigenaarschap en execute ACL worden niet gewijzigd. Alleen de bestaande functie wordt in place aangepast; SQL-migratie, Node-tests, leerrecord, wijzigingsdocument en append-only ledger vormen één beveiligde PR. Eindvalidatie is afhankelijk van main-merge, productie-DB-readback en individuele externe providerbewijzen. P0 #4198 blijft open tot commerciële resultaten werkelijk terugvloeien naar Brain.
