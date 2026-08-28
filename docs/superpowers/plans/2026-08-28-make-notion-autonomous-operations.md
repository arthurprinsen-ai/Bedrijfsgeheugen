# Make & Notion Autonomous Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Maak de bestaande Powerhouse-regelkring werkelijk zelfherstellend door dagelijkse verbeterdata te koppelen, alleen streng geautoriseerde Klasse-A-mutaties uit te voeren, iedere wijziging te testen en automatisch terug te rollen.

**Architecture:** BG82 blijft de goedkope eventpoort, BG159 levert eenmaal per dag compacte metrics aan BG158 en BG156 blijft de enige agent- en QA-coördinator. Alleen BG160 wordt nieuw: een in eerste instantie inactieve, whitelisted mutation executor die geen vrije AI-instructies accepteert en uitsluitend na snapshot-, concurrency-, test- en rollbackcontroles mag wijzigen. BG150 controleert de gehele control plane deterministisch en verdiept alleen gewijzigde of ongezonde onderdelen.

**Tech Stack:** Make scenario API en on-demand subscenario’s, JavaScript Code-modules, bestaande Make API-verbinding `10020785`, bestaande Notion-verbinding `8997531`, Powerhouse Datahub, Powerhouse-verificatieregister, PH Agents 09/11/14/16, GitHub-documentatie.

**Spec:** `docs/superpowers/specs/2026-08-28-make-notion-autonomous-operations-design.md`

## Global Constraints

- Geen duplicaat van BG82, BG150, BG156, BG157, BG158 of BG159 bouwen.
- Geen autonome verwijdering, archivering, publicatie, credential-, betaal-, commerciële of menselijke besliswijziging.
- Geen secrets, cookies, tokens, autorisatieheaders, ruwe blueprints of rollbackpayloads in Notion, prompts of de publieke GitHub-repository.
- Geen AI bij groene, lege, dubbele of bekende deterministische input.
- Iedere Make-edit gebruikt een vers gelezen `lastEdit` als concurrency guard en één atomische save.
- Alleen Klasse A plus Agent 11 exact `PASS_A` kan een productie-opdracht opleveren.
- Klasse B blijft canary-only; Klasse C blijft altijd `BLOCK`.
- BG160 mag BG82, BG150, BG156, BG157, BG158, BG159, zichzelf of Agents 09/11/14/16 nooit muteren.
- Iedere mutatie vereist een geldige Datahub-snapshot, een testcontract, beschermde metrics en een exact rollbackpad.
- Nieuwe scenario’s starten inactief en blijven inactief totdat alle negatieve tests en een rollbacktest groen zijn.
- Per fingerprint en configuratieversie maximaal twee pogingen; geen nieuwe poging terwijl een vorige loopt.
- Meer dan 10% regressie op een beschermde metric veroorzaakt rollback, behalve aantoonbaar noodzakelijke extra kosten voor veiligheid of data-integriteit.
- Een onbereikbaar verificatieregister of snapshotstore blokkeert nieuwe mutaties, niet bestaande productie.
- BG147 blijft buiten de kritieke keten totdat de gebruiker `Powerhouse Agent Activity Log` met de Notion-integratie **Make** deelt.

## File and Scenario Map

| Eenheid | Actie | Verantwoordelijkheid |
|---|---|---|
| `7032571` BG82 | wijzigen | werkelijke vieruursmetadata en daggebonden kostenfingerprint |
| `7132648` BG159 | wijzigen | compacte dagelijkse metrics en idempotente dispatch naar BG158 |
| `7132559` BG158 | gericht verifiëren | uitsluitend deterministische `NO_ACTION`, `PROPOSE_A`, `PROPOSE_B`, `BLOCK` |
| `7132258` BG156 | wijzigen | exact `AuthorizedMutation`-contract en dispatch naar BG160 |
| BG160 | creëren, aanvankelijk inactief | whitelisted mutatie, snapshot, test, nameting en rollback |
| `7093968` BG150 | wijzigen | dagelijkse semantische control-plane- en deltadriftaudit |
| Powerhouse Datahub | gebruiken | afgeschermd driftmanifest en volledige rollbackpayloads |
| Powerhouse-verificatieregister | gebruiken | geredigeerd incident-, QA-, test- en kostenbewijs |
| `docs/powerhouse/runbooks/autonomous-operations.md` | creëren | actuele publieke architectuur, herstelprocedure en menselijke blokkades |
| `docs/powerhouse/evidence/2026-08-28-autonomous-operations.md` | creëren | uitsluitend geredigeerde ids, tests, meetwaarden en bewijslinks |

---

### Task 1: Live baseline, Datahub-snapshotcontract en rode gates

**Files:**
- Create: `docs/powerhouse/evidence/2026-08-28-autonomous-operations.md`
- Create: `docs/powerhouse/runbooks/autonomous-operations.md`
- Read: Make-scenario’s `7032571`, `7093968`, `7132258`, `7132534`, `7132559`, `7132648`, `7088558`, `7088574`, `7088656`, `7089148`
- Read/Write: afgeschermde Powerhouse Datahub snapshotstore
- Write: Powerhouse-verificatieregister

**Interfaces:**
- Consumes: actuele scenario-blueprints, `lastEdit`, schedules, verbindingstatus, recente uitvoeringen en bestaande Datahub write/read-route.
- Produces: `ControlPlaneBaseline`, `SnapshotRecordV1`, een bewezen restoretest en de definitieve lijst control-plane-ids.

`SnapshotRecordV1`:

```json
{
  "schema_version": "1",
  "snapshot_id": "sha256:fingerprint|scenario_id|last_edit",
  "scenario_id": 0,
  "captured_at": "ISO-8601",
  "expected_last_edit": "ISO-8601",
  "encrypted_payload": "stored-only-in-private-datahub",
  "payload_sha256": "hex",
  "restore_contract": {
    "action": "SAFE_POLLING_CHANGE",
    "path": "scheduling.interval",
    "old_value": 0
  }
}
```

- [ ] **Step 1: Schrijf het rode verificatierecord**

Leg geredigeerd vast:

```json
{
  "bg82_metadata_matches_schedule": false,
  "bg159_dispatches_bg158": false,
  "bg160_exists_inactive": false,
  "datahub_snapshot_roundtrip": false,
  "forced_rollback_restores_exact_value": false,
  "bg150_audits_full_control_plane": false
}
```

- [ ] **Step 2: Lees alle tien scenario’s opnieuw**

Expected: alle getoonde verbindingen zijn `ok`, `incompleteExecutions=0` en geen control-planecomponent staat `error`. Stop de implementatie wanneer één van deze voorwaarden faalt.

- [ ] **Step 3: Leg de actuele concurrencywaarden vast**

Verifieer minimaal tegen de laatst bekende waarden:

```text
BG82   7032571  2026-08-28T08:20:56.315Z
BG150  7093968  2026-08-28T08:10:25.727Z
BG156  7132258  2026-08-28T08:19:01.928Z
BG157  7132534  2026-08-28T07:49:39.264Z
BG158  7132559  2026-08-28T07:55:48.694Z
BG159  7132648  2026-08-28T08:20:19.823Z
```

Expected: verschillen zijn geen fout maar een stopteken; lees het gewijzigde scenario opnieuw en herzie uitsluitend de betrokken taak.

- [ ] **Step 4: Test een Datahub snapshot-roundtrip zonder productie-edit**

Schrijf één fixture met `scenario_id=0`, lees hem terug, vergelijk `payload_sha256` en verwijder niets. Expected: identieke hash en een niet-lege `snapshot_id`. Wanneer geen afgeschermde write/read-route bestaat, markeer `HUMAN_REQUIRED: SECURE_SNAPSHOT_STORE` en stop vóór Task 4.

- [ ] **Step 5: Schrijf de publieke runbookbasis**

Documenteer alleen scenario-id, naam, rol, schedule en blokkades. Neem geen modulemappers, secrets, ruwe events of rollbackpayloads op.

- [ ] **Step 6: Leg de BG147-bootstrapblokkade vast**

Verifieer dat BG147 `7088792` inactief blijft. Registreer exact dat `Powerhouse Agent Activity Log` (`51ce61d8-94a8-4522-9a2f-d2134eb76c5c`) met de Notion-integratie **Make** moet worden gedeeld; activeer BG147 niet in dit plan.

- [ ] **Step 7: Commit baseline en runbook**

```bash
git add docs/powerhouse/evidence/2026-08-28-autonomous-operations.md docs/powerhouse/runbooks/autonomous-operations.md
git commit -m "docs: baseline autonomous Powerhouse operations"
```

---

### Task 2: BG82 configuratiedrift en fingerprint herstellen

**Files:**
- Modify: Make-scenario `7032571`, module `30`
- Modify: `docs/powerhouse/evidence/2026-08-28-autonomous-operations.md`

**Interfaces:**
- Consumes: verse BG82 `lastEdit`, huidige module-30 mapper en planning `interval=14400`.
- Produces: daggebonden `COST_THRESHOLD_BREACH`-event met correcte intervalmetadata.

- [ ] **Step 1: Schrijf de falende mapperchecks**

```javascript
const event = JSON.parse(renderedEventJson);
assert(event.evidence.schedule_interval_seconds === 14400);
assert(/^bg82-cost-threshold\|\d{4}-\d{2}-\d{2}$/.test(event.fingerprint));
```

Expected vóór wijziging: eerste check ziet `10800`; tweede check ziet de constante `bg82-cost-threshold`.

- [ ] **Step 2: Lees BG82 en module 30 opnieuw**

Expected: planning `14400`, module 30 wijst naar BG156 `7132258`, verbinding `10020785` is `ok`.

- [ ] **Step 3: Patch alleen module 30 atomair**

Gebruik deze eventvorm:

```json
{
  "type": "COST_THRESHOLD_BREACH",
  "source": "BG82",
  "observed_at": "{{now}}",
  "fingerprint": "bg82-cost-threshold|{{formatDate(now; \"YYYY-MM-DD\")}}",
  "severity": "high",
  "evidence": {
    "operations": "{{2.operations}}",
    "data_transfer": "{{2.dataTransfer}}",
    "rate_limit_remaining": "{{2.apiMetadata.`ratelimit-remaining`}}",
    "schedule_interval_seconds": 14400
  },
  "requested_action": "Detect root cause, propose reversible savings, require Agent11 QA; no deletion, publishing, content or credential changes."
}
```

- [ ] **Step 4: Herhaal mapperchecks en structurele validatie**

Expected: beide checks groen; BG82 blijft actief, interval blijft `14400`, alle drie verbindingen blijven `ok`, geen module-issue.

- [ ] **Step 5: Draai één no-op BG82-controle**

Expected: zonder drempelbreuk geen BG156-call, geen Agent 14-call en geen extra Notion-incident.

- [ ] **Step 6: Werk bewijs bij en commit**

```bash
git add docs/powerhouse/evidence/2026-08-28-autonomous-operations.md
git commit -m "docs: verify BG82 schedule metadata drift repair"
```

---

### Task 3: BG159 dagelijks en idempotent aan BG158 koppelen

**Files:**
- Modify: Make-scenario `7132648`, modules `6`, `7` en één nieuwe `make:runScenarioWithInputs`-module
- Verify: Make-scenario `7132559`
- Modify: `docs/powerhouse/evidence/2026-08-28-autonomous-operations.md`

**Interfaces:**
- Consumes: BG159 safe daily deltas en complete dagvensters.
- Produces: `DailyMetricsV1` voor BG158-input `metrics_json`.

`DailyMetricsV1`:

```json
{
  "metrics_version": "1",
  "source": "BG159",
  "window_date": "YYYY-MM-DD",
  "successful_workflows": 0,
  "normal_credits": 0,
  "security_incident_credits": 0,
  "empty_ai_runs": 0,
  "duplicate_runs": 0,
  "error_rate": 0,
  "incomplete_executions": 0,
  "data_transfer": 0,
  "connections": "ok",
  "protected_metrics_ok": true,
  "idempotency_key": "BG159|YYYY-MM-DD|1"
}
```

- [ ] **Step 1: Schrijf vier rode fixtures**

```text
invalid envelope       -> BG158 BLOCK
same day second time   -> no dispatch
green no-op day        -> BG158 NO_ACTION; no BG156 call
duplicate_runs=1       -> BG158 PROPOSE_A; exactly one BG156 call
```

- [ ] **Step 2: Lees BG159 modules 4–7 en BG158 modules 1–4 opnieuw**

Expected: BG159 planning dagelijks `07:10`; BG158 input heet exact `metrics_json`; BG158 module 4 wijst naar BG156 `7132258`.

- [ ] **Step 3: Breid BG159 module 6 minimaal uit**

Laat module 6 naast de bestaande snapshotvelden `DailyMetricsV1` en booleans `dispatch_metrics` en `create_record` retourneren. `dispatch_metrics=true` uitsluitend bij compleet, nog niet verwerkt dagvenster.

- [ ] **Step 4: Voeg één BG158-dispatch toe**

Configuratie:

```json
{
  "scenario": "7132559",
  "data": {"metrics_json": "{{6.result.metrics_json}}"}
}
```

Filter: `dispatch_metrics = true`. Plaats vóór de Notion-write zodat de snapshot alleen als verwerkt wordt gemarkeerd nadat een geldige BG158-beslissing terugkomt.

- [ ] **Step 5: Draai de vier fixtures**

Expected: één `BLOCK`, één gededupliceerde no-op, één groene `NO_ACTION` zonder agents en één `PROPOSE_A` met exact één BG156-dispatch.

- [ ] **Step 6: Draai dezelfde dagfixture opnieuw**

Expected: geen tweede BG158-call en geen tweede Notion-snapshot.

- [ ] **Step 7: Werk bewijs bij en commit**

```bash
git add docs/powerhouse/evidence/2026-08-28-autonomous-operations.md docs/powerhouse/runbooks/autonomous-operations.md
git commit -m "docs: verify daily BG159 to BG158 improvement flow"
```

---

### Task 4: BG160 als inactieve fail-closed mutation executor bouwen

**Files:**
- Create: Make-scenario `BG 160 - Powerhouse Safe Mutation Executor v1`
- Modify: `docs/powerhouse/runbooks/autonomous-operations.md`
- Modify: `docs/powerhouse/evidence/2026-08-28-autonomous-operations.md`

**Interfaces:**
- Consumes: verplichte input `authorized_mutation_json` volgens `AuthorizedMutationV1`.
- Produces: output `result` volgens `MutationResultV1`.

`MutationResultV1`:

```json
{
  "status": "BLOCK|NO_ACTION|APPLIED|ROLLED_BACK|HUMAN_REQUIRED",
  "fingerprint": "string",
  "target_scenario_id": 0,
  "action": "string",
  "snapshot_id": "string",
  "test_status": "NOT_RUN|PASS|FAIL|INCONCLUSIVE",
  "protected_metrics_ok": false,
  "rollback_status": "NOT_NEEDED|PASS|FAIL",
  "evidence_ref": "string"
}
```

- [ ] **Step 1: Schrijf acht rode contractfixtures**

```text
invalid JSON                    -> BLOCK
source != BG156                 -> BLOCK
repair_class != A               -> BLOCK
qa_decision != PASS_A           -> BLOCK
unknown action                  -> BLOCK
control-plane target            -> BLOCK
missing expected_last_edit      -> BLOCK
duplicate idempotency_key       -> NO_ACTION
```

- [ ] **Step 2: Maak BG160 inactief en on-demand**

Interface:

```json
{
  "input": [{"name":"authorized_mutation_json","type":"text","required":true,"multiline":true}],
  "output": [{"name":"result","type":"text","required":false}]
}
```

Flow: Start → Validate/Redact → Read idempotency state → Read target → Snapshot gate → Action router → Test gate → Rollback gate → Redacted evidence → Return.

- [ ] **Step 3: Implementeer de validator**

```javascript
const CONTROL_PLANE = new Set([
  7032571, 7093968, 7132258, 7132534, 7132559, 7132648,
  7088558, 7088574, 7088656, 7089148
]);
const ACTIONS = new Set([
  'SAFE_POLLING_CHANGE', 'RESTORE_SAFE_DEFAULT', 'ADD_MAPPING_GUARD',
  'SKIP_EMPTY_AI', 'DEDUPLICATE_EVENT'
]);
let m;
try { m = JSON.parse(String(input.authorized_mutation_json || '')); }
catch { return {blocked:true, reason:'INVALID_JSON'}; }
const required = ['schema_version','source','fingerprint','idempotency_key',
  'repair_class','qa_decision','action','target_scenario_id',
  'expected_last_edit','parameters','protected_metrics','test_contract',
  'rollback_snapshot_ref'];
const missing = required.filter(k => m[k] === undefined || m[k] === '');
let reason = '';
if (missing.length) reason = `MISSING:${missing.join(',')}`;
else if (m.schema_version !== '1') reason = 'UNSUPPORTED_SCHEMA';
else if (m.source !== 'BG156') reason = 'INVALID_SOURCE';
else if (m.repair_class !== 'A' || m.qa_decision !== 'PASS_A') reason = 'NOT_AUTHORIZED';
else if (!ACTIONS.has(m.action)) reason = 'ACTION_NOT_WHITELISTED';
else if (CONTROL_PLANE.has(Number(m.target_scenario_id))) reason = 'CONTROL_PLANE_TARGET_BLOCKED';
return {blocked:!!reason, reason, mutation:m};
```

- [ ] **Step 4: Voeg BG160 zelf aan de control-plane-set toe**

Na creatie: lees het nieuwe scenario-id en voeg dat exact toe aan `CONTROL_PLANE` vóór iedere test of activatie.

- [ ] **Step 5: Implementeer alleen read-, snapshot- en BLOCK-paden**

Lees de target en vergelijk `lastEdit`. Schrijf `SnapshotRecordV1` naar Datahub en lees de hash terug. Alle actieroutes retourneren voorlopig `BLOCK: ACTION_TEMPLATE_NOT_ENABLED`; geen Make-patchmodule is actief.

- [ ] **Step 6: Draai de acht fixtures plus snapshotfailure**

Expected: acht exacte uitkomsten; bij onbereikbare Datahub `BLOCK: SNAPSHOT_STORE_UNAVAILABLE`; nul scenariowijzigingen.

- [ ] **Step 7: Werk runbook bij en commit**

```bash
git add docs/powerhouse/runbooks/autonomous-operations.md docs/powerhouse/evidence/2026-08-28-autonomous-operations.md
git commit -m "docs: verify fail-closed BG160 mutation contract"
```

---

### Task 5: Eerste whitelistreparatie met echte rollback implementeren

**Files:**
- Modify: BG160, alleen actie `SAFE_POLLING_CHANGE`
- Modify: `docs/powerhouse/evidence/2026-08-28-autonomous-operations.md`

**Interfaces:**
- Consumes: `AuthorizedMutationV1` met `action=SAFE_POLLING_CHANGE` en parameters `old_value`, `new_value`, `target_scenario_id`.
- Produces: een atomische schedulewijziging of exact herstel naar `old_value`.

- [ ] **Step 1: Schrijf vijf rode tests**

```text
new_value <= old_value          -> BLOCK
current schedule != old_value   -> BLOCK
lastEdit mismatch               -> BLOCK
valid safe increase             -> APPLIED after PASS
forced protected-metric failure -> ROLLED_BACK with old_value restored
```

- [ ] **Step 2: Definieer de actietemplate zonder vrije API-input**

```javascript
const p = mutation.parameters || {};
const target = Number(mutation.target_scenario_id);
const oldValue = Number(p.old_value);
const newValue = Number(p.new_value);
if (!target || !oldValue || !newValue || newValue <= oldValue) {
  return {authorized:false, reason:'INVALID_POLLING_PARAMETERS'};
}
return {
  authorized:true,
  patch:{operation:'set_scheduling', scenario_id:target, interval:newValue},
  rollback:{operation:'set_scheduling', scenario_id:target, interval:oldValue}
};
```

- [ ] **Step 3: Voeg atomische targetpatch met concurrency guard toe**

Gebruik uitsluitend de vers gelezen target en `expected_last_edit`. Bij conflict: geen retry met gegokte waarden; retourneer `BLOCK: CONCURRENCY_CONFLICT`.

- [ ] **Step 4: Voeg structurele en beschermde-metriektest toe**

Na de patch moeten status, verbindingen, incomplete executions en het testcontract groen zijn. De test mag geen externe publicatie, e-mail, bericht of productiewrite veroorzaken.

- [ ] **Step 5: Voeg automatische inverse patch toe**

Bij `FAIL` of `INCONCLUSIVE`: voer exact `rollback.interval=old_value` uit, lees target opnieuw en vergelijk de herstelde waarde plus nieuwe `lastEdit`.

- [ ] **Step 6: Draai alle vijf tests op een niet-kritische fixture**

Expected: drie blocks, één `APPLIED`, één `ROLLED_BACK`; na rollback staat exact de oude intervalwaarde terug.

- [ ] **Step 7: Laat BG160 inactief**

Geen productieactivatie in deze taak. Schrijf testbewijs en rollbackhash naar het verificatieregister.

- [ ] **Step 8: Werk bewijs bij en commit**

```bash
git add docs/powerhouse/evidence/2026-08-28-autonomous-operations.md
git commit -m "docs: verify first safe mutation and rollback template"
```

---

### Task 6: BG156 exact aan BG160 koppelen

**Files:**
- Modify: Make-scenario `7132258`, decision module `19` en één nieuwe BG160-dispatch
- Modify: `docs/powerhouse/evidence/2026-08-28-autonomous-operations.md`

**Interfaces:**
- Consumes: bestaande BG156 Agent 11-uitkomst en BG160-id uit Task 4.
- Produces: `AuthorizedMutationV1` alleen bij exact `PASS_A`.

- [ ] **Step 1: Schrijf zes rode dispatchtests**

```text
upstream invalid    -> no BG160 call
Agent11 BLOCK       -> no BG160 call
CANARY_PASS_B       -> no production BG160 call
Class C             -> no BG160 call
missing snapshot    -> no BG160 call
PASS_A complete     -> exactly one BG160 call
```

- [ ] **Step 2: Voeg het BG160-id toe aan BG156-feedbackbescherming**

De bestaande lijst `[7093968,7132258,7132534,7132559,7132648]` wordt uitgebreid met het exacte BG160-id. BG82 `7032571` en de vier agentrunner-ids worden eveneens expliciet beschermd.

- [ ] **Step 3: Bouw `AuthorizedMutationV1` deterministisch**

Gebruik uitsluitend waarden uit het gevalideerde event, de vers gelezen target, de Datahub snapshotreferentie en Agent 11. Vrije tekstvelden worden niet doorgezet als parameters.

- [ ] **Step 4: Voeg één gefilterde BG160-dispatch toe**

Filter exact:

```text
decision = PASS_A
execution_authorized = true
repair_class = A
rollback_snapshot_ref exists
expected_last_edit exists
```

- [ ] **Step 5: Draai de zes tests met BG160 nog inactief of test-only**

Expected: vijf keer nul dispatch; één geldige testdispatch resulteert in BG160-testuitkomst zonder productie-effect.

- [ ] **Step 6: Werk bewijs bij en commit**

```bash
git add docs/powerhouse/evidence/2026-08-28-autonomous-operations.md docs/powerhouse/runbooks/autonomous-operations.md
git commit -m "docs: verify governed BG156 to BG160 dispatch"
```

---

### Task 7: BG150 uitbreiden tot goedkope semantische control-plane-audit

**Files:**
- Modify: Make-scenario `7093968`
- Modify: Powerhouse Datahub driftmanifest
- Modify: `docs/powerhouse/evidence/2026-08-28-autonomous-operations.md`

**Interfaces:**
- Consumes: scenario-overzicht, driftmanifest en laatste uitvoeringsstatus van BG82/BG156/BG157/BG158/BG159/BG160/Agents 09/11/14/16.
- Produces: één `DailyControlPlaneAuditV1` en alleen bij afwijking één geredigeerde Notion-update.

- [ ] **Step 1: Schrijf vijf rode audittests**

```text
all green unchanged       -> HEALTHY, zero AI, zero Notion write
connection missing        -> DEGRADED, one summary
incomplete execution      -> DEGRADED, one summary
lastEdit drift            -> CHANGED, deepen only changed scenario
invalid semantic output   -> DEGRADED, one summary
```

- [ ] **Step 2: Behoud de bestaande Agent 14-healthcheck en BG157-heartbeat**

Verwijder geen bestaande canary. Nieuwe reads worden deterministisch toegevoegd en mogen geen dagelijkse vier-agentfan-out starten.

- [ ] **Step 3: Maak het driftmanifest compact**

```json
{
  "schema_version":"1",
  "components":[{
    "scenario_id":0,
    "expected_schedule":"on-demand|daily:07:00|daily:07:10|interval:14400",
    "last_edit":"ISO-8601",
    "protected_hash":"sha256",
    "notion_data_source_ids":[]
  }]
}
```

- [ ] **Step 4: Verdiep alleen gewijzigde scenario’s**

Bij gelijk `lastEdit` geen blueprint- of Notion-schema-read. Bij wijziging: lees structurele issues, verbindingen en alleen de gebruikte Notion-data sources/properties.

- [ ] **Step 5: Classificeer semantische gezondheid**

```javascript
const healthy = c.connections_ok && c.incomplete_executions === 0 &&
  c.output_valid && !c.open_rollback && c.schedule_matches;
return {status: healthy ? 'HEALTHY' : 'DEGRADED', reasons};
```

- [ ] **Step 6: Draai de vijf tests**

Expected: groene test zonder AI/write; vier afwijkingstests met maximaal één samenvatting per dag en alleen relevante verdieping.

- [ ] **Step 7: Werk bewijs bij en commit**

```bash
git add docs/powerhouse/evidence/2026-08-28-autonomous-operations.md docs/powerhouse/runbooks/autonomous-operations.md
git commit -m "docs: verify semantic control-plane and Notion drift audit"
```

---

### Task 8: Volledige ketentest, beperkte canary en 24-uurs meetpoort

**Files:**
- Modify: BG160 status alleen na groene preflight
- Modify: Powerhouse-verificatieregister
- Modify: `docs/powerhouse/evidence/2026-08-28-autonomous-operations.md`
- Modify: `docs/powerhouse/runbooks/autonomous-operations.md`

**Interfaces:**
- Consumes: groene uitkomsten van Tasks 1–7.
- Produces: `GoLiveEvidenceV1`, actieve beperkte Klasse-A-canary of volledige rollback naar de uitgangssituatie.

- [ ] **Step 1: Controleer harde preflight**

Expected: alle control-planeverbindingen `ok`, overal `incompleteExecutions=0`, Datahub roundtrip groen, geforceerde rollback groen, BG160-targetblock groen en geen open onbewezen mutatie.

- [ ] **Step 2: Draai de negatieve securitysuite**

Fixtures: ongeldige JSON, secretpayload, replay, onbekende webhook, control-plane-target en Class C-dataverwijdering. Expected: `BLOCK` of BG157-isolatie; geen secret in output/Notion; geen ongeautoriseerde mutatie.

- [ ] **Step 3: Draai de dagelijkse no-opketen**

BG159 → BG158 met groene metrics. Expected: `NO_ACTION`, geen BG156-, BG160- of agentcall en maximaal één bestaande kostensnapshot.

- [ ] **Step 4: Draai één volledige veilige Klasse-A-fixture**

BG158 `PROPOSE_A` → BG156 Agents 09/14/16/11 → `PASS_A` → BG160. Gebruik uitsluitend een niet-kritisch testscenario. Expected: één atomische veilige wijziging plus groene test en nameting.

- [ ] **Step 5: Draai dezelfde fixture opnieuw**

Expected: `NO_ACTION`, geen tweede mutatie en geen tweede incident.

- [ ] **Step 6: Draai een geforceerde regressie**

Expected: BG160 retourneert `ROLLED_BACK`; de oude waarde, status en verbindinggezondheid zijn exact hersteld.

- [ ] **Step 7: Activeer BG160 alleen voor `SAFE_POLLING_CHANGE`**

Andere templates blijven technisch geblokkeerd met `ACTION_TEMPLATE_NOT_ENABLED` totdat zij afzonderlijk dezelfde testcyclus doorlopen.

- [ ] **Step 8: Meet één volledig dagvenster**

Vergelijk credits per succesvolle workflow, totale control-planecredits, foutpercentage, incomplete executions, data-overdracht, hersteltijd, agentcalls, rollbacks en security-incidentkosten met Task 1.

- [ ] **Step 9: Behoud of rol volledig terug**

Behoud alleen wanneer veiligheid, data-integriteit, beschikbaarheid en functionele correctheid niet verslechteren en genormaliseerde kosten dalen of gelijk blijven. Meer dan 10% regressie op een beschermde metric veroorzaakt rollback, behalve wanneer de extra kosten aantoonbaar noodzakelijk zijn voor veiligheid of data-integriteit. Anders BG160 deactiveren en alle gewijzigde scenario’s via de bewaarde snapshots herstellen.

- [ ] **Step 10: Sluit het verificatierecord en commit**

```bash
git add docs/powerhouse/evidence/2026-08-28-autonomous-operations.md docs/powerhouse/runbooks/autonomous-operations.md
git commit -m "docs: verify autonomous operations canary and measurement"
```

## Definition of Done

- BG82 rapporteert `14400` en gebruikt een daggebonden kostenfingerprint.
- BG159 voedt BG158 exact eenmaal per volledig dagvenster.
- Groene/no-opinput start geen agents en geen mutation executor.
- BG156 kan alleen een volledig `AuthorizedMutationV1` met `PASS_A` doorzetten.
- BG160 voert uitsluitend `SAFE_POLLING_CHANGE` uit; overige templates zijn geblokkeerd.
- Control-plane- en agentrunner-ids zijn technisch uitgesloten als target.
- Snapshot-roundtrip en geforceerde rollback zijn aantoonbaar groen.
- BG150 controleert de volledige control plane zonder AI bij groen.
- Alleen gewijzigde scenario’s veroorzaken Notion-schemaverdieping.
- Het verificatieregister bevat oorzaak, QA, test, voor/na, rollback en eindstatus zonder secrets.
- De publieke repository bevat actuele architectuur en geredigeerd bewijs, nooit ruwe rollbackdata.
- Een 24-uurs meetvenster bewijst geen regressie op beschermde metrics.
