# CSV/Excel-bron zichtbaar op de juiste Portal V2-pagina

**Datum:** 22 november 2026. **Deel van:** originele Portal V2 → BusinessInput → ONE BRAIN → Powerhouse → Heartbeat.

## Wat is veranderd
De bestaande importknop maakt al een gecontroleerde klantgebonden bron inclusief datatype, doel, kolomrollen en beoogd bedrijfsdomein. De bijbehorende brongegevens (niet alleen bestandsnaam of aantallen) worden vanaf deze wijziging op de relevante bestaande **portaalpagina** getoond. De bronkaart toont het bronsysteem, zakelijk doel, datum, gegevensperiode, oorspronkelijke kolomnamen en waarden en een tabel met zoeken en pagineren. De gebruiker kan na opslag vanuit de importdialoog en importgeschiedenis meteen naar de bijbehorende pagina.

## Bestemming per gecontroleerd domein

| Gecontroleerde bestemming | Bestaande pagina | Route |
| --- | --- | --- |
| KPI's en bedrijfsresultaten | Cijfers en maatstaven | `?page=cijfers-maatstaven` |
| Financiën, facturen en debiteuren | Waarde en financiering | `?page=waarde-financiering` |
| Klanten en relaties | Sales Intelligence | `?page=sales-intelligence` |
| Service en operations | Data en AI (bedrijfsbronnen) | `?page=data-ai` |
| Voorraad en producten | Data en AI (bedrijfsbronnen) | `?page=data-ai` |
| Personeel en organisatie | Mensen | `?page=mensen` |
| Marketing en conversies | Andere data | `?page=andere-data` |
| Energie en duurzaamheid | CSRD & Impact | `?page=csrd-impact` |
| Projecten en planning | Roadmap | `?page=roadmap` |
| Onderzoek of niet ingedeeld | Onderzoek / Data en AI | `?page=onderzoek` / `?page=data-ai` |

Alle bestanden zijn op `data-ai`, `datahubstatus` en `ingevulde-gegevens` in het centrale bronnencatalogusoverzicht terug te vinden; oudere imports zonder bevestigde betekenis worden alleen centraal getoond. Er is geen extra navigatiebalk nodig. Als er geen specifiek Operations- of Voorraadonderdeel bestaat, fungeert het bestaande Data & AI als gecontroleerde bronbestemming; geen fictief eigen domeinscherm.

## Integriteit en privacy
- Client projecteert uitsluitend opgeslagen rijen uit het **bestaande** `stateClient.getSnapshot()` met dezelfde gebruiker/tenant. Geen demo, onbekende sessie, ongeldige serverstatus of datasets met corrupte IDs.
- Er is geen tweede opslag-, sync-, export- of KPI-write-pad. Originele `domainState.patch`, `flush()`, server-readback en Brain handoff blijven de exclusieve importprocedure.
- Bronrijen worden als DOM-tekst weergegeven. Formules en HTML uit CSV worden niet uitgevoerd of gerenderd als HTML. Elke tabel kan worden doorzocht en geeft maximaal 20 rijen per pagina met volgende/vorige bediening; alle opgeslagen rijen blijven beschikbaar.
- `automaticKpiWrite=false`, `automaticExternalAction=false`, geen automatische factuur→omzetconversie of financieel resultaat. Gegevens worden expliciet als **brongegevens** gelabeld.
- Na uitloggen, wisselen van account of verlopen readback wordt de bestaande pagina direct leeggehaald van brongegevens. Bij eerdere niet-geclassificeerde imports worden geen bestemmingen verzonnen.

## Verificatie
- Dependency-vrije Node regressie: `node --test tests/brain-portal-imported-data-destination-v1.test.mjs` (positieve tabelroute, echte tabelwaarden, zoeken, paginering, verwijderen op logout, route-mapping, ontbreken van onjuiste KPI-mutatie, cross-tenant en demo-afscherming).
- Protected Required, CodeQL, productie-commit + publieke browser- en CSS-readback; daarna echte ingelogde CSV/XLSX upload en teruglezing nog separaat met klanttoestemming. Productie READY is niet het bewijs van een klantimport.
