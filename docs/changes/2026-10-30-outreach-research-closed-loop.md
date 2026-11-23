# Eén gesloten commerciële herstelroute: bronweigering → oorspronkelijk relatieonderzoek

**Datum:** 30 oktober 2026. **Status:** kandidaat; geen live claim vóór beschermde tests en productie-readback.

## Geobserveerde oorzaak
De bestaande outreachfunctie `powerhouse-autonomous-outreach` (Edge v455) is actief en de originele dagelijkse cron #112/113/114 en uurlijkse assurance #129 lopen. De enige recente `prepared` e-mailactie heeft menselijke ontvangersautorisatie, maar alleen een LinkedIn-profiel-URL en geen concreet publiek bedrijfssignaal (`human_readable_context=false`, `source_trigger_relevance=false`). Composer weigert terecht `SOURCE_SPECIFIC_EVIDENCE_REQUIRED`. Hoewel het bericht tegen Gmail verzenden beschermd is en deze exacte fout nu in de originele action staat, komt er automatisch geen brononderzoek terug omdat `public.powerhouse_execute_relationship_research_v1` uitsluitend `research_enrichment/internal` uit de bestaande `relationship-research:%` wachtrij oppakt.

## Canonieke correctie
De bestaande outbound-Edge maakt bij die **specifieke** bronweigering, mits dezelfde actie en person/company-key geldig zijn, één `research_enrichment/internal` actie in de **bestaande** `public.powerhouse_sales_actions`. Dedupe-sleutel `relationship-research:outreach-source:<original action uuid>`; Supabase UPSERT `ignoreDuplicates=true`. Status `suggested`, `external_side_effect_allowed=false`, `delivery_not_attempted=true`; nooit een publieke send-actie. De bronagent, niet de verzender, is eigenaar van de oorspronkelijke onderzoeksmethode. De oude e-mail houdt `status=prepared` en exacte oorspronkelijke fout en research-dedupe in `execution_gate`.

De bestaande research executor kan de taak bij zijn **oorspronkelijke natuurlijke commerciële cyclus** oppakken, uitsluitend met echt bedrijfsnieuws, verifieerbare bronnen of bestaand consent-vrij legaal publiek onderzoek. Een ontbrekend signaal mag nooit als `source_trigger_relevance=true` worden verzonnen. De bestaande tekstgenerator, ontvangersautorisatie, suppressions, cooldown, kwaliteitsgate en Gmail `SENT` readback blijven ongewijzigd.

## Portaal, ONE BRAIN, menselijke bediening
De bestaande beheerderpagina **Andere data** krijgt twee alleen-lezen calls op `powerhouse_sales_actions`; de server projecteert uitsluitend vier **aggregaten**: op bronbewijs geblokkeerde e-mails, interne pending research, afgesloten research (géén verkoop), en door de oorspronkelijke Gmail-executor geverifieerde `done`-acties. Exact 15-loop status blijft leidend; ontbrekende bron geeft `UNVERIFIED`, geen null→0 of fictieve GREEN. Er wordt geen nieuwe database, scheduler, Brain of voorziening geïntroduceerd.

Menselijke operator: bij onderzoek zonder echte signalen OPEN houden en relevante bedrijfsbron aanvullen via bestaande ingest. Bij een echt ondersteunde relevante gebeurtenis mag de tekstgenerator opnieuw beoordelen. Pas na oorspronkelijke provider-ID en onafhankelijke Gmail `SENT`/geadresseerde-readback mag Heartbeat `action` + `readback` zetten. Persoonlijke brongegevens nooit in globale admin-aggregaten tonen.

## Regressie en release
`tests/brain-outreach-research-to-portal-20261030.test.mjs` replayt 1e weigering, dezelfde dedupe-key bij volgende run, incomplete identiteit, ambigu berichtresultaat, geen Gmail-call en beveiligde admin readout. Daarnaast blijven bestaande tests en SkillOps gelden. Protected PR, Required/CodeQL/System Map → main → original Edge ACTIVE exact source → Netlify READY exact commit → onafhankelijke actie- en portaal-readback. Tot werkelijk originele providerverzending blijft de outreach-lus AMBER.
