# Portal V2 — klantinvoer, Brain en externe-data-doorwerking zonder stille verliezen

Datum: 2026-10-08. Onderdeel: bestaande ONE BRAIN/Heartbeat/Powerhouse; geen nieuwe uitvoerder, agent of database.

## Klantgerichte belofte

Een klant verandert een veld of een bron wijzigt. Het portaal toont relevante financiële, organisatorische, AI-, security-, ESG/CSRD- en procesmatige gevolgen waar er voldoende bedrijfscontext voor bestaat. Elk gevolg draagt een herkomst en bewijsstatus; zonder bewijs wordt alleen een te beoordelen impact getoond. Iedere relevante pagina wijst naar dezelfde actuele bedrijfscontext.

## Bestaande keten, hergebruikt

- Authenticated Portal V2: `createPortalDomainState` met tenant-context uit de bestaande Netlify Identity/portal-state gateway.
- Persistente klantgegevens: `/api/portal-state` en `/api/portal-business-input`; Brain `BusinessInput`, `CurrentState`, raw source observation en organisme-impact worden in de bestaande authority vastgelegd.
- Gevolgen: `portal-impact-engine` + `organism-graph`; pagina-invalidering via bestaande clientevents; waar aanwezig gevolgd door echte herberekening in legacy parity calculators.
- Externe signalen: bestaande `Source Universe & Company Impact Engine`, niet dupliceren in handmatige klantvelden. Projectie in `Actueel & externe data → Omgevingsradar` met bron, actualiteit, score, company-context, actie en bewijs.
- AI/cloud/data-soevereiniteit en connector/CSRD: bestaande afzonderlijke transactionele policies/impactreviews; geen tweede policyregister.

## Deze patch

1. Verwijdert stille afkapping van 50 nog niet bevestigde bronwijzigingen. Een groot formulier mag het bewijs niet ongemerkt kwijtraken. Een eventuele payloadlimiet of backendfout blijft fail-closed en opnieuw uitvoerbaar in dezelfde sessie; niet stilzwijgend groen.
2. Een Brain-writeback ziet alleen de bronwijzigingen die bestonden toen de persistente snapshot werd gemaakt. Een wijziging tijdens een API-aanroep krijgt een volgende causale verwerking.
3. Na bevestigde opslag worden alleen de bij die snapshot horende impacts verwijderd. Nog open wijzigingen geven `bg:portal-brain-pending` in plaats van een onterechte `bg:portal-brain-synced`.
4. Ongewijzigde invoer produceert geen extra sectiespecifieke causal-writeback (de generieke state-client kan zelf nog een no-op state-write doen).
5. Native financiële velden en externe-intelligence-pagina's veroorzaken nu finance, ESG/CSRD, personeel, compliance en strategische herbeoordelingsimpacts op geregistreerde bestemmingspagina's. Dit betekent **review**, niet automatisch een correcte euroberekening of wettelijke verplichting.
6. Nieuwe regressietests dekken alle pagina-IDs via de bestaande paginaregistratie, meer dan 50 invulwaarden, fout/retry, edits tijdens save, no-op en de native finance/externe impactregelingen.

## Norm voor alle volgende pagina's, formulieren, API's en externe connectors

Ieder **schrijfbaar** klantveld moet een canonieke tenant-gebonden schrijfroute gebruiken of expliciet een afwijkende authority aantonen. Een form change is nog geen geverifieerde write. Traceer voor ieder veld: `tenant → page → field → state revision → source revision → Brain ACK → impacted models/pages → calculation/review status → evidence → UI readback`.

Bij nieuwe externe providerdata: bewaar bron, identifier, observatie- en publicatietijd, toestemming, source trust, freshness en scope; herbereken alleen tenant-relevante afhankelijkheden. Toon observed / stale / review-required apart van confirmed applied. Verwerk nooit wereldwijde brondata alsof die rechtstreeks tot één klant hoort.

## Bewijs- en oplevergrenzen

- In deze wijziging is **niet** aangetoond dat alle losse formulieren/connectorwidgets in `portal-v2`, `portal-next` en legacy routes daadwerkelijk dezelfde mutatie-API aanroepen. Dit vereist een aparte statische route-inventaris en authenticated browser-E2E met echte tenant.
- Het oplossen van grote payloadafmetingen boven de bestaande gatewaylimiet vraagt afzonderlijke persistente writeback-chunking/outbox: verwijderen van de 50-event-cap voorkomt stille uitval maar garandeert geen succesvolle zeer grote submit.
- Realtime updates bij een externe bronwijziging zijn afhankelijk van de bestaande Source Universe ingest, scheduler, tenant-contextualisatie en verse Portal API-readback; een frontendsimulatie is onvoldoende.
- Deze PR zonder geslaagde Required/CodeQL, protected merge, exact-main Netlify readback en geautoriseerde klant-bewijscontrole mag niet `LIVE_VERIFIED` worden genoemd.
- Geen data, AI-runtime, cloud-provider of CSRD-regel is automatisch geactiveerd of juridisch vastgesteld.
