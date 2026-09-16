# Powerhouse Completion Supervisor v1 — Design

Datum: 2026-09-16  
Fingerprint: `powerhouse-completion-supervisor-v1`

## Doel

Iedere materiële Powerhouse-taak blijft actief totdat de beoogde uitkomst aantoonbaar `LIVE & BEWEZEN` is. Claims zoals `gecommitteerd`, `gemerged`, `preview`, `gedeployed`, `niet geclaimd`, `DEELS LIVE` en een rode gate zijn voortgangssignalen en mogen het werk niet succesvol of stilzwijgend beëindigen.

## Bewezen huidige situatie

PR #1754 voegde `powerhouse-live-until-proven-v1` toe aan de Engineering OS-configuratie, validator, documentatie en Required-regressietest. Die wijziging bewaakt het contract, maar voert geen herstelwerk uit.

De bestaande uitvoeringsbasis is al aanwezig:

- `platform/agents/agent-fabric.mjs` routeert één eigenaar en support-agents en bewaakt completion-readiness;
- `tools/outcome-obligation-runtime.mjs` en de Supabase-stores bewaren AgentWork, evidence en recovery idempotent;
- `config/outcome-obligations.json` bepaalt dat een commit of merge geen completion is;
- `BRAIN-DELIVERY-v2`, BG169 en de productie-readbackworkflows beheren kandidaatidentiteit, protected delivery en productie-evidence;
- `brain/policy/completion-readiness.mjs` blokkeert completion met open obligations.

De concrete gaten zijn:

1. `evaluateCompletionReadiness` behandelt een bewezen hard boundary als `canComplete: true`;
2. Agent Fabric kan daardoor niet-groen werk als `Resolved` afsluiten en uit de actieve deduplicatie-index verwijderen;
3. Outcome Obligation Sweep maakt duurzame beslissingen en recovery-records, maar de statusclaim zelf heeft geen centrale normalisatie of next-action dispatch;
4. het contract verplicht auto-resume, maar er is geen eventgedreven supervisor die open werk opnieuw evalueert na delivery-, readback- of boundary-events;
5. bestaande partial claims en open PR-/readback-obligations worden niet systematisch teruggevuld in dezelfde actieve herstelroute.

## Scope

Completion Supervisor v1 geldt voor alle bestaande en toekomstige materiële Powerhouse-chats, agents, AgentWork-items, delivery lanes en outcome obligations.

De supervisor maakt geen nieuw geheugen, queue, CRM, delivery authority of statusregister. Hij is een besturingsadapter boven op de bestaande Agent Fabric, Outcome Obligation/Supabase-stores, BRAIN-DELIVERY-v2, BG169, BG167 en BG168/BG166.

Niet-materiële uitlegvragen zonder uitvoerings- of productiedoel vallen buiten deze runtime.

## Terminologie en statusmodel

### Succes

`LIVE & BEWEZEN` is de enige succesvolle terminale uitkomst. Machine-state is `LIVE_VERIFIED`.

Deze uitkomst vereist tegelijk:

- relevante kandidaat- en regressietests groen;
- protected delivery van de exact geteste kandidaat;
- exacte productie- of provideridentiteit;
- functionele productie/provider-readback van het bedoelde resultaat;
- alle materiële outcome obligations met geaccepteerde evidence voltooid;
- actuele capability-handoff/current-state;
- learning- en prevention-writeback zichtbaar in gedeelde context.

### Actieve tussenstanden

De volgende signalen worden genormaliseerd naar actief werk en nooit naar completion:

- `COMMITTED`;
- `MERGED`;
- `PREVIEW_READY`;
- `DEPLOYED_UNVERIFIED`;
- `NOT_CLAIMED`;
- `DEELS LIVE`;
- `NIET GEDAAN`;
- `FAILED`;
- `RED`;
- `AWAITING_OUTCOME`;
- `MISSED_OBLIGATION`;
- `RECOVERING`;
- ontbrekende exacte SHA, readback, writeback of learning.

Afhankelijk van evidence levert de supervisor `CONTINUE`, `RECOVER`, `PROMOTE`, `READBACK`, `WRITEBACK` of `WAIT_EXTERNAL` als volgende besturingsactie.

### Harde externe grens

Een harde grens is geen succesvolle completion en mag AgentWork niet `Resolved` maken. Agent Fabric gebruikt de bestaande actieve toestand `WaitingApproval`; de duurzame obligation blijft `BLOCKED_HARD_BOUNDARY` met een volledig recovery packet.

Een geldig recovery packet bevat:

- blocker;
- root cause of sterkste evidence;
- concrete evidence-referenties;
- reeds uitgevoerde herstelpogingen;
- veilige resterende acties;
- minimale menselijke actie;
- fix-agent-handoff;
- boundary-fingerprint;
- `resume_when`-conditie.

Zodra nieuwe evidence de boundary-fingerprint ongeldig maakt of de `resume_when`-conditie waar wordt, gaat hetzelfde AgentWork-item terug naar `Investigating` of `Executing`. Er ontstaat geen duplicaat.

## Architectuur

### 1. Pure Completion Supervisor-policy

Een gefocuste module `platform/agents/completion-supervisor.mjs` normaliseert claims en bepaalt uitsluitend de volgende actie. De module schrijft niets extern en is volledig deterministisch testbaar.

Invoer:

- task/change/obligation identity;
- actuele AgentWork-state;
- delivery state;
- productie/provider-evidence;
- material obligations;
- learning/writeback evidence;
- hard-boundary evidence;
- eerdere retry-hypothese en attempt-count.

Uitvoer:

- `success: boolean`;
- `normalized_state`;
- `next_action`;
- `open_obligations`;
- `required_evidence`;
- `recovery_packet`;
- `idempotency_key`;
- `resume_when`.

### 2. Agent Fabric-lifecycle

`brain/policy/completion-readiness.mjs` onderscheidt `canComplete` van `canWait`.

- Alleen complete LIVE_VERIFIED-evidence geeft `canComplete: true`.
- Een bewezen harde grens geeft `canComplete: false`, `canWait: true`.
- Agent Fabric accepteert bij een harde grens alleen `Verifying -> WaitingApproval`.
- `Resolved` blijft alleen toegestaan bij bewezen live completion.
- `WaitingApproval -> Investigating|Executing` hervat hetzelfde work-item.
- Een actief of wachtend item blijft in de fingerprint-index en kan niet als nieuw duplicaat terugkomen.

### 3. Duurzame Outcome Obligation-integratie

De bestaande Supabase-backed work-, evidence- en recovery-stores blijven authority.

- iedere materiële task/change krijgt een completion obligation met stabiele identity;
- partial claims actualiseren dezelfde obligation;
- ontbrekende of uitgeschakelde owner is een intern recovery-probleem en geen harde externe grens;
- `BLOCKED_HARD_BOUNDARY` vereist het gestructureerde recovery packet;
- geaccepteerde production evidence moet exact aan candidate/task identity zijn gekoppeld;
- alleen dezelfde obligation kan na complete evidence naar `COMPLETED`.

### 4. Eventgedreven evaluator

De bestaande `outcome-obligation-sweep.yml` wordt uitgebreid, niet vervangen.

Triggers:

- relevante delivery workflow afgerond;
- protected merge/push op `main`;
- production promotion/readback afgerond;
- material learning/writeback event;
- boundary-clear event;
- geplande reconciliation als vangnet;
- handmatige dispatch voor één obligation.

De evaluator:

1. leest duurzame open work/recovery/evidence;
2. normaliseert de laatste claim;
3. berekent de volgende actie;
4. dispatcht idempotent naar de bestaande owner/fix-agentroute;
5. hergebruikt maximaal twee identieke retries per hypothese;
6. vereist daarna een nieuwe hypothese, bewezen fallback of rollback;
7. houdt last-known-good productie beschikbaar;
8. schrijft immutable evidence-artifacts en BG168/BG166-learning;
9. herhaalt totdat LIVE_VERIFIED of WAIT_EXTERNAL met volledig packet.

Een workflow mag zichzelf niet onbeperkt blind herstarten. Iedere iteratie moet nieuwe evidence, een gewijzigde hypothese of een boundary-statewijziging bevatten.

### 5. Delivery en readback

Completion Supervisor neemt geen merge- of deployauthority over.

- BRAIN-DELIVERY-v2 valideert lanes en exacte kandidaatidentiteit;
- BG169 blijft enige productiepromotie-authority;
- bestaande productie-readbackworkflows leveren identity-bound evidence;
- supervisor zet `PROMOTE` of `READBACK` om in een idempotente dispatch naar deze bestaande routes;
- een merge/deploy zonder functionele readback blijft actief;
- productie-regressie gebruikt bestaande rollback naar last-known-good en houdt recovery open.

### 6. Chats en agent-handoff

Iedere materiële Powerhouse-chat gebruikt dezelfde completion-obligation identity in preflight en writeback.

Een chatantwoord met een partial claim moet:

- de claim als progress event opslaan;
- dezelfde open obligation en next action behouden;
- geen successful terminal status uitzenden;
- waar de huidige chat veilig kan doorgaan: direct doorgaan;
- waar de uitvoeringscontext stopt: een volledig fix-agent-handoff in dezelfde duurzame obligation vastleggen.

Een chatproduct kan niet door repositorycode worden gedwongen om buiten een actieve beurt te blijven rekenen. Daarom is de duurzame obligation de continuity authority: iedere hervatting, nieuwe chat of runtime-agent leest en vervolgt hetzelfde work-item. Binnen ondersteunde Powerhouse runtimes zorgt de eventgedreven evaluator voor automatische hervatting.

## Backfill

De eerste productierun reconcilieert bestaande state:

- open PR’s met alleen commit/merge/preview-evidence;
- delivery- of readbackworkflows met failure/cancelled/skipped;
- obligations in PENDING, AWAITING_OUTCOME, MISSED_OBLIGATION, RECOVERING of BLOCKED_HARD_BOUNDARY;
- bekende `DEELS LIVE`, `NIET GEDAAN` en `NOT_CLAIMED` status-events;
- AgentWork dat ten onrechte Resolved is op alleen hard-boundary evidence.

Backfill is idempotent, maakt geen dubbele side effects en heropent alleen items zonder geldige LIVE_VERIFIED-evidence.

## Security en autonomie

- geen secret-, credential- of permissionwijziging;
- geen verzwakking van security-controls;
- geen destructieve/onherroepelijke data;
- geen betaalde resourceverhoging;
- geen juridisch/financieel bindende actie;
- repository- en providerwrites blijven binnen bestaande adapters en permissions;
- unknown of ontbrekende evidence is nooit groen;
- AI-claims kunnen gates of providerreadback niet overrulen;
- alle dispatches gebruiken stabiele idempotency keys en bounded retries.

## Observability

Per obligation worden minimaal gemeten:

- statusleeftijd;
- tijd sinds laatste nieuwe evidence;
- recovery-attempts per hypothese;
- claim-to-live lead time;
- aantal partial claims;
- boundary-age;
- dispatchresultaat;
- exact candidate-, production- en readback-identity;
- open-obligation count;
- completion reason.

Waarschuwing ontstaat wanneer een actief item geen nieuwe evidence binnen zijn policyvenster produceert. Een waarschuwing sluit het item niet.

## Teststrategie

### Unit

- iedere partial claim normaliseert naar actief werk;
- alleen volledige LIVE_VERIFIED-evidence geeft succes;
- hard boundary geeft canWait maar nooit canComplete;
- recovery packets missen geen verplicht veld;
- retries zijn per hypothese begrensd;
- boundary-clear hervat hetzelfde work-item;
- identity mismatch resulteert in READBACK/RECOVER, nooit succes.

### Integratie

- Agent Fabric kan hard-boundary work niet Resolved maken;
- WaitingApproval blijft gededupliceerd en hervat;
- durable obligation state bewaart recovery en exact evidence;
- workflow events produceren één idempotente dispatch;
- merge -> production -> readback -> writeback resulteert in LIVE_VERIFIED;
- failure -> nieuwe hypothese -> fix -> production proof blijft één lineage;
- backfill heropent partial items maar niet bewezen live items.

### Contract en security

- Engineering OS-validator vereist actieve supervisorconfiguratie;
- Required test voert de supervisorregressies uit;
- BRAIN delivery en branch protection blijven fail-closed;
- Supabase service-role/least-privilege regressies blijven groen;
- geen direct-main of alternatieve productieauthority;
- geen parallelle work/evidence/recovery-store.

### Productieacceptatie

Minimaal één echte open partial delivery-obligation wordt door de supervisor hervat en bereikt:

1. exact geteste head;
2. protected merge;
3. exacte productie/deployidentity;
4. functionele publieke/provider-readback;
5. complete obligation;
6. BG168/BG166 learning/writeback-readback;
7. gedeelde context toont LIVE_VERIFIED en nul open obligations voor die change.

PR #1781 is alleen een geschikte eerste praktijkcase als zijn actuele head en scopes bij uitvoering nog geldig zijn. De supervisor mag nooit een oude head promoten.

## Rollout en rollback

1. shadow-evaluatie zonder dispatch op actuele open obligations;
2. verschilrapport tegenover bestaande statusbesluiten;
3. activeer dispatch voor één canary-obligation;
4. voer backfill dry-run uit;
5. activeer bounded backfill;
6. verifieer productie en learning-readback;
7. zet de eventgedreven evaluator algemeen actief.

Rollback schakelt dispatch uit, maar verwijdert geen open obligations of evidence. Bestaande BRAIN-DELIVERY-v2, BG169, Agent Fabric en Outcome Obligation-routes blijven functioneren.

## Definition of Done

Completion Supervisor v1 is pas klaar wanneer:

- pure policy, Agent Fabric-lifecycle en duurzame obligation-integratie zijn geïmplementeerd;
- tests en Required/BRAIN/security-gates groen zijn op exact candidate head;
- protected merge en productiepromotie aantoonbaar zijn;
- actuele productie draait op exact bewezen identity;
- eventgedreven en geplande evaluatie actief zijn;
- backfill geen onterechte succesvolle partial items achterlaat;
- één echte partial case LIVE_VERIFIED bereikt;
- capability/system-map/handoff en Menselijk Handboek zijn bijgewerkt;
- incident, root cause, fix, regressie en prevention zijn teruggeschreven;
- de gedeelde preflight de nieuwe supervisorstate kan ontdekken.
