# Powerhouse Make- en agentkostenbeheer

## Doel en harde grens

Alle Make-scenario’s en geregistreerde Brain-agents delen één maandbudget van **10.000 credits**. Governed AI-providercalls hebben daarnaast een afzonderlijke grens van **10.000 gemeten tokens** per maand. De actuele machineleesbare policy staat in `config/brain-cost-policy.json`. Kostenoptimalisatie mag functionaliteit, security, productiebetrouwbaarheid, data-integriteit, human-send safety of andere protected metrics nooit verslechteren.

## Canonieke flow

1. BG159 leest de volledige actuele Make-inventory en schrijft één dagelijkse aggregate Cost Snapshot.
2. De componentcatalogus voegt alle geregistreerde Brain-agents toe. Nieuwe scenario’s en agents verschijnen zonder handmatige dashboardwijziging.
3. Onbekende optionele onderdelen krijgen `UNCLASSIFIED` en `BUDGET_DEFERRED`; protected onderdelen blijven beschikbaar voor security-, reliability- en production-interrupts.
4. Het dagelijkse budget wordt uit resterende credits en resterende kalenderdagen berekend. De beslissingen zijn `RUN`, `CHEAP_PATH` of `BUDGET_DEFERRED`.
5. De optimizer mag maximaal één bewezen veilige, reversibele productieverbetering per dag uitvoeren en maximaal twee identieke retries per hypothese doen.
6. Iedere materiële beslissing of uitkomst gaat met fingerprint en lineage via BG168 naar BG166/BG167. Productiepromotie loopt uitsluitend via BG169.
7. De centrale Brain AI-adapter schrijft na iedere gekoppelde providerrespons uitsluitend input-, output- en cachetokenaantallen naar een append-only, request-idempotent usage-ledger. Prompttekst en bedrijfscontext worden nooit opgeslagen.
8. Tokenvelden met `UNMETERED` zijn expliciet onbekend en mogen nooit als nulverbruik worden geïnterpreteerd. Nieuwe AI-adapters moeten dezelfde tokenmeter gebruiken voordat ze production-ready zijn.

## Intern dashboard

- Route: `/intern/powerhouse-kosten/`
- API: `/.netlify/functions/powerhouse-costs`
- Alleen `GET`; mutaties worden geweigerd.
- De API autoriseert uitsluitend de server-side Netlify Identity-rol `powerhouse-cost-admin` uit `app_metadata.roles`.
- Anonieme verzoeken krijgen `401`; ingelogde gebruikers zonder rol `403`.
- CSP, `no-store`, `noindex`, frame-denial en MIME-sniffing-bescherming zijn verplicht.
- Alleen geaggregeerde metingen worden getoond. Raw prompts, CRM/DM-inhoud, secrets en credentials mogen nooit in de projectie komen.

Netlify Identity moet door een accountbeheerder invite-only worden gehouden en de rol moet door die beheerder aan toegestane interne gebruikers worden toegekend. Dit is bewust een hard boundary: code kan geen accounts, permissies of credentials autonoom wijzigen. Zonder geldige rol blijft het dashboard fail-closed.

## Dagelijkse controles

1. Controleer of de nieuwste BG159-snapshot een actuele timestamp, budget envelope en volledige scenario-inventory bevat.
2. Controleer dat alle agentregistraties als `agent:<id>` in de projectie voorkomen.
3. Controleer maandverbruik, resterend budget, dagruimte en pace state.
4. Rangschik op credits per geverifieerde uitkomst; absolute credits alleen zijn onvoldoende.
5. Controleer tokenverbruik per gekoppelde AI-component en behandel `UNMETERED` als een coverage-gap, niet als nul.
6. Onderzoek duplicate executions, retries, transferpieken, stale workers en kosten zonder verified outcome.
7. Pas alleen de hoogste veilige kandidaat aan; vergelijk dezelfde route vóór en na de wijziging.
8. Behoud de wijziging alleen bij lagere genormaliseerde kosten, maximaal 10% latencyregressie en groene protected metrics.
9. Routeer het outcome-event en verifieer het daarna in BG167.

## Herstel en rollback

- Ongeldige of contradictoire metingen gaan in quarantine; gebruik de laatste geverifieerde projectie.
- Bij dashboard-authz- of datalekregressie: blokkeer de kandidaat en rollback via de Production Promotion Guardian.
- Bij kostenregressie: herstel de laatst bekende scenario-blueprint met de exacte `lastEdit`-guard en voer dezelfde canary opnieuw uit.
- Bij budgetuitputting: stel optioneel werk uit. Verhoog nooit autonoom betaalde capaciteit.
- Een technische succesvolle run is niet terminal zonder geverifieerde business- of operationele uitkomst.

## Bekende geverifieerde verbetering

Op 30 augustus 2026 is BG159 herhaalverrijking beperkt tot de eerste dagelijkse snapshot. De repeat-path daalde van 17 naar 6 credits en van 13 naar 4 operations; duur daalde van 13.377 ms naar 4.633 ms. De volledige catalogus en budget envelope zijn daarna met een succesvolle canary gevalideerd.
