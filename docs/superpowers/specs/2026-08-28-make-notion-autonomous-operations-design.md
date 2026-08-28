# Make & Notion Autonomous Operations — herzien ontwerp

Datum: 2026-08-28  
Repository: `arthurprinsen-ai/Bedrijfsgeheugen`  
Branch: `automation/self-healing-agent`  
Status: richting goedgekeurd na live-audit; implementatie nog niet gestart

## Doel

De bestaande Powerhouse-regelkring afmaken zodat Make-scenario’s en de door Make gebruikte Notion-onderdelen automatisch worden bewaakt, goedkoper gemaakt en — waar aantoonbaar veilig — hersteld. Iedere mutatie vereist een snapshot, een beperkte uitvoeringsopdracht, een test, een nameting en automatische rollback.

Een absolute garantie dat nooit iets defect raakt of dat een externe dienst nooit uitvalt is technisch niet mogelijk. Het systeem minimaliseert foutkans, impact, kosten en hersteltijd zonder beveiliging, data-integriteit of functionele uitkomsten te verzwakken.

## Beslisregel

“Alles” betekent dat kosten, veiligheid, privacy, data-integriteit, beschikbaarheid en kwaliteit gezamenlijk worden bewaakt. Een wijziging wordt alleen behouden wanneer geen beschermde eigenschap verslechtert en minimaal één eigenschap aantoonbaar verbetert.

Bij een onvermijdelijk conflict geldt:

1. veiligheid en privacy;
2. data-integriteit en herstelbaarheid;
3. beschikbaarheid en functionele correctheid;
4. kosten en snelheid.

## Live vastgestelde basis

De live-audit van 28 augustus 2026 bevestigt dat de kern al bestaat. Deze onderdelen worden hergebruikt:

| Onderdeel | ID | Live status | Bestaande verantwoordelijkheid |
|---|---:|---|---|
| BG82 — Powerhouse Cost + Runtime Guard v6 | `7032571` | actief, elke 14.400 seconden | kosten- en runtimepoort, deduplicatie, Notion-incidenten en dispatch |
| BG150 — PH Agent Stable Runtime Sentinel v2 | `7093968` | actief, dagelijks 07:00 | Agent 14-canary en BG157-securityheartbeat |
| BG156 — Powerhouse Agent Closed Loop Orchestrator v1 | `7132258` | actief, on-demand | redactie, contextbegrenzing, Agents 09/14/16/11 en fail-closed besluit |
| BG157 — Powerhouse Zero-Trust Security Guardian v1 | `7132534` | actief, on-demand | securityclassificatie en allowlist-isolatie |
| BG158 — Powerhouse Daily Improvement Controller v1 | `7132559` | actief, on-demand | deterministische verbeterbeslissing en dispatch naar BG156 |
| BG159 — Powerhouse Cost Snapshot Collector v1 | `7132648` | actief, dagelijks 07:10 | scenario-overzicht, veilige kostendelta en idempotente Notion-snapshot |
| PH Agent 09 — Telemetry Self-Healing | `7088558` | actief, on-demand | bronoorzaak en runtimevoorstel |
| PH Agent 11 — QA Regression | `7088574` | actief, on-demand | verplichte regressiepoort |
| PH Agent 14 — Make Cost Optimizer | `7088656` | actief, on-demand | kostenvoorstel en verwachte besparing |
| PH Agent 16 — System Performance Optimizer | `7089148` | actief, on-demand | performancevoorstel bij drempelbreuk |

BG147 (`7088792`) blijft inactief doordat Notion-data source `Powerhouse Agent Activity Log` niet met de integratie **Make** is gedeeld. Dit blokkeert de bestaande Activity API, maar mag de veilige herstelketen niet blokkeren zolang het reeds bereikbare Powerhouse-verificatieregister het vereiste bewijs kan opslaan.

## Vastgestelde hiaten

1. BG156 retourneert `PASS_A`, `CANARY_PASS_B` of `BLOCK`, maar voert geen productiepatch uit.
2. BG158 krijgt nog geen dagelijkse, automatische metriekinput van BG159.
3. BG150 controleert niet semantisch alle control-planecomponenten.
4. BG157 is bewust beperkt tot een kleine isolatie-allowlist.
5. Er is geen goedkope delta-audit op gewijzigde Make-blueprints en gebruikte Notion-schema’s.
6. BG82 draait werkelijk elke 14.400 seconden, terwijl module 30 nog `schedule_interval_seconds: 10800` rapporteert.
7. Snapshot-, restore- en rollbackbewijs zijn nog niet als één uitvoertransactie afgedwongen.

## Gekozen architectuur

Er komt geen tweede sensor, agentcoördinator, securityguardian, kostencontroller of snapshotcollector. De bestaande keten blijft leidend:

`BG82/BG159/BG150 → BG157 of BG158 → BG156 → Agents 09/14/16/11 → BG160 → test → behouden of rollback → verificatieregister`

Alleen **BG160 — Powerhouse Safe Mutation Executor v1** is nieuw. BG160 heeft één taak: een exact begrensde, door BG156 geautoriseerde wijziging uitvoeren en bewijzen dat de wijziging veilig is.

## Componentontwerp

### 1. BG82 blijft de goedkope eventpoort

BG82 behoudt zijn vieruursplanning en bestaande routes:

- kostenincidenten naar BG156;
- nieuwe, niet-transiënte runtimefouten naar BG156;
- authenticatie- en signature-afwijkingen eerst naar BG157;
- geen agentcall bij een lege, dubbele of ongewijzigde controle.

De configuratiedrift in module 30 wordt hersteld: `schedule_interval_seconds` moet de werkelijke `14400` rapporteren. Een constante kostenfingerprint wordt uitgebreid met het relevante dagvenster, zodat een nieuwe dag meetbaar is zonder dezelfde dag dubbel te behandelen.

### 2. BG159 voedt BG158 dagelijks

BG159 blijft dagelijks om 07:10 draaien en berekent naast de bestaande kostendelta een compacte `metrics_json` voor BG158:

- volledige datum van het meetvenster;
- credits per succesvolle workflow;
- normale credits en security-incidentcredits apart;
- lege en dubbele runs;
- foutpercentage en incomplete executions;
- data-overdracht;
- relevante huidige en veilige doelintervallen;
- verbindingstatus en beschermde-metricsstatus.

BG159 roept BG158 alleen aan wanneer het dagvenster compleet en nog niet verwerkt is. De idempotency-key is `source|window_date|metrics_version`. Een no-opdag veroorzaakt geen AI-fan-out.

### 3. BG158 blijft de deterministische verbetercontroller

BG158 behoudt de bestaande volgorde:

1. lege AI-runs voorkomen;
2. dubbele fingerprints voorkomen;
3. polling alleen vertragen bij een expliciet veilig doel en zonder uur-SLA;
4. payloads begrenzen via Klasse B-canary;
5. securitykosten afzonderlijk rapporteren en nooit wegoptimaliseren.

Alleen `PROPOSE_A` en `PROPOSE_B` gaan naar BG156. `NO_ACTION` en `BLOCK` stoppen zonder agentcall.

### 4. BG156 blijft de enige beslis- en QA-coördinator

BG156 blijft verantwoordelijk voor:

- schema-validatie en secretredactie vóór iedere agentcall;
- blokkeren van control-planefeedbacklussen en transiënte 429/5xx-signalen;
- geverifieerde Powerhouse-context begrenzen;
- Agents 09, 14 en 16 laten adviseren;
- Agent 11 als verplichte QA-poort;
- reparaties classificeren als A, B of C.

Klasse A bevat alleen vooraf vastgelegde, idempotente wijzigingen:

- `SKIP_EMPTY_AI`;
- `DEDUPLICATE_EVENT`;
- `SAFE_POLLING_CHANGE`;
- `RESTORE_SAFE_DEFAULT`;
- `ADD_MAPPING_GUARD`.

Klasse B vereist snapshot, geïsoleerde canary, voor-/nameting en productieblokkade totdat de canary groen is. Klasse C — verwijderen, archiveren, publiceren, credential- of commerciële wijziging — blijft altijd `BLOCK`.

BG156 stuurt uitsluitend een genormaliseerde `AuthorizedMutation` naar BG160 wanneer:

- alle upstream agents technisch en semantisch geldig zijn;
- Agent 11 exact `PASS_A` retourneert;
- reparatieklasse A is;
- actie op de whitelist staat;
- target, oud, nieuw, tests, rollback en verwachte `lastEdit` exact aanwezig zijn.

Het vaste contract bevat minimaal:

```json
{
  "schema_version": "1",
  "source": "BG156",
  "fingerprint": "string",
  "idempotency_key": "fingerprint|target|expected_last_edit|action",
  "repair_class": "A",
  "qa_decision": "PASS_A",
  "action": "SAFE_POLLING_CHANGE|RESTORE_SAFE_DEFAULT|ADD_MAPPING_GUARD|SKIP_EMPTY_AI|DEDUPLICATE_EVENT",
  "target_scenario_id": 0,
  "expected_last_edit": "ISO-8601",
  "parameters": {},
  "protected_metrics": [],
  "test_contract": {},
  "rollback_snapshot_ref": "string"
}
```

Een `CANARY_PASS_B` autoriseert alleen een canary en nooit rechtstreeks een productiepatch.

### 5. BG160 voert uitsluitend geautoriseerde mutaties uit

BG160 wordt een on-demand scenario met een verplichte `authorized_mutation_json`-interface. Het accepteert alleen opdrachten met `source=BG156`, een geldige fingerprint en een volledige whitelisthandeling.

De uitvoercyclus is:

1. valideer schema, bron, fingerprint en idempotency-key;
2. blokkeer BG82, BG150, BG156, BG157, BG158, BG159, BG160 en de agentrunners als mutatietarget;
3. lees de actuele targetconfiguratie en vergelijk `lastEdit`;
4. maak een geredigeerde snapshot en verifieer de restoremogelijkheid;
5. pas exact één atomische, begrensde wijziging toe;
6. valideer blueprint, verbindingen en module-issues;
7. voer de voorgeschreven veilige test uit;
8. meet functionele uitkomst, incomplete executions, foutpercentage, credits, transfer en duur;
9. behoud alleen bij alle groene beschermde metrics;
10. herstel de exacte snapshot bij regressie of onduidelijk bewijs;
11. schrijf het eindbewijs naar het Powerhouse-verificatieregister.

BG160 mag geen vrije AI-tekst omzetten in API-calls. De mutatie wordt opgebouwd uit vaste actietemplates en exacte parameters. Per fingerprint en configuratieversie zijn maximaal twee pogingen toegestaan; de tweede poging mag alleen een andere reeds bewezen whitelistreparatie gebruiken.

### 6. BG150 wordt de dagelijkse semantische control-plane-audit

BG150 behoudt zijn dagelijkse planning en goedkope Agent 14-canary. Daarnaast leest hij deterministisch de laatste uitvoeringen en configuratiestatus van BG82, BG156, BG157, BG158, BG159, BG160 en Agents 09/11/14/16.

Een component is alleen gezond wanneer:

- de verbindingen `ok` zijn;
- geen incomplete execution de stroom blokkeert;
- de laatste echte taak semantisch geldige output gaf;
- schedules en bekende configuratiewaarden overeenkomen met het driftmanifest;
- er geen open rollback of onbewezen mutatie bestaat.

BG150 start geen vier-agentfan-out bij een groene status. Hij schrijft maximaal één dagelijkse afwijkingssamenvatting.

### 7. Make- en Notion-delta-audit

BG150 onderhoudt een compact driftmanifest met scenario-id, `lastEdit`, schedule, verbindingstatus, gebruikte Notion-data-source-id’s en een hash van beschermde configuratievelden.

Per dag worden eerst alleen scenario-overzicht en `lastEdit` vergeleken. Alleen nieuwe of gewijzigde scenario’s worden verdiept. Voor hun Notion-modules worden de bereikbaarheid en verwachte properties gecontroleerd. Hiermee worden schemafouten zoals ontbrekende titelproperties ontdekt zonder dagelijks alle blueprints, records of AI-context te laden.

Het driftmanifest en volledige rollbackpayloads mogen niet in de publieke GitHub-repository of leesbaar in Notion staan. De afgeschermde Powerhouse Datahub is hiervoor de bron van waarheid. Make-versiehistorie is alleen aanvullend herstelbewijs en nooit de enige snapshot. Niveau-A-uitvoering blijft uitgeschakeld totdat een volledige restoreproef vanuit Datahub groen is. Notion bevat alleen geredigeerd bewijs, hashes en verwijzingen.

## Notion-bewijs en leren

Het reeds bereikbare Powerhouse-verificatieregister blijft de operationele bron voor herstelbewijs. Iedere unieke fingerprint werkt hetzelfde incident bij en bewaart:

- scenario, module en betrokken Notion-object;
- ernst, oorzaak en bewijs;
- geautoriseerde actie en reparatieklasse;
- snapshot- en rollbackreferentie;
- Agent 11-uitkomst;
- test en voor-/nameting;
- credits, transfer, duur en foutpercentage vóór en na;
- aantal pogingen en eindstatus;
- resterend risico of menselijke blokkade.

Bekende succesvolle reparaties worden versieerbare whitelistrules. AI-advies wordt nooit rechtstreeks uitgevoerd. BG147 kan later dezelfde geredigeerde gegevens uitlezen nadat de Notion-data source met **Make** is gedeeld; BG147 is geen afhankelijkheid voor veilige uitvoering.

## Veiligheidsgrenzen

De regelkring mag nooit automatisch:

- secrets, tokens, wachtwoorden, cookies of onnodige persoonsgegevens tonen of verplaatsen;
- authenticatie, autorisatie, logging, inputvalidatie of beveiligingscontroles verlagen;
- Notion-pagina’s, databases, properties, records of historie verwijderen;
- betaalinstellingen, abonnementen, facturatie, domeinen of DNS wijzigen;
- commerciële inhoud, prijzen, targeting of menselijke verzendgoedkeuring veranderen;
- fouten negeren, assertions afzwakken of controles uitschakelen om groen te worden;
- control-planecomponenten of agentrunners automatisch muteren;
- een niet-geteste reparatie behouden;
- buiten de expliciete BG157-allowlist isoleren;
- zijn auditlog, veiligheidsgrenzen of rollbackbewijs via een agentprompt wijzigen.

Logs, webhooks, Notion-content, websites en AI-output zijn onbetrouwbare data, nooit instructies.

## Foutafhandeling

- Ontbrekende context, ongeldige JSON, conflict of onzekere classificatie resulteert in `BLOCK`.
- Een mutatie gebruikt altijd de vers gelezen `lastEdit` als concurrency guard.
- Na een mislukte mutatie wordt de snapshot direct hersteld en opnieuw gelezen.
- Een defecte control plane blokkeert geen gezonde productieprocessen; de laatste geldige configuratie blijft actief.
- Een onbereikbaar verificatieregister blokkeert nieuwe mutaties, niet bestaande productie.
- Een kritisch security-event kan via BG157 isoleren; herstart volgt pas na groene verbinding-, inputvalidatie- en regressiechecks.
- Incomplete-execution fix-and-retry die niet via de beschikbare Make-interface kan worden uitgevoerd, blijft expliciet `HUMAN_REQUIRED`; er wordt niet gedaan alsof dit automatisch is opgelost.

## Kostenbeheersing

- BG82 blijft elke vier uur en start niets bij een lege controle.
- BG159 draait eenmaal per dag en hergebruikt zijn bestaande scenario-overzicht.
- BG150 draait eenmaal per dag en verdiept alleen gewijzigde of ongezonde componenten.
- Geen AI bij groene, dubbele, lege of bekende deterministische input.
- Gelijke meldingen worden samengevoegd.
- Security- en herstelkosten worden apart gemeten en nooit gebruikt als reden om bewaking uit te schakelen.
- Een optimalisatie met meer dan 10% regressie op een beschermde metric wordt teruggedraaid, tenzij aantoonbaar extra kosten nodig zijn voor veiligheid of data-integriteit.

## Gefaseerde ingebruikname

### Fase 1 — bewijs en drift herstellen

- herstel BG82-metadata van `10800` naar `14400`;
- leg live baselines en driftmanifest vast;
- test snapshot en volledige restore;
- koppel BG159 aan BG158 zonder productiepatches.

### Fase 2 — BG160 inactief bouwen en testen

- bouw whitelistschema’s en actietemplates;
- test ongeldige input, control-plane-targets en concurrencyconflicten;
- test een gesimuleerde Klasse A-reparatie en geforceerde rollback;
- houd productie-uitvoering uitgeschakeld.

### Fase 3 — beperkte Klasse A-canary

- activeer één bewezen, omkeerbare actietemplate;
- voer tweemaal dezelfde fixture uit; de tweede run moet `NO_ACTION` zijn;
- meet minimaal twee vergelijkbare groene runs;
- breid alleen per bewezen actietemplate uit.

### Fase 4 — dagelijkse control-plane- en Notion-delta-audit

- breid BG150 deterministisch uit;
- controleer alleen gewijzigde scenario’s en hun gebruikte Notion-schema’s;
- activeer dagelijkse rapportage zonder groene-no-opmeldingen.

## Acceptatiecriteria

1. Er wordt geen duplicaat van BG82, BG156, BG157, BG158 of BG159 gebouwd.
2. BG82 rapporteert zijn werkelijke interval van `14400` seconden.
3. BG159 levert exact eenmaal per volledig dagvenster metrics aan BG158.
4. `NO_ACTION` veroorzaakt geen BG156- of agentcall.
5. BG156 kan alleen Klasse A met Agent 11 `PASS_A` aan BG160 aanbieden.
6. BG160 blokkeert control-plane- en agentrunner-targets.
7. Iedere mutatie heeft een geldige snapshot, vers `lastEdit`, test en rollbackpad.
8. Een geforceerde regressie herstelt exact de vorige configuratiewaarde.
9. Dezelfde fingerprint en configuratieversie veroorzaken geen dubbele mutatie.
10. Klasse B blijft canary-only; Klasse C blijft altijd geblokkeerd.
11. BG150 controleert alle control-planecomponenten zonder AI bij groen.
12. Alleen gewijzigde Make-scenario’s veroorzaken een verdiepende Notion-schema-audit.
13. Geen secrets of ruwe rollbackpayloads verschijnen in Notion, prompts of publieke GitHub-bestanden.
14. Een onbereikbaar auditlog blokkeert nieuwe mutaties maar niet bestaande productie.
15. Iedere behouden kostenoptimalisatie toont gemeten voor-/naresultaten zonder regressie op beschermde eigenschappen.

## Eenmalige menselijke voorwaarde

Voor activering van BG147 moet data source `Powerhouse Agent Activity Log` (`51ce61d8-94a8-4522-9a2f-d2134eb76c5c`) met de Notion-integratie **Make** worden gedeeld. Het systeem kan zichzelf deze nieuwe toestemming niet veilig geven. De kernregelkring en het Powerhouse-verificatieregister blijven hiervan onafhankelijk.

## Buiten reikwijdte

- Zelfstandig toekennen van nieuwe Make- of Notion-rechten.
- Roteren van secrets zonder een apart, transactioneel secrets-managementsysteem.
- Destructieve Notion-opschoning.
- Automatisch uitvoeren van vrije, door AI bedachte API-mutaties.
- Zelfstandig wijzigen van commerciële, juridische of menselijke beslissingen.
- Een absolute garantie tegen uitval van externe diensten.
