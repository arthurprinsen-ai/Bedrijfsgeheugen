# Powerhouse Revenue + Content Closure Learning — 2026-09-17

## Status

**DEELS LIVE — niet ketendicht.**

De salescockpit, Gmail freshness en menselijke execution/outcome-writeback zijn technisch gerepareerd en productie-getest. De totale keten is nog niet terminal bewezen omdat publicatie/readback voor blog, Instagram en persoonlijk LinkedIn nog open staat en LinkedIn company nog geen `LIVE_PROVEN` eindstatus heeft.

Canonical Brain lineage:

- Learning: `learning:powerhouse-revenue-content-closure-2026-09-17-v1`
- Current state: `current:powerhouse-revenue-content-closure-2026-09-17-v1`
- Failure fingerprint: `cockpit-zero-revenue-treated-as-present-v1`

## Doelarchitectuur

Eén gesloten cyclus:

`signals/connecties -> relationship/opportunity graph -> next-best-action + kanaal + timing + boodschap + asset -> Notion daily cockpit -> menselijke uitvoering -> provider/readback -> reply/meeting/offer/order/revenue outcome -> calibration/learning -> volgende decision/contentplan`

Powerhouse/Supabase blijft de canonieke runtime authority. Notion is de menselijke cockpit/projectie. Make blijft `LEGACY_RETIRED_PATH` en mag niet opnieuw de kritieke executieketen worden.

## Root cause 1 — cockpit leek compleet, writeback faalde

De cockpit/runtime stuurde bij niet-omzetuitkomsten standaard `revenueEur=0`. De database-RPC behandelde iedere niet-null revenuewaarde als expliciet omzetdragend. Daardoor konden geldige cockpituitkomsten zoals `executed`, reply/meeting/offer, `no_response`, `not_relevant` en `defer` onder water worden geweigerd, terwijl de UI de actie wel aanbood.

### Fix

De canonieke outcome-RPC is aangepast zodat:

- `0` geldig blijft als fysieke NOT NULL-opslagwaarde voor niet-gerealiseerde omzet;
- alleen positieve gerealiseerde omzet onder de revenue-gates valt;
- canonical cockpit aliases zoals `order_won` en `revenue_observed` worden ondersteund;
- `defer` en `no_response` `waiting` blijven en niet vals `done` worden;
- menselijke cockpitbesluiten first-class feedback/evidence krijgen;
- opportunity/runtime lineage behouden blijft.

Transactioneel getest in productie voor:

- `executed`
- `no_response`
- `defer`
- `revenue_observed`

Testdata is teruggedraaid; er zijn geen synthetische commerciële outcomes achtergelaten.

## Root cause 2 — zero-event provider read kon vals stale lijken

Een provider-read kan succesvol zijn zonder actionable mail of commerciële outcome. Zonder expliciete heartbeat leek de bron daarna stale of defect.

### Fix

De bestaande Gmail owner schrijft nu bij iedere geslaagde provider-read één idempotente evidence-source heartbeat, ook bij nul actionable mails. Deze heartbeat bewijst alleen freshness/readback en creëert nooit een fictieve reply, lead, afspraak, order of omzet.

## Root cause 3 — scheduler/provider `ok` is geen downstream bewijs

Een cron of sync kan technisch `succeeded/ok` rapporteren terwijl het feitelijke provider-readwindow oud is of de downstream provider-record niet meer bestaat. Dit gold onder meer voor social/provider reconciliatie.

### Regel

Job-success, API-200, scheduled en sent zijn transport-/runtime-signalen. Ze mogen nooit automatisch worden gelijkgesteld aan:

- actuele provider freshness;
- exacte final-media identiteit;
- public live proof;
- menselijke execution;
- commerciële outcome;
- learning closure.

## Permanent prevention contract

1. `NO_UI_OR_CRON_GREEN_WITHOUT_DOWNSTREAM_READBACK`
2. `ZERO_AND_ABSENT_ARE_DISTINCT_API_SEMANTICS`
3. `EXECUTION_REQUIRES_ACTION_STATUS_PLUS_HUMAN_FEEDBACK_PLUS_OUTCOME_LINEAGE`
4. `ZERO_EVENT_PROVIDER_READ_STILL_WRITES_FRESHNESS_HEARTBEAT`
5. `SENT_IS_TRANSPORT_PROOF_NOT_LIVE_OR_IDENTITY_PROOF`
6. `SCHEDULED_IS_NOT_POST_DUE_PUBLICATION_PROOF`
7. `NO_SYNTHETIC_REVENUE_OR_CONVERSION_TO_CLOSE_A_GATE`
8. `ONE_CANONICAL_RELATIONSHIP_OPPORTUNITY_ACTION_OUTCOME_LEARNING_CYCLE`
9. `NOTION_IS_HUMAN_COCKPIT_PROJECTION_NOT_PARALLEL_BRAIN`
10. `PROVIDER_READ_WINDOW_FRESHNESS_MUST_BE_MEASURED_SEPARATELY_FROM_JOB_SUCCESS`

## Huidige productie-readback

### Blog

- Status: `GENERATED`
- Artifact truth: aanwezig
- Nog vereist: approved-central queue -> BG169 -> publieke URL/readback

### Instagram

- Status: `BLOCKED`
- Provider transport: `sent`
- Blocker: `EXACT_FINAL_MEDIA_PROOF_REQUIRED`
- Mira gate: `UNPROVEN`
- Permanente regel: nooit regenereren/herpubliceren alleen om de proof-gate groen te maken

### LinkedIn company

- Status: `PUBLISHED`
- Provider: `sent`
- Nog vereist: public/provider outcome proof + metrics voordat `LIVE_PROVEN` mag worden gezet

### LinkedIn personal

- Status: `BLOCKED`
- Blocker: `PROVIDER_RECORD_MISSING`
- Exact artifact/identity gate is hersteld, maar provider truth is nog niet terminal bewezen

## Hergebruik door volgende agents/chats

Elke vervolgchat/agent moet deze lineage eerst lezen en vervolgens:

- geen parallel CRM/cockpit/queue/learning store bouwen;
- geen gesloten-lusstatus afleiden uit UI, cron of provider transport alleen;
- observed facts, inference, prediction, outcome en learning gescheiden houden;
- technische recovery zelfstandig voortzetten tot terminal bewijs of een echte externe boundary;
- nooit omzet, reacties, afspraken, live-publicatie of identity proof synthetisch invullen om een gate groen te krijgen;
- alle nieuwe evidence en nieuwe root-cause-informatie in deze bestaande lineage terugschrijven.

## Definition of Done

Pas `LIVE & BEWEZEN` wanneer:

- de menselijke actie vanuit de cockpit aantoonbaar canonical writeback produceert;
- relevante provider-readback actueel en exact is;
- downstream reply/meeting/offer/order/revenue outcomes als observed evidence worden vastgelegd;
- content/publicatie-obligations terminal zijn (`LIVE_PROVEN`/geldige terminale state);
- prediction/calibration uitsluitend op echte outcomes draait;
- Supabase canonical Brain + repositorydocumentatie dezelfde actuele waarheid tonen.
