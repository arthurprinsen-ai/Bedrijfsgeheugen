# AI Koppelingen Wizard Slice 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lever een production-ready eerste slice waarmee een niet-technische gebruiker in gewone taal of via een template een Outlook/PDF → extractie → Datahub-koppeling kan configureren, veilig testen, activeren en live begrijpen.

**Architecture:** De bestaande connector-engine blijft de enige uitvoeringslaag. De portalwizard maakt alleen connector definitions en gebruikt `/api/connectors/*` voor safe-test/execution/readiness; de bestaande `/api/koppelingen` blijft tenant-scoped portalprojectie en health tonen. Documentextractie wordt server-side toegevoegd met fail-closed gedrag. AI vertaalt intentie naar een voorstel, maar kan nooit credentials of readiness verzinnen.

**Tech Stack:** Vanilla JavaScript portal UI, Node.js ESM, Netlify Functions, bestaande connector runtime, bestaande portal state/store, Node `node:test` regressietests, Netlify production deploy/readback.

**Spec:** `docs/superpowers/specs/2026-09-08-ai-koppelingen-wizard-design.md`

## Global Constraints

- Geen technische termen in de standaardroute als die niet nodig zijn.
- Mobiel: geen essentiële informatie alleen via hover; primaire acties moeten via tap werken.
- Geen secret in browser, localStorage, portalprojectie, readiness of logs.
- Geen providerstatus `ready` of `healthy` zonder execution evidence.
- Ontbrekende providerconfiguratie blijft fail-closed.
- Eén echte veilige test is verplicht voordat activeren mogelijk is.
- AFAS en Exact blijven `not-configured` zolang echte externe configuratie ontbreekt.
- Powerhouse-loop: intentie → voorstel → configuratie → safe-test → readiness → activatie → execution → evidence → health → herstel → learning/regression.
- Exacte head-SHA moet groen zijn voordat merge wordt toegestaan; productie moet exact de merge-SHA draaien.

---

### Task 1: Server-side document extractor contract

**Files:**
- Modify: `platform/connectors/connector-runtime.mjs`
- Create: `platform/connectors/document-extractor.mjs`
- Test: `tests/connector-runtime.test.mjs`
- Test: `tests/document-extractor.test.mjs`

**Interfaces:**
- Consumes: existing connector runtime `extractor` stage.
- Produces: `createDocumentExtractor({provider, confidenceThreshold})` and runtime extraction result `{documentType, fields, confidence, reviewRequired}`.

- [ ] **Step 1: Write failing extractor contract tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {createDocumentExtractor} from '../platform/connectors/document-extractor.mjs';

test('extractor stays fail-closed without provider', async () => {
  const extractor=createDocumentExtractor({provider:null});
  await assert.rejects(
    ()=>extractor.extract({content:'pdf-bytes'}),
    e=>e?.code==='DOCUMENT_EXTRACTION_PROVIDER_NOT_CONFIGURED'
  );
});

test('extractor preserves deterministic extractedFields safe-test', async () => {
  const extractor=createDocumentExtractor({provider:null});
  const result=await extractor.extract({extractedFields:{invoiceNumber:'F-1',amount:125}});
  assert.equal(result.fields.invoiceNumber,'F-1');
  assert.equal(result.reviewRequired,false);
});

test('low-confidence provider result requires review', async () => {
  const provider={extract:async()=>({documentType:'invoice',confidence:.62,fields:{amount:{value:125,confidence:.58}}})};
  const extractor=createDocumentExtractor({provider,confidenceThreshold:.8});
  const result=await extractor.extract({content:'pdf-bytes'});
  assert.equal(result.reviewRequired,true);
});
```

- [ ] **Step 2: Run the focused tests and confirm red**

Run:
```bash
node --test tests/document-extractor.test.mjs tests/connector-runtime.test.mjs
```
Expected: FAIL because `document-extractor.mjs`/new runtime integration does not exist.

- [ ] **Step 3: Implement minimal extractor adapter**

```js
export function createDocumentExtractor({provider,confidenceThreshold=.8}={}){
  return {
    async extract(input={}){
      if(input.extractedFields&&typeof input.extractedFields==='object'){
        return {documentType:input.documentType||'sample',fields:input.extractedFields,confidence:1,reviewRequired:false,mode:'safe-test-sample'};
      }
      if(!provider?.extract){
        const e=new Error('Document extraction provider not configured');
        e.code='DOCUMENT_EXTRACTION_PROVIDER_NOT_CONFIGURED';
        throw e;
      }
      const result=await provider.extract(input);
      const fieldConfidences=Object.values(result?.fields||{}).map(v=>typeof v==='object'&&Number.isFinite(v.confidence)?v.confidence:result?.confidence??0);
      const minConfidence=fieldConfidences.length?Math.min(...fieldConfidences):(result?.confidence??0);
      return {...result,reviewRequired:minConfidence<confidenceThreshold,mode:'provider'};
    }
  };
}
```

Wire `connector-runtime.mjs` so explicit `extractedFields` still pass without provider, real document extraction delegates server-side, and readiness changes from `sample-only` to `configured/native-provider` only when provider config exists.

- [ ] **Step 4: Run focused tests green**

```bash
node --test tests/document-extractor.test.mjs tests/connector-runtime.test.mjs
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add platform/connectors/document-extractor.mjs platform/connectors/connector-runtime.mjs tests/document-extractor.test.mjs tests/connector-runtime.test.mjs
git commit -m "feat: add fail-closed server document extractor"
```

---

### Task 2: Template catalog as data, not hardcoded UI

**Files:**
- Create: `assets/js/koppelingen/templates.js`
- Test: `tests/koppelingen-templates.test.mjs`

**Interfaces:**
- Produces: `KOPPELING_TEMPLATES` array and `findTemplate(id)`.
- Each template must expose `id,title,result,source,filters,documentType,fields,targets,defaultSchedule,connections,testStrategy,fallback,questions`.

- [ ] **Step 1: Write failing catalog tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {KOPPELING_TEMPLATES,findTemplate} from '../assets/js/koppelingen/templates.js';

test('catalog ships at least 15 task-oriented templates',()=>{
  assert.ok(KOPPELING_TEMPLATES.length>=15);
});

test('Outlook PDF invoice template has safe defaults',()=>{
  const t=findTemplate('outlook-pdf-facturen');
  assert.equal(t.source.type,'email');
  assert.equal(t.documentType,'invoice');
  assert.equal(t.defaultSchedule,'dag');
  assert.ok(t.targets.includes('datahub'));
  assert.ok(t.fields.includes('factuurnummer'));
});
```

- [ ] **Step 2: Run red**

```bash
node --test tests/koppelingen-templates.test.mjs
```

- [ ] **Step 3: Implement catalog**

Create at least these IDs: `outlook-pdf-facturen`, `outlook-bijlagen-sharepoint`, `outlook-aanvragen-datahub`, `sharepoint-documenten-database`, `sharepoint-csv-datahub`, `onedrive-sharepoint`, `afas-datahub`, `exact-datahub`, `afas-exact`, `sql-datahub`, `api-database`, `database-api`, `webformulier-datahub`, `csv-database`, `pdf-extractie-datahub`, `sharepointlijst-database`, `database-sharepointlijst`, `email-review-queue`.

- [ ] **Step 4: Run green**

```bash
node --test tests/koppelingen-templates.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add assets/js/koppelingen/templates.js tests/koppelingen-templates.test.mjs
git commit -m "feat: add task-oriented connector templates"
```

---

### Task 3: Wizard state machine with extreme-simple defaults

**Files:**
- Create: `assets/js/koppelingen/wizard.js`
- Test: `tests/koppelingen-wizard.test.mjs`

**Interfaces:**
- Consumes: template objects from Task 2.
- Produces: `createWizardState(template?)`, `applyAnswer(state,key,value)`, `nextQuestion(state)`, `toConnectorDefinition(state)`.

- [ ] **Step 1: Write failing state tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {createWizardState,nextQuestion,toConnectorDefinition} from '../assets/js/koppelingen/wizard.js';

const invoice={id:'outlook-pdf-facturen',source:{type:'email'},documentType:'invoice',fields:['factuurnummer','bedrag'],targets:['datahub'],defaultSchedule:'dag',questions:[]};

test('wizard asks only for missing human decisions',()=>{
  const state=createWizardState(invoice);
  assert.equal(nextQuestion(state).key,'connection');
});

test('connector definition stays technical but is generated from simple state',()=>{
  const state=createWizardState(invoice);
  state.answers.connection='m365-1';
  state.answers.target='datahub';
  const d=toConnectorDefinition(state);
  assert.equal(d.source.type,'email');
  assert.equal(d.schedule,'dag');
});
```

- [ ] **Step 2: Run red**

```bash
node --test tests/koppelingen-wizard.test.mjs
```

- [ ] **Step 3: Implement state machine**

Use six semantic phases only: `source`, `selection`, `information`, `target`, `schedule`, `test`. Keep technical config fields internal. `nextQuestion` skips already-satisfied phases from template/context.

- [ ] **Step 4: Run green**

```bash
node --test tests/koppelingen-wizard.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add assets/js/koppelingen/wizard.js tests/koppelingen-wizard.test.mjs
git commit -m "feat: add simple connector wizard state machine"
```

---

### Task 4: AI guide contract that can never invent readiness or secrets

**Files:**
- Create: `assets/js/koppelingen/ai-guide.js`
- Create: `platform/api/connector-ai-guide-handler.mjs`
- Create: `netlify/functions/connector-ai-guide.mjs`
- Test: `tests/connector-ai-guide.test.mjs`

**Interfaces:**
- Browser sends `{intent,currentState}` only.
- Server returns `{summary,suggestions,missingQuestions,proposedDefinition}` with no credentials/readiness claims.

- [ ] **Step 1: Write failing safety tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitizeAiGuideResult} from '../platform/api/connector-ai-guide-handler.mjs';

test('AI guide strips secret-like fields and provider health claims',()=>{
  const clean=sanitizeAiGuideResult({token:'abc',ready:true,healthy:true,summary:'ok',proposedDefinition:{source:{type:'email'}}});
  assert.equal('token' in clean,false);
  assert.equal('ready' in clean,false);
  assert.equal('healthy' in clean,false);
  assert.equal(clean.summary,'ok');
});
```

- [ ] **Step 2: Run red**

```bash
node --test tests/connector-ai-guide.test.mjs
```

- [ ] **Step 3: Implement server boundary and browser client**

The server prompt instructs AI to translate ordinary language into connector intent; output must be schema-clamped. Reject/strip keys matching `secret|token|password|api[_-]?key|ready|healthy|execution` recursively. The endpoint may propose configuration only; actual readiness always comes from connector runtime.

- [ ] **Step 4: Run green**

```bash
node --test tests/connector-ai-guide.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add assets/js/koppelingen/ai-guide.js platform/api/connector-ai-guide-handler.mjs netlify/functions/connector-ai-guide.mjs tests/connector-ai-guide.test.mjs
git commit -m "feat: add safe AI guidance for connector setup"
```

---

### Task 5: Portal API client and evidence status model

**Files:**
- Create: `assets/js/koppelingen/api.js`
- Create: `assets/js/koppelingen/status.js`
- Test: `tests/koppelingen-status.test.mjs`

**Interfaces:**
- `getReadiness()` → capability-only readiness.
- `safeTest(definition)` → real test result/evidence.
- `activate(definition)` → permitted only after safe-test evidence.
- `toHumanStatus(runtime)` → `{label,tone,canActivate,reason}`.

- [ ] **Step 1: Write failing status tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {toHumanStatus} from '../assets/js/koppelingen/status.js';

test('not configured is never shown active',()=>{
  const s=toHumanStatus({state:'not-configured'});
  assert.equal(s.label,'Verbinding ontbreekt');
  assert.equal(s.canActivate,false);
});

test('activation requires successful safe-test evidence',()=>{
  const s=toHumanStatus({state:'ready',lastSafeTest:{ok:true,executionId:'ex-1'}});
  assert.equal(s.label,'Test geslaagd');
  assert.equal(s.canActivate,true);
});
```

- [ ] **Step 2: Run red**

```bash
node --test tests/koppelingen-status.test.mjs
```

- [ ] **Step 3: Implement API/status modules**

Human labels: `Nog instellen`, `Klaar om te testen`, `Test geslaagd`, `Actief en gezond`, `Actie nodig`, `Verbinding ontbreekt`. `canActivate` must require a successful safe-test plus execution/evidence identifier.

- [ ] **Step 4: Run green**

```bash
node --test tests/koppelingen-status.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add assets/js/koppelingen/api.js assets/js/koppelingen/status.js tests/koppelingen-status.test.mjs
git commit -m "feat: add evidence-driven connector status"
```

---

### Task 6: Render the simple wizard inside the existing portal pane

**Files:**
- Modify: `assets/js/portaal-koppelingen.js`
- Create: `assets/js/koppelingen/view.js`
- Modify portal HTML/script loading file that currently loads `portaal-koppelingen.js` after locating the exact path on branch.
- Test: `tests/portaal-koppelingen-ui.test.mjs`

**Interfaces:**
- Uses Tasks 2–5.
- Keeps existing `window.bgKoppelingen.lijst`, `.meld`, `.verversen` backward compatible.

- [ ] **Step 1: Write failing DOM/string contract tests**

Test rendered markup for: one primary question, visible helper text, `?` help button, template chooser, AI input `Wat wil je automatisch laten gebeuren?`, six-step progress, no disabled activation without reason, and no reliance on `:hover` for essential explanations.

- [ ] **Step 2: Run red**

```bash
node --test tests/portaal-koppelingen-ui.test.mjs
```

- [ ] **Step 3: Implement additive portal view**

The first screen must present exactly three routes in this order:
1. `Vertel wat je wilt koppelen`
2. `Kies een voorbeeld`
3. `Bouw zelf`

Primary CTA is `Maak mijn koppeling`. Advanced technical settings remain collapsed. Keep existing health list below the builder rather than replacing it.

- [ ] **Step 4: Run green**

```bash
node --test tests/portaal-koppelingen-ui.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add assets/js/portaal-koppelingen.js assets/js/koppelingen/view.js tests/portaal-koppelingen-ui.test.mjs <exact-portal-html-file>
git commit -m "feat: add AI connector wizard to portal"
```

---

### Task 7: End-to-end reference safe-test: email/PDF → extraction → Datahub

**Files:**
- Modify: `platform/connectors/connector-runtime.mjs`
- Modify existing connector API handler/function used by `/api/connectors/*` after fetching exact paths.
- Test: `tests/connector-reference-flow.test.mjs`

**Interfaces:**
- Input: sample email/message metadata plus PDF content or deterministic `extractedFields`.
- Output: ordered evidence stages `source`, `extractor`, `validation`, `target`, each with `ok`, timestamp and non-secret evidence id.

- [ ] **Step 1: Write failing end-to-end test**

```js
assert.deepEqual(result.stages.map(s=>s.name),['source','extractor','validation','target']);
assert.ok(result.stages.every(s=>s.ok));
assert.ok(result.executionId);
assert.equal(JSON.stringify(result).match(/secret|token|password|api_key/i),null);
```

- [ ] **Step 2: Run red**

```bash
node --test tests/connector-reference-flow.test.mjs
```

- [ ] **Step 3: Implement minimal ordered evidence pipeline**

Use native email safe-test, Task 1 extractor, existing validation and Datahub native safe-test. Do not fake Outlook OAuth; this slice proves the connector chain using the already-supported email sample contract until a real customer M365 connection exists.

- [ ] **Step 4: Run green**

```bash
node --test tests/connector-reference-flow.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add platform/connectors/connector-runtime.mjs <exact-connector-api-files> tests/connector-reference-flow.test.mjs
git commit -m "feat: prove email document Datahub connector flow"
```

---

### Task 8: Powerhouse closed-loop evidence and recovery obligation

**Files:**
- Modify existing connector execution/review service after locating exact path.
- Test: `tests/connector-recovery-loop.test.mjs`

**Interfaces:**
- Every failed execution produces `{classification,recoveryRequired:true,failedStage,evidenceId}`.
- Recovery success produces a new execution evidence id; it must not overwrite failure evidence.

- [ ] **Step 1: Write failing recovery-loop tests**

Assert that a target failure creates a recovery obligation; a retry without changed evidence cannot mark `healthy`; a later successful execution can restore `healthy` while preserving the prior failure record.

- [ ] **Step 2: Run red**

```bash
node --test tests/connector-recovery-loop.test.mjs
```

- [ ] **Step 3: Implement minimal recovery contract**

Statuses derive only from immutable execution records. Add regression/learning payload with fingerprint derived from connector id + failed stage + normalized error class. Do not call BG168 repeatedly when Make is paused; queue one deduped writeback obligation.

- [ ] **Step 4: Run green**

```bash
node --test tests/connector-recovery-loop.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add <exact-execution-review-files> tests/connector-recovery-loop.test.mjs
git commit -m "feat: close connector recovery and learning loop"
```

---

### Task 9: Mobile, accessibility and regression contract

**Files:**
- Modify: `assets/js/koppelingen/view.js`
- Modify relevant portal stylesheet after locating exact path.
- Test: `tests/portaal-koppelingen-mobile.test.mjs`

**Interfaces:**
- 320px layout without page-level horizontal overflow.
- All primary actions >=44px touch target.
- Essential helper copy is always available via tap or inline text.

- [ ] **Step 1: Write failing regression tests**

Check markup/CSS contract for semantic buttons/labels, helper text IDs with `aria-describedby`, no critical `.help:hover`-only selector, and mobile reflow rules.

- [ ] **Step 2: Run red**

```bash
node --test tests/portaal-koppelingen-mobile.test.mjs
```

- [ ] **Step 3: Implement responsive/accessibility fixes**

Ensure AI text input is >=16px font on mobile, controls wrap, stepper becomes compact vertical/scroll-safe representation, and help drawers open/close via buttons.

- [ ] **Step 4: Run green**

```bash
node --test tests/portaal-koppelingen-mobile.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add assets/js/koppelingen/view.js <exact-portal-css-file> tests/portaal-koppelingen-mobile.test.mjs
git commit -m "test: harden connector wizard mobile UX"
```

---

### Task 10: Full verification, PR gate, merge and production readback

**Files:**
- No product code unless verification finds a defect.

**Interfaces:**
- Exact branch head → Required test green → merge SHA → Netlify production SHA parity → live route/readiness evidence.

- [ ] **Step 1: Run all connector-focused tests**

```bash
node --test tests/document-extractor.test.mjs tests/connector-runtime.test.mjs tests/koppelingen-templates.test.mjs tests/koppelingen-wizard.test.mjs tests/connector-ai-guide.test.mjs tests/koppelingen-status.test.mjs tests/portaal-koppelingen-ui.test.mjs tests/connector-reference-flow.test.mjs tests/connector-recovery-loop.test.mjs tests/portaal-koppelingen-mobile.test.mjs
```
Expected: all PASS.

- [ ] **Step 2: Run repository Required test command/workflow used by main**

Verify the exact branch head SHA, not an earlier commit.

- [ ] **Step 3: Review secret exposure contract**

Verify serialized readiness, portal projection and AI-guide output do not contain names or values matching `SECRET|TOKEN|PASSWORD|API_KEY`.

- [ ] **Step 4: Move PR #1140 out of draft only when exact head is green**

Do not merge on partial status.

- [ ] **Step 5: Merge and verify production parity**

Read Netlify production deploy and require `commit_ref === merge_sha` with state `ready`.

- [ ] **Step 6: Production readback**

Verify:
- `/api/connectors/readiness` returns 200 capability state only;
- extractor state reflects actual provider config, otherwise stays fail-closed;
- AFAS/Exact remain `not-configured` without real env/provider setup;
- Koppelingen pane loads wizard + existing health list;
- reference safe-test returns execution evidence;
- no secret is exposed.

- [ ] **Step 7: Record learning/prevention**

Write the verified outcome to Notion/Powerhouse operational documentation and create exactly one deduped BG168→BG166 writeback obligation if canonical Brain writeback remains blocked by Make capacity.
