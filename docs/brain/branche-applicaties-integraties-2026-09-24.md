# Branche-applicaties en koppelingen — 2026-09-24

## Doel
Bedrijfsgeheugen gebruikt één branche-applicatieregister voor publieke acquisitie en Portal-koppelingen. Het register beschrijft welke applicaties in verschillende sectoren relevant zijn en welke integratieroute beschikbaar of te verifiëren is.

## Architectuur
- Canonieke catalogus: `assets/data/branche-applicaties.json`.
- Portal quick-starts blijven in de bestaande koppelingenbouwer; geen tweede connector runtime.
- `available` is geen `ready`. Echte providerconfiguratie, safe-test en execution evidence blijven verplicht.
- Partner-/toestemmingsvereisten van leveranciers worden expliciet getoond.
- Publieke SEO-hub: `/koppelingen-per-branche` met sectorlandingspagina's.
- Sitebrede navigatie verwijst naar de centrale hub.
- Make blijft retired; runtime authority blijft Supabase/Powerhouse volgens het bestaande closed-loop contract.

## Eerste sectoren
Bouw & installatie, zorg & welzijn, horeca & hotels, retail & e-commerce, logistiek & transport, zakelijke dienstverlening, industrie & productie, vastgoed & makelaardij, automotive, kinderopvang en ICT/software.

## Research-evidence
Voorbeelden van publiek bevestigde integratiemogelijkheden: 4PS API, Nedap Ons API/Podium, MendriX Developer Portal, Realworks API, Moneybird API, Shopify GraphQL Admin API, WooCommerce REST API en Salesforce REST API.

## Preventieregel
Nieuwe applicaties mogen aan de catalogus worden toegevoegd voordat een native adapter bestaat, maar UI/status mag nooit suggereren dat de provider actief of gezond is zonder providerconfiguratie en evidence-backed safe-test/execution.
