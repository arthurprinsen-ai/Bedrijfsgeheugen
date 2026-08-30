# Powerhouse Cost & Reliability Regression Ledger — 2026-08-30

Status: canonieke leer- en regressiebron voor Make/Powerhouse-kosten, agent-context, control-plane, cache, learning, publishing en runtime-reliability.

Gebruik: lees dit document vóór wijzigingen aan Make-scenario's, PH Agents, control-plane, Datahub/Notion-learning, cockpit/API-readroutes, guardians, publishing en cost/performance-optimalisatie. Herhaal geen afgewezen aanpak zonder nieuwe evidence.

## Niet-onderhandelbare werkwijze

`detect -> runtime evidence -> root cause -> regression test -> smallest reversible fix -> retest -> production verification -> learning writeback -> prevention automation`.

Geen claim FIXED/WORKING/PRODUCTION GREEN zonder verse runtime evidence. Geen brede massamutatie zonder één-hypothese-per-wijziging. Kosten mogen nooit worden verlaagd door correctness, approvals, publishing, attribution, commercial freshness, human-send safety, security of outcome obligations te verzwakken.

## Platform fingerprints die niet opnieuw ontdekt mogen worden

### make-datastore-exact-get-404
- Symptoom: `/v2/data-stores/{id}/data/{key}` GET geeft 404, ook als PATCH-by-key voor dezelfde key werkt.
- Root cause: deze Make-omgeving ondersteunt geen betrouwbare exact-key GET voor Data Store records via deze API-route.
- Bewezen fix: dedicated one-record datastore + bounded list read `pg[limit]=1`.
- Verboden regressie: exact-key GET opnieuw introduceren of retry-loopen.

### make-api-repeated-query-params
- Symptoom: `qs` met herhaalde `id[]`/`cols[]` houdt alleen de laatste waarde over.
- Root cause: Make `makeApiCall` qs-mapper collapse van repeated keys.
- Bewezen fix: encode repeated array params direct in de URL-querystring.
- Bewijs: BG150-probe met expliciete URL gaf exact de gevraagde PH-scenario's en velden.

### notion-richtext-max-2000
- Symptoom: `[400] body.properties.<field>.rich_text[0].text.content.length should be ≤ 2000`.
- Root cause: samengestelde JSON/context werd zonder harde Notion-grens geschreven.
- Bewezen fix: BG166 normaliseert bewijs/context naar <=1800 chars vóór Notion-write.
- Regressie: oversized canary >4k input schreef succesvol; Bewijs werd begrensd en geen 400 trad op.

### make-blueprint-validator-false-warnings
- Symptoom: `scenario_patch` waarschuwt soms `parameters/url` of `parameters/scenario required` terwijl werkende modules de velden zichtbaar in mapper/config bevatten.
- Regel: warning is geen runtime proof. Verifieer met `scenario_run`/execution evidence; repareer niet blind op validatorwaarschuwing alleen.

### make-rate-limit-recovery
- Symptoom: `Too Many Requests` tijdens snelle beheer-/debugcalls.
- Bewezen gedrag: niet blijven hameren; laat de rate-limit window aflopen en hervat exact vanaf laatste geverifieerde state.
- Regressieregel: geen agressieve retry-loop voor Make beheer-API.

## Cost architecture contract

Voorkeursketen: `event/change -> authoritative source -> bounded delta -> cached/precomputed projection -> deterministic processing -> AI only on material uncertainty/change -> one deduplicated write -> learning/telemetry`.

Cost ladder:
1. duplicate/dead/failed/superseded work verwijderen;
2. cache/precomputed state vóór live reads;
3. full scans naar delta/change;
4. collections/executions/webhooks bounded;
5. alleen gebruikte velden ophalen;
6. writes batchen/dedupen;
7. downstream skippen bij empty/unchanged/processed/deduped;
8. deterministic vóór AI;
9. goedkoopste adequate model;
10. polling alleen als event/change niet kan en SLA het vereist;
11. retire/consolidate pas na compatibility + regression evidence.

## Bewezen scenario-lessons en current-state evidence

### BG159 — Cost Snapshot Collector
- Probleem: dagsnapshot-dedupe zat na een dure team-scenario-read van ~0.4–1.0 MB.
- Fix: `already done today?` guard vóór zware scan.
- Post-change duplicate-run: ~2 ops / 3 credits / 13 KB versus ~4 ops / 6 credits / ~1 MB.
- Contract: dagelijkse duplicate invocation moet vóór brede Make inventory stoppen.

### BG139/BG190 — Mission Control cache-first
- Historische direct path: ~7 ops / 8 credits / ~71 KB per request.
- Bewezen cache-hit verbetering: ~4 ops / 5 credits / ~22 KB; BG190 direct cache route ~2 ops / 3 credits / ~31 KB zonder Notion fan-out.
- Cache-Control: 3600s default TTL, stale-while-revalidate 600s tenzij freshness evidence korter vereist.
- Exact-key datastore GET is afgewezen vanwege 404; bounded list-read blijft fallback.
- Let op: echte resterende kosten kunnen uit caller/browser requestfrequentie komen; cache alleen is niet genoeg wanneer caller cache negeert.

### BG84 — DM identity + learning sync
- Oorspronkelijke fout: blueprint-validatie en ongeldige JSON in idempotency gate; mapper renderde separator als `\|` in JSON.
- Mislukte aanpak: `concat(...)` in die mapper-context werkte niet betrouwbaar.
- Bewezen fix: deterministic key-building buiten handgebouwde JSON; veilige Notion/API gate; `recent AND Attribution Updated empty`; max 3 kandidaten; no-candidate gate vóór downstream.
- Oude corrupte v1.5 uitgeschakeld; cost-safe opvolger v1.6 actief.
- No-op bewijs: 1 op / 1 credit / 27 bytes versus eerdere succesvolle ~6 ops / 6 credits / 44 KB.
- Contract: nooit terug naar `recent OR unattributed`; nooit `dm:onbekend` downstream laten ontstaan bij 0 kandidaten.

### BG126/BG127/BG128 — commercial intelligence
- Root cause: klokgestuurde flows gebruikten een Notion Search van 1 record puur als dummy trigger en deden daarna de echte query opnieuw.
- Fix: dummy Notion trigger vervangen door scheduled start; inhoudelijke graph/dedupe/write-keten behouden.
- BG126: 9->8 ops, 10->9 credits, ~257->215 KB.
- BG127: ~4 ops / 5 credits / 140 KB.
- BG128: ~3 ops / 4 credits / 110 KB.
- Shared 429-window rond dezelfde starttijden: stagger non-time-critical work en vermijd gelijktijdige Notion/API bursts.

### BG131 Trading Cockpit
- Probleem: herhaald openen kon drie live Notion-reads per call doen en response gebruikte no-store.
- Fix: private korte browsercache (2 min) zonder commerciële semantiek te wijzigen.
- Contract: user-facing freshness beschermen; cachewindow alleen verkorten bij bewezen business-SLA.

### BG98 Research
- Probleem: canonical dedupe-cache haalde tot 50 volledige Notion-records terwijl code alleen Canonical Key gebruikte.
- Fix: field projection naar alleen Canonical Key.
- Contract: researchkwaliteit/Tavily-budget niet verlagen als primaire besparing; eerst payload en duplicate-work reduceren.

### BG150 — Runtime Sentinel
- Ernstige burst: tot 67 ops / ~84 credits / ~5.6 MB per run.
- Root cause: brede team-scenario inventory in een goedkope sentinel.
- Bewezen API-patroon: `id[]` en `cols[]` direct in URL; niet in qs mapper.
- Post-change runtime: 3 ops / 4 credits / ~2.1 KB, >99% transferreductie versus ~350 KB recente brede statuscall.
- Contract: sentinel leest alleen PH01–PH16 en noodzakelijke statusvelden.

### BG166/BG167/BG168 — shared learning & agent memory
- BG166 coalescing: oude 10s bucket liet refreshes over bucketgrenzen dubbel door; atomic duplicate-key reservation bewezen betrouwbaar.
- Fix: max één BG167 refresh per minuut; vaste 5s sleep verwijderd.
- Alle echte learning-events blijven afzonderlijk opgeslagen; alleen context-rebuilds worden samengevoegd.
- BG167: dedicated one-record `PH Team Context Cache` + compatibility dual-write; oude projection pas verwijderen na dependency-audit en minstens 24h groen dedicated path.
- PH runners lezen dedicated bounded cache, niet exact-key GET.
- BG168 classifier bug: gezonde canary/health outputs werden als AGENT_ERROR gezien omdat woorden als `error` voorkwamen in geciteerde learning-context of `no error condition`.
- Fix: verification/canary + expliciete no-change/no-repair semantics => NO_ACTION vóór keyword-fallback.
- Regressie: dezelfde PH09/PH01 outputs geven nu `NO_MATERIAL_CHANGE` en veroorzaken geen BG166/Notion-write/BG167-refresh.

### PH agent context/token costs
- Root cause: veel runners kregen 6k–12k chars volledige team-JSON per taak, inclusief irrelevante ownership/control-plane/learningdetails.
- Architectuurcontract zei al mission-relevant context only; implementatie voldeed daar niet aan.
- Fix: compact worker context met authority, hard boundaries, production contract, platform fingerprints, current missions en slechts nieuwste relevante learnings.
- PH11 canary: inputtokens 4083->3203 (-21.6%), credits 27.21->21.65 (-20.4%) met dezelfde conservatieve QA-uitkomst.
- PH01 canary: 3124->1855 inputtokens (-40.6%), credits 21.37->12.77 (-40.2%).
- PH04 canary: 1718 inputtokens / 12.21 credits en BG168 daarna NO_ACTION op 1 op / 2 credits.
- PH14 en PH15 hebben specialistische compacte context en mogen niet blind naar generiek patroon worden omgezet.

### BG162 Adaptive Cost & Quality Governor
- Root cause: brede datastore-dedupe-read vóór beslissing.
- Fix: atomic reservation-first dedupe; duplicate key collision stopt expensive specialist chain.
- Eerste unieke event: ~3 ops / 4 credits / 3.6 KB.
- Exact duplicate: ~2 ops / 3 credits / 2.1 KB.
- Belangrijke incidentles: verwijderen van een oude branch nam downstream modules mee; governor direct gedeactiveerd, routing volledig herbouwd, pas na first-occurrence + duplicate regressietest weer geactiveerd.
- Contract: production governor nooit actief laten in half-gemigreerde routingstate.

### BG14 Narrative calibration
- Root cause van dure burst: overlappende runs verwerkten dezelfde learning-kandidaten parallel door AI. Drie runs rond 16:12–16:13 kostten samen ~292 credits (ca. 145 + 100 + 47).
- Fix: 10-min atomische run-lock vóór Notion Search en AI; duplicate lock wordt via Commit terminal no-op.
- Geïsoleerde locktest: eerste run bereikt downstream; tweede identieke lock stopt op 1 op / 1 credit.
- Productie-regressietest: seeded duplicate BG14 run stopte na lock-opbouw + reservation op 2 ops / 3 credits, 0 Notion, 0 AI.
- Contract: AI-scoringkwaliteit niet verlagen om concurrencyverspilling te compenseren; duplicate work vóór AI stoppen.

### BG185 Agent Fabric Contract Guardian
- Root cause: daily guard-window (05:45–09:00 Europe/Amsterdam) werd pas ná volledige teaminventory gecontroleerd.
- Voorbeeld buiten window: 3 ops / 4 credits / ~359 KB puur om daarna no-op te geven.
- Fix 1: cheap deterministic time gate vóór Make inventory.
- Post-change outside-window: 1 op / 2 credits / 147 bytes.
- Fix 2: in-window inventory projecteert alleen `id,name,lastEdit,isinvalid` via URL `cols[]` params.
- Probe: ~38 KB versus ~359 KB, auto-discovery behouden.

### BG145 Control Plane Delta API — open optimization
- Observatie: instant endpoint wordt vrijwel klokvast iedere ~7–8 minuten aangeroepen.
- Normale run: 4 ops / 5 credits / ~26 KB met één live Notion query.
- HTTP response heeft al 30m public cache, maar requesthistory bewijst dat caller dit niet betrouwbaar respecteert.
- Belangrijk: alleen server-side datastorecache toevoegen verlaagt Make operations nauwelijks als caller dezelfde frequentie houdt.
- Eerstvolgende root-cause stap: caller/pollingbron traceren en vervangen door delta/event/change-driven refresh of lagere bewezen-safe frequentie.
- Geen pollingwijziging zonder exacte caller + freshness/SLA evidence.

## Publishing / outcome reliability lessons

- Een `success` Make-run zonder externe post-id/publicatielink is geen bewijs van publicatie.
- Geen blinde retry van publishers wanneer idempotency/content identity niet aantoonbaar is.
- Generic weekblog workflow zonder exact slug/content identity is niet idempotent.
- Bron/queue timing mismatch moet als architecture repair worden behandeld, niet als retry-probleem.
- Approved copy mag niet worden herschreven om publishing technisch groen te maken.
- Elke publicatie-outcome vereist exact extern bewijs of expliciete hard-boundary state.

## Regressie-eisen voor nieuwe scenario's en agents

Elke nieuwe of gewijzigde flow moet vóór production aantonen:
- authoritative source + stable dedupe/idempotency key;
- event/change trigger of expliciete polling-rationale;
- max batch/page/sample bound;
- field projection van alleen consumed fields;
- cache/delta strategy voor read-heavy routes;
- AI alleen als deterministic route onvoldoende is;
- expected credits/transfer per useful outcome;
- protected metrics + rollback;
- compatibility mapping;
- shared-context read voor agents;
- material-outcome writeback alleen voor materiële verandering;
- geen false-learning op healthchecks/no-op canaries;
- no duplicate parallel stores als canonical Datahub/ledger volstaat.

## Evidence discipline

Bewaar per optimalisatie:
`scenario id/name -> baseline run(s) -> root cause -> exact change -> post-change run -> ops/credits/transfer/duration -> protected metrics -> rollback -> fingerprint`.

Gebruik lifetime credits alleen voor prioritering; beslis op actuele runprofielen. Scenario's die historisch duur waren maar nu 1 op / 1 credit no-op draaien, niet opnieuw complex maken zonder actuele evidence.

## Open werk na deze sessie

1. BG145 caller/pollingbron exact traceren en requestfrequentie reduceren zonder control-plane freshness te schaden.
2. Dedicated team-context compatibility projection na >=24h groen + dependency audit eventueel sun­setten.
3. Resterende actieve scenario's rangschikken op actuele credits per useful outcome en transfer per successful run; highest current waste first.
4. Stagger resterende gezamenlijke Notion/API schedules wanneer 429-overlap aantoonbaar is.
5. Cost regression checks in promotion/QA blijven uitbreiden zodat deze fingerprints automatisch release-blocking worden.
