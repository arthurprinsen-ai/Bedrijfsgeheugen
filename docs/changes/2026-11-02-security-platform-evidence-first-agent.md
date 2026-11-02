# Security Agent — beveiligingsstatus van website en cloudplatformen

## Reikwijdte en authority
Deze wijziging versterkt de bestaande `agent-security` en het bestaande beveiligde Security Trust Center in het ene Portal-product. Geen nieuwe planner, uitvoerder, publieke eindpunten of databronnen voor klantgegevens.

## Wijzigingen
- De webinterface toont de status van vier infrastructuurgebieden op basis van het bestaande tenant-scoped security-trust API-resultaat. Vereiste controles die ontbreken zijn expliciet niet bewezen.
- Statusweergave is fail-closed: `NOT_VERIFIED`, `STALE` en `EVIDENCE_PARTIAL` worden nooit groen.
- Externe links uit security-evidence accepteren uitsluitend absolute HTTPS-URL's zonder credentials.
- De bestaande Security Agent heeft concrete controleverplichtingen en een gezamenlijk incident/leren-contract. De oorspronkelijke release-writer, beveiligde PR-controles en Heartbeat blijven eigenaar.
- Gericht regressietestcontract staat in `tests/security-platform-posture-regression-20261102.test.mjs`.

## Beveiliging en privacy
Provider-specifieke bevindingen, kwetsbare assets, uitvoeringsdetails, incident-ID's en ruwe scanresultaten blijven in het bestaande private register. GitHub-pr, tests en openbare documentatie bevatten geen credentials of interne bronobservaties.

## Verificatie en vrijgave
De nieuwe controles zijn pas productiefunctionaliteit zodra Required/BRAIN/CodeQL en de browsercontrole voor exact dezelfde SHA geslaagd zijn, de beschermde merge is geland, Netlify het mergecommit draait en een onafhankelijke portalreadback de ingelogde, tenant-gescopeerde UI bevestigt.

Het registreren van `agent-security` taken is **geen** bewijs dat alle providerpollers al periodiek zijn gekoppeld. Externe GitHub/Netlify providerbewaking blijft `NOT_WIRED` totdat de bestaande executor die bronnen aantoonbaar periodiek heeft gecontroleerd en de readback in de oorspronkelijke private Security Trust snapshot staat. 
