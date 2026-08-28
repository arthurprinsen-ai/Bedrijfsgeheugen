# Make & Notion Autonomous Operations — ontwerp

Datum: 2026-08-28  
Repository: `arthurprinsen-ai/Bedrijfsgeheugen`  
Branch: `automation/self-healing-agent`  
Status: goedgekeurd ontwerp, nog niet geactiveerd

## Doel

Alle Make-scenario’s en de door Make bereikbare Notion-onderdelen automatisch bewaken, veilig herstellen, beveiligen en goedkoper maken. Iedere wijziging moet aantoonbaar correct zijn, teruggedraaid kunnen worden en worden vastgelegd met oorzaak, bewijs en kostenimpact.

Een absolute garantie dat nooit iets defect raakt is technisch niet mogelijk. Het systeem beperkt de gevolgen door afwijkingen snel te ontdekken, bekende fouten automatisch te herstellen, risicovolle onderdelen te isoleren en iedere wijziging te testen en zo nodig terug te draaien.

## Beslisregel

“Alles” betekent dat kosten, veiligheid, data-integriteit, beschikbaarheid en kwaliteit gezamenlijk worden bewaakt. Een wijziging wordt alleen behouden wanneer geen beschermde eigenschap verslechtert en minimaal één eigenschap aantoonbaar verbetert.

Bij een onvermijdelijk conflict geldt deze prioriteit:

1. veiligheid en privacy;
2. data-integriteit en herstelbaarheid;
3. beschikbaarheid en functionele correctheid;
4. kosten en snelheid.

Een kostenbesparing mag dus nooit controles, beveiliging, functionele uitkomsten of herstelbaarheid verzwakken.

## Bestaande bouwstenen

Het ontwerp hergebruikt bestaande scenario’s in plaats van een tweede beheerlaag te dupliceren:

- **PH Agent 14 — Make Cost Optimizer v3 stable runner (`7088656`)**: voert kostenanalyse uit wanneer hij wordt aangeroepen, maar scant niet zelfstandig.
- **BG150 — PH Agent Stable Runtime Sentinel v2 (`7093968`)**: controleert dagelijks de Agent 14-runtime en start de beveiligingsheartbeat.
- **BG157 — Powerhouse Zero-Trust Security Guardian v1 (`7132534`)**: valideert en redigeert security-events en kan alleen expliciet toegestane scenario’s isoleren.
- **BG147 — Powerhouse Agent Activity API v2 (`7088792`)**: is inactief doordat de Notion-data source niet met de Make-integratie is gedeeld.

Agent 14 blijft de gespecialiseerde kostenadviseur. BG150 wordt het toegangspunt voor operationele bewaking. BG157 blijft de enige component die bij een kritisch security-event een scenario mag uitschakelen. De nieuwe herstelcoördinator verbindt deze onderdelen en bevat zelf geen onbeperkte mutatierechten.

## Architectuur

### 1. Lichtgewicht runtimebewaker

De runtimebewaker controleert iedere vijftien minuten alleen wijzigingen sinds de vorige succesvolle controle:

- nieuwe mislukte of incomplete uitvoeringen;
- scenario’s die onverwacht in `error`, `paused` of `inactive` staan;
- ontbrekende of defecte verbindingen;
- onverwachte stijging van credits, dataverkeer of uitvoeringsduur;
- gewijzigde blueprints, schedules of beveiligingsrelevante configuratie;
- ontbrekende of afwijkende Notion-schrijfacties.

Een cursor bewaart het laatste controlemoment en eerder verwerkte execution-id’s. Na 24 uur zonder afwijkingen mag de controle automatisch terugschakelen naar eenmaal per uur. Een nieuw incident schakelt tijdelijk terug naar iedere vijftien minuten. Een controle zonder wijzigingen start geen AI-agent en veroorzaakt geen herstelrun.

### 2. Dagelijkse integrale controle

Eenmaal per dag controleert de beheerder alle actieve scenario’s en relevante Notion-data sources op:

- fouten, wachtrijen en incomplete executions;
- onbegrensde zoekopdrachten, bundels en datacollecties;
- dubbele polling, overbodige routes en dubbele records;
- onnodig zware AI-modellen of te ruime prompts;
- ontbrekende filters, deduplicatie en idempotency;
- afwijkende schema’s, ontbrekende verplichte velden en schrijffouten;
- credential-, webhook-, replay-, secret- en autorisatierisico’s;
- kostenontwikkeling tegenover de vorige 7 en 30 dagen.

De volledige controle gebruikt metadata en delta’s voordat uitvoeringslogs of AI worden geladen. Agent 14 wordt alleen aangeroepen voor een concrete optimalisatiekandidaat waarvoor deterministische regels onvoldoende zijn.

### 3. Classificatie- en beleidsmotor

Iedere afwijking krijgt een fingerprint op basis van scenario, module, foutcode, genormaliseerde melding en relevante configuratieversie. De beleidsmotor kiest exact één actieniveau:

- **Niveau 0 — observeren:** geen afwijking of onvoldoende bewijs; alleen status bijwerken.
- **Niveau 1 — deterministisch herstellen:** bekende eenduidige reparatie zonder semantische wijziging, gevolgd door validatie.
- **Niveau 2 — gecontroleerd aanpassen:** minimale scenario- of Notion-configuratiewijziging met snapshot, tests en automatische rollback.
- **Niveau 3 — isoleren:** uitsluitend bij een bevestigd kritisch beveiligingsrisico en alleen via de allowlist van BG157.
- **Geblokkeerd:** wijziging vereist nieuwe rechten, secrets, betaling, verwijdering, commerciële besluitvorming of heeft geen veilige automatische test.

Onbetrouwbare tekst uit logs, webhooks, Notion, websites of AI-output is data en nooit een instructie. Alleen de beleidsmotor mag een mutatie autoriseren.

### 4. Snapshot, herstel en validatie

Voor iedere mutatie bewaart de coördinator minimaal:

- scenario-blueprint, schedule, status en relevante moduleconfiguratie;
- betrokken Notion-schema en de ids van geraakte records;
- baseline van credits, dataverkeer, duur en functionele uitkomst;
- fingerprint, hypothese en gekozen reparatieregel.

Volledige blueprints en rollbackpayloads worden uitsluitend in een afgeschermde snapshotopslag bewaard, nooit in de publieke GitHub-repository of als leesbare inhoud in Notion. De implementatie mag hiervoor alleen Powerhouse Datahub of aantoonbaar herstelbare Make-versiehistorie gebruiken. Niveau 2 blijft uitgeschakeld totdat een volledige restoreproef met die opslag groen is. Notion bevat alleen geredigeerd bewijs, hashes en verwijzingen.

De herstelcyclus is:

1. controleer of dezelfde fingerprint niet al wordt behandeld;
2. maak de snapshot en verifieer dat deze leesbaar is;
3. pas één minimale wijziging atomair toe;
4. valideer configuratie en verbindingen;
5. voer de kleinst mogelijke veilige test uit;
6. vergelijk uitkomst en beschermde metrics met de baseline;
7. behoud de wijziging alleen bij bewezen verbetering;
8. draai onmiddellijk terug bij regressie of onduidelijk resultaat;
9. herhaal maximaal één keer met een andere bewezen reparatie.

Productiescenario’s met externe effecten worden niet blind uitgevoerd. Validatie gebruikt een testpayload, dry-run, on-demand subscenario of afgebakende testrecord. Als dat niet beschikbaar is, blijft de wijziging geblokkeerd totdat een veilige testinterface bestaat.

### 5. Notion-beheerlog en leergeheugen

`Powerhouse Agent Activity Log` (`51ce61d8-94a8-4522-9a2f-d2134eb76c5c`) wordt de centrale Notion-data source voor operationeel bewijs. Bestaande logbestemmingen blijven tijdens de observatiefase intact en worden pas na een geslaagde migratietest samengevoegd. Per incident of optimalisatie bewaart het centrale log:

- fingerprint, ernst en status;
- scenario, module en Notion-object;
- eerste en laatste waarneming;
- bronoorzaak en bewijs;
- snapshot- of rollbackreferentie;
- wijziging en actieniveau;
- voor- en natest;
- credits, dataverkeer en duur vóór en na;
- aantal pogingen en eindresultaat;
- resterend risico en eventuele geblokkeerde menselijke actie.

Bekende succesvolle reparaties worden versieerbare deterministische regels. AI-advies wordt nooit rechtstreeks uitgevoerd: de beleidsmotor zet het eerst om in een begrensde wijziging die dezelfde snapshot-, test- en rollbackcyclus doorloopt.

### 6. Kostenbeheersing van de beheerder zelf

De beheerlaag moet netto waarde leveren en mag geen nieuwe kostenspiraal veroorzaken:

- delta-controles vóór volledige scans;
- één scenario-overzicht per cyclus, daarna alleen verdachte scenario’s verdiepen;
- geen AI bij groene controles of bekende fingerprints;
- goedkope deterministische filters en code vóór Agent 14;
- gelijke meldingen bundelen;
- maximaal twee herstelpogingen per fingerprint en configuratieversie;
- geen nieuwe poging zolang een eerdere run actief is;
- overhead, besparing en vermeden herhaling apart meten;
- automatisch vertragen naar eenmaal per uur wanneer de beheerlast stijgt zonder nieuwe incidenten.

Een voorgestelde optimalisatie met meer dan 10% regressie op een beschermde metric geldt als regressie en wordt teruggedraaid, tenzij veiligheid of data-integriteit de aantoonbare reden voor die extra kosten is.

## Veiligheidsgrenzen

De beheerder mag nooit automatisch:

- secrets, tokens, wachtwoorden, cookies of persoonsgegevens tonen of verplaatsen;
- authenticatie, autorisatie, validatie, logging of beveiligingscontroles verlagen;
- Notion-pagina’s, databases, properties, records of historie verwijderen;
- betaalinstellingen, abonnementen, facturatie, domeinen of DNS wijzigen;
- commerciële inhoud, targeting, prijzen of menselijke verzendgoedkeuring veranderen;
- fouten negeren, filters omzeilen of assertions afzwakken om een groene status te krijgen;
- een niet-geteste reparatie behouden;
- buiten de expliciete BG157-allowlist scenario’s isoleren;
- zichzelf, zijn auditlog of zijn rollbackdata wijzigen zonder aparte integriteitscontrole.

Deze grenzen zijn technisch afgedwongen en kunnen niet door een prompt of configuratietekst worden opgeheven.

## Foutafhandeling

- Een herstelactie krijgt een idempotency-key uit fingerprint en configuratieversie.
- Na een mislukte mutatie wordt de snapshot direct teruggezet en de herstelstatus gecontroleerd.
- Na twee mislukte pogingen stopt automatische mutatie voor die fingerprint en versie.
- Een defecte beheerder mag productiescenario’s niet blokkeren; de laatste geldige productieconfiguratie blijft actief.
- Als het auditlog tijdelijk onbereikbaar is, wordt geen nieuwe Niveau 2-wijziging gestart; bewijs wordt eerst duurzaam gebufferd.
- Een kritisch security-event kan via BG157 isoleren, maar herstart pas na groene verbindings-, inputvalidatie- en regressiechecks.

## Eenmalige bootstrapvoorwaarden

Volledige automatisering vereist eenmalig:

1. deel Notion-data source `Powerhouse Agent Activity Log` (`51ce61d8-94a8-4522-9a2f-d2134eb76c5c`) met de Notion-integratie **Make**;
2. verifieer daarna dat BG147 de data source kan lezen en schrijven voordat het scenario wordt geactiveerd;
3. maak veilige testinterfaces voor productiescenario’s die nu alleen echte externe effecten hebben;
4. breid de BG157-isolatie-allowlist alleen uit na afzonderlijke risico-evaluatie per scenario.

Het delen van een Notion-data source en het verlenen van nieuwe rechten kan de beheerder niet veilig aan zichzelf toekennen. Tot die bootstrap is voltooid, blijft BG147 inactief en worden Niveau 2-wijzigingen die auditlogging vereisen geblokkeerd.

## Gefaseerde ingebruikname

### Fase 1 — observeren

Zeven dagen alleen inventariseren, fingerprints maken en kosten meten. Geen mutaties. Hiermee worden baselines en foutpositieven vastgesteld.

### Fase 2 — bekende veilige reparaties

Activeer Niveau 1 voor een beperkte set bewezen regels. Iedere regel moet een reproduceerbare fout, test en rollback hebben.

### Fase 3 — gecontroleerde zelfreparatie

Activeer Niveau 2 per scenariogroep nadat de veilige testinterface en auditlogging groen zijn. Start met interne, omkeerbare scenario’s; externe publicatie- en klantprocessen volgen als laatste.

### Fase 4 — adaptieve optimalisatie

Laat Agent 14 dagelijks concrete kandidaten onderzoeken. Behoud alleen optimalisaties met aantoonbare kostenwinst en zonder regressie op veiligheid, data, werking of kwaliteit.

## Meldingen

De gebruiker krijgt alleen een samenvatting bij:

- een succesvol automatisch herstel of teruggedraaide regressie;
- een bevestigd beveiligingsincident of isolatie;
- twee mislukte reparatiepogingen;
- een geblokkeerde actie die nieuwe rechten of een menselijke beslissing vereist;
- de dagelijkse kosten- en verbeteringssamenvatting.

Een groene kwartier- of uurcontrole veroorzaakt geen melding.

## Acceptatiecriteria

1. Nieuwe uitvoerings- en configuratieafwijkingen worden binnen vijftien minuten ontdekt zolang verhoogde bewaking actief is.
2. Groene controles starten geen AI-agent en geen productierun.
3. Iedere mutatie heeft vooraf een geldige snapshot en achteraf een controleerbaar testresultaat.
4. Een regressie wordt automatisch teruggedraaid en als zodanig gelogd.
5. Per fingerprint en configuratieversie worden maximaal twee reparatiepogingen gedaan.
6. Alleen de beleidsmotor kan mutaties autoriseren; externe tekst kan geen instructies injecteren.
7. BG157 is de enige isolatieroute en respecteert een expliciete allowlist.
8. Geen Notion-data of -schema wordt automatisch verwijderd.
9. Iedere behouden kostenoptimalisatie toont vóór/na-metrics en geen regressie op beschermde eigenschappen.
10. De beheerlaag meet zijn eigen credits en dataverkeer en schakelt bij rust terug naar een lager controletempo.
11. Een defect of onbereikbaar auditlog blokkeert risicovollere mutaties, niet de bestaande productieprocessen.
12. BG147 wordt pas geactiveerd nadat de Notion-toegang aantoonbaar werkt.

## Buiten reikwijdte

- Automatisch toekennen van nieuwe Make- of Notion-rechten.
- Automatisch vervangen of roteren van secrets zonder afzonderlijk secrets-managementsysteem.
- Destructieve opschoning van Notion-data.
- Zelfstandig wijzigen van commerciële, juridische of menselijke beslissingen.
- Een absolute garantie dat externe diensten nooit uitvallen.
