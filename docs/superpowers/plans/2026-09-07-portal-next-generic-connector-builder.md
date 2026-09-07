# Portal Next Generic Connector Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tenant-safe native Portal Next connector builder that can ingest email/PDF or other sources, extract tenant-defined data, validate/enrich it against configurable databases, map it to tenant-selected targets, test it safely, activate only with evidence, and monitor real executions.

**Architecture:** Extend the existing Portal Next `koppelingen` page with a separate runtime connector domain rather than overloading offer-derived `project.integrations`. Use focused client modules for templates, draft state and rendering, plus server-side Netlify/API/store modules for tenant-scoped configuration, testing, activation, executions and review. The first executable contract is Email/PDF -> AFAS Document Intake; purchase-invoice, ISO and blank templates share the same generic schema/mapping model and unsupported adapters stay explicitly unconfigured.

**Tech Stack:** Vanilla ES modules in `portal-next`, Node.js ESM Netlify Functions/API handlers, existing Supabase/Postgres server access patterns, Node test runner (`node --test`), Playwright/live-preview regression gates, GitHub Actions, Netlify.

**Spec:** `docs/superpowers/specs/2026-09-07-portal-next-generic-connector-builder-design.md`

## Global Constraints

- Browser query parameters never authorize tenant access.
- Connector configs and execution records are tenant-scoped server-side.
- Secrets/tokens/auth headers never appear in client-visible payloads or logs.
- Offer/project `integrations` remain read-only planning truth; runtime connectors are a separate domain.
- `Configured` is never rendered as `Active`.
- `Active` requires activation evidence containing config version, test execution ID, source/read success, extraction result, validation result, safe target test result, activation timestamp and actor/agent.
- Deterministic tenant routing rules take precedence over AI classification.
- Ambiguous lookup, unsafe validation and insufficient confidence fail closed into review.
- Retry is idempotent/dedupe-aware and bounded; unsafe error classes create recovery obligations rather than infinite retry loops.
- Desktop and mobile must support the complete builder flow without hover-only controls.
- Unsupported external adapters must display `Niet geconfigureerd` rather than simulated success.
- TDD is required for every implementation task.

---

## File Structure

### New client modules
- `portal-next/connector-templates.js` — generic built-in templates and adapter capability metadata.
- `portal-next/connector-model.js` — normalized connector draft/version model, validation and state transitions shared by UI/tests.
- `portal-next/connector-builder-store.js` — browser draft state, template loading, API calls and fail-closed error normalization.
- `portal-next/connector-builder-view.js` — native wizard/review/test/evidence HTML rendering only.
- `portal-next/connector-builder.css` — builder/mobile styling scoped to connector UI.

### New server modules
- `platform/api/portal-connectors-handler.mjs` — authenticated connector API dispatcher and policy checks.
- `netlify/functions/portal-connectors.mjs` — Netlify entry point mapping HTTP requests into the platform handler.
- `netlify/functions/_portal-connectors-store.mjs` — tenant-scoped persistence contract for definitions, versions, executions, reviews and evidence; no client secrets returned.
- `platform/connectors/connector-engine.mjs` — deterministic pipeline orchestration for safe test execution and activation evidence.
- `platform/connectors/connector-adapters.mjs` — source/lookup/target adapter registry with explicit configured/not-configured capability states.
- `platform/connectors/document-extraction.mjs` — document schema classification/extraction contract; first release can use deterministic fixtures/server provider hook rather than fake AI success.

### Existing files modified
- `portal-next/portal-project-views.js` — preserve planned integrations and render runtime connector builder entry on `koppelingen`.
- `portal-next/portal-navigation-complete.js` — initialize connector store and route builder actions/deep links.
- `portal-next/index.html` — load connector modules/CSS if not already bundled through existing imports.
- `.github/workflows/portal-native-regression.yml` or existing portal regression workflow — include connector regression suite.
- Existing Required-test contract list only if repository conventions require explicit test-file inclusion.

### New tests
- `tests/connector-templates.test.mjs`
- `tests/connector-model.test.mjs`
- `tests/portal-connectors-handler.test.mjs`
- `tests/connector-engine.test.mjs`
- `tests/connector-builder-store.test.mjs`
- `tests/connector-builder-view.test.mjs`
- `tests/portal-connector-builder-integration.test.mjs`
- `tests/portal-connector-builder-live.spec.mjs` or extend current Playwright portal live-preview spec.

---

### Task 1: Define generic connector templates and schema model

**Files:**
- Create: `portal-next/connector-templates.js`
- Create: `portal-next/connector-model.js`
- Test: `tests/connector-templates.test.mjs`
- Test: `tests/connector-model.test.mjs`

**Interfaces:**
- Produces: `CONNECTOR_TEMPLATES`, `SOURCE_ADAPTERS`, `LOOKUP_ADAPTERS`, `TARGET_ADAPTERS`.
- Produces: `createConnectorDraft(templateId)`, `normalizeConnectorDraft(input)`, `validateConnectorDraft(draft)`, `activationEligibility(draft, evidence)`.
- Draft shape includes `id`, `version`, `name`, `templateId`, `state`, `source`, `documentSchema`, `lookups`, `mappings`, `target`, `reviewPolicy`, `dedupe`, `runtime`.

- [ ] **Step 1: Write failing template tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { CONNECTOR_TEMPLATES } from '../portal-next/connector-templates.js';

test('ships email PDF to AFAS, purchase invoice, ISO and blank templates',()=>{
  const ids=CONNECTOR_TEMPLATES.map(t=>t.id);
  assert.deepEqual(ids.includes('email-pdf-afas'),true);
  assert.deepEqual(ids.includes('purchase-invoice'),true);
  assert.deepEqual(ids.includes('iso-document'),true);
  assert.deepEqual(ids.includes('blank'),true);
});

test('email PDF to AFAS preserves earlier AFAS Document Intake metadata',()=>{
  const t=CONNECTOR_TEMPLATES.find(t=>t.id==='email-pdf-afas');
  assert.equal(t.legacy.solutionPattern,'AFAS Document Intake');
  assert.equal(t.legacy.flowPattern,'PA - Intake - Loonbeslag Email to AFAS');
  assert.equal(t.legacy.reviewPattern,'AFAS Document Intake Review');
  assert.equal(t.source.type,'email');
  assert.equal(t.source.acceptedMimeTypes.includes('application/pdf'),true);
  assert.equal(t.target.type,'afas');
});
```

- [ ] **Step 2: Run template tests and verify RED**

Run: `node --test tests/connector-templates.test.mjs`
Expected: FAIL because `connector-templates.js` does not exist.

- [ ] **Step 3: Implement minimal template registry**

Implement adapters as metadata objects with `id`, `label`, `supportsConfig`, `runtimeCapability` and no secret values. Build document field presets for purchase invoices and ISO documents and an empty customizable schema for `blank`.

- [ ] **Step 4: Run template tests and verify GREEN**

Run: `node --test tests/connector-templates.test.mjs`
Expected: PASS.

- [ ] **Step 5: Write failing model tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createConnectorDraft, validateConnectorDraft, activationEligibility } from '../portal-next/connector-model.js';

test('blank template supports arbitrary tenant-defined extraction fields',()=>{
  const draft=createConnectorDraft('blank');
  draft.documentSchema.fields.push({key:'certificate_owner',label:'Eigenaar',type:'string',required:true,confidenceThreshold:0.9});
  assert.equal(validateConnectorDraft(draft).errors.length,0);
});

test('activation fails closed without passing runtime evidence',()=>{
  const draft=createConnectorDraft('email-pdf-afas');
  assert.deepEqual(activationEligibility(draft,null),{eligible:false,reason:'TEST_EVIDENCE_REQUIRED'});
});

test('source and target are independent choices',()=>{
  const draft=createConnectorDraft('purchase-invoice');
  draft.source.type='upload';
  draft.target.type='exact';
  assert.equal(validateConnectorDraft(draft).errors.length,0);
});
```

- [ ] **Step 6: Run model tests and verify RED**

Run: `node --test tests/connector-model.test.mjs`
Expected: FAIL because model functions do not exist.

- [ ] **Step 7: Implement connector draft normalization/validation**

Validation must reject duplicate field keys, missing required mapping targets, unsupported arbitrary transformation code, and secret-looking keys such as `token`, `password`, `authorization` in client draft configuration.

- [ ] **Step 8: Run model tests and full pair**

Run: `node --test tests/connector-templates.test.mjs tests/connector-model.test.mjs`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add portal-next/connector-templates.js portal-next/connector-model.js tests/connector-templates.test.mjs tests/connector-model.test.mjs
git commit -m "feat: define generic connector templates and model"
```

---

### Task 2: Build tenant-scoped connector persistence API

**Files:**
- Create: `netlify/functions/_portal-connectors-store.mjs`
- Create: `platform/api/portal-connectors-handler.mjs`
- Create: `netlify/functions/portal-connectors.mjs`
- Test: `tests/portal-connectors-handler.test.mjs`

**Interfaces:**
- Consumes existing authenticated tenant context conventions from `platform/api/portal-project-handler.mjs` and `netlify/functions/_portal-project-store.mjs`.
- Produces `handlePortalConnectorsRequest({method,path,body,user,store})`.
- Store methods: `listConnectors(tenantId)`, `getConnector(tenantId,id)`, `saveDraft(tenantId,draft,actor)`, `saveExecution(tenantId,execution)`, `listExecutions(tenantId,id)`, `saveReview(tenantId,review)`, `listReviewQueue(tenantId)`.

- [ ] **Step 1: Write failing API security tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { handlePortalConnectorsRequest } from '../platform/api/portal-connectors-handler.mjs';

test('rejects unauthenticated request',async()=>{
  const res=await handlePortalConnectorsRequest({method:'GET',path:'/api/connectors',user:null,store:{}});
  assert.equal(res.statusCode,401);
});

test('never trusts a browser tenant query parameter',async()=>{
  let requestedTenant=null;
  const store={listConnectors:async tenantId=>{requestedTenant=tenantId;return[];}};
  await handlePortalConnectorsRequest({method:'GET',path:'/api/connectors?tenantId=evil',user:{tenantId:'tenant-a'},store});
  assert.equal(requestedTenant,'tenant-a');
});
```

- [ ] **Step 2: Run API tests and verify RED**

Run: `node --test tests/portal-connectors-handler.test.mjs`
Expected: FAIL because handler does not exist.

- [ ] **Step 3: Implement authenticated REST dispatcher**

Implement routes for list/create/get/save draft/test/activate/pause/executions/review queue/review decision. At this task stage, test/activate can return `501 NOT_IMPLEMENTED` through injected engine hooks; CRUD and security must work.

- [ ] **Step 4: Add secret redaction contract test**

```js
test('client payload excludes connector secrets',async()=>{
  const store={listConnectors:async()=>[{id:'c1',name:'Mail AFAS',secretRef:'vault://x',source:{mailbox:'invoices@example.nl'}}]};
  const res=await handlePortalConnectorsRequest({method:'GET',path:'/api/connectors',user:{tenantId:'t1'},store});
  assert.equal(JSON.stringify(res.body).includes('vault://x'),false);
  assert.equal(JSON.stringify(res.body).includes('secretRef'),false);
});
```

- [ ] **Step 5: Implement recursive redaction and tenant-scoped store adapter**

Use existing Supabase env/server helper patterns; if connector tables do not yet exist, the store may expose deterministic `NOT_CONFIGURED` persistence errors rather than silently use browser storage. Do not create fake persisted data.

- [ ] **Step 6: Run API tests**

Run: `node --test tests/portal-connectors-handler.test.mjs`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add netlify/functions/_portal-connectors-store.mjs netlify/functions/portal-connectors.mjs platform/api/portal-connectors-handler.mjs tests/portal-connectors-handler.test.mjs
git commit -m "feat: add tenant-safe connector API"
```

---

### Task 3: Implement extraction, lookup, mapping and safe-test engine

**Files:**
- Create: `platform/connectors/document-extraction.mjs`
- Create: `platform/connectors/connector-adapters.mjs`
- Create: `platform/connectors/connector-engine.mjs`
- Test: `tests/connector-engine.test.mjs`

**Interfaces:**
- Produces `runConnectorTest({tenantId,draft,input,adapterRegistry,extractor}) -> execution`.
- Produces `evaluateActivation({draft,testExecution,actor}) -> activationEvidence`.
- Adapter interface: `read(config,input)`, `lookup(config,query)`, `safeTest(config,payload)`, optional `write(config,payload)` only outside safe test after policy approval.
- Extraction result: `{detectedType,classificationConfidence,schemaVersion,fields:[{key,value,confidence,evidenceRef}]}`.

- [ ] **Step 1: Write failing end-to-end engine test for email/PDF -> AFAS**

```js
test('email PDF template extracts, looks up, maps and safe-tests AFAS without production write',async()=>{
  const calls=[];
  const registry={
    sources:{email:{read:async()=>({messageId:'m1',attachments:[{name:'invoice.pdf',mimeType:'application/pdf',contentRef:'doc1'}]})}},
    lookups:{afas:{lookup:async()=>({status:'matched',value:{supplierId:'S-42'},confidence:1})}},
    targets:{afas:{safeTest:async(_cfg,payload)=>{calls.push(payload);return {ok:true,targetRef:'dry-afas-1'};}}}
  };
  const extractor={extract:async()=>({detectedType:'purchase-invoice',classificationConfidence:.99,schemaVersion:1,fields:[{key:'supplier_name',value:'ACME',confidence:.99},{key:'invoice_number',value:'INV-1',confidence:.99}]})};
  const execution=await runConnectorTest({tenantId:'t1',draft:validDraft,input:{},adapterRegistry:registry,extractor});
  assert.equal(execution.state,'TEST_PASSED');
  assert.equal(calls.length,1);
  assert.equal(execution.evidence.target.safeTest,true);
});
```

- [ ] **Step 2: Run engine test and verify RED**

Run: `node --test tests/connector-engine.test.mjs`
Expected: FAIL because engine does not exist.

- [ ] **Step 3: Implement deterministic pipeline stages**

Order must be: source read -> deterministic routing -> classification/extraction -> field validation -> lookups -> mappings/transforms -> review decision -> target safe-test -> evidence assembly. No production target write occurs in `runConnectorTest`.

- [ ] **Step 4: Add fail-closed lookup ambiguity test**

```js
test('ambiguous lookup enters review and never target-tests',async()=>{
  let targetCalls=0;
  // adapter lookup returns {status:'ambiguous',matches:[...]}
  // assert execution.state === 'REVIEW_REQUIRED'
  // assert targetCalls === 0
});
```

- [ ] **Step 5: Add dedupe/idempotency test**

Assert the execution receives a deterministic dedupe key from message ID + content hash/document identifier and a retry keeps the same lineage key.

- [ ] **Step 6: Add purchase invoice validation test**

Assert duplicate invoice, supplier/PO mismatch, VAT/amount validation can block safe target execution and create explicit validation evidence.

- [ ] **Step 7: Add ISO extraction schema test**

Assert `standard`, `certificate_number`, `expiry_date` and arbitrary tenant-added field survive normalization and mapping to a database target.

- [ ] **Step 8: Implement minimal adapter registry**

Mark AFAS, Exact, Supabase/Postgres, SQL, SharePoint, Datahub, REST, webhook, Make and Power Automate capabilities explicitly. Only adapters with injected/configured runtime hooks may execute; others return `ADAPTER_NOT_CONFIGURED`.

- [ ] **Step 9: Run engine suite**

Run: `node --test tests/connector-engine.test.mjs`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add platform/connectors/document-extraction.mjs platform/connectors/connector-adapters.mjs platform/connectors/connector-engine.mjs tests/connector-engine.test.mjs
git commit -m "feat: add evidence-gated connector test engine"
```

---

### Task 4: Wire test, activation, pause, executions and review into the API

**Files:**
- Modify: `platform/api/portal-connectors-handler.mjs`
- Modify: `netlify/functions/_portal-connectors-store.mjs`
- Test: `tests/portal-connectors-handler.test.mjs`
- Test: `tests/connector-engine.test.mjs`

**Interfaces:**
- `POST /api/connectors/:id/test` calls `runConnectorTest` and persists immutable execution/evidence.
- `POST /api/connectors/:id/activate` calls `evaluateActivation` and rejects without passing evidence.
- `POST /api/connectors/:id/pause` changes runtime state but preserves recovery/evidence history.
- `GET /api/connectors/:id/executions` returns redacted records.
- Review decisions append audit records and can create a controlled replay obligation.

- [ ] **Step 1: Write failing activation-without-evidence API test**

```js
test('activation is rejected until a passing test execution exists',async()=>{
  const res=await handlePortalConnectorsRequest({method:'POST',path:'/api/connectors/c1/activate',user:{tenantId:'t1'},store:fakeStore,engine:fakeEngine});
  assert.equal(res.statusCode,409);
  assert.equal(res.body.error,'TEST_EVIDENCE_REQUIRED');
});
```

- [ ] **Step 2: Run targeted API test and verify RED**

Run: `node --test tests/portal-connectors-handler.test.mjs`
Expected: FAIL on activation route.

- [ ] **Step 3: Implement lifecycle routes and persisted evidence**

Only `TEST_PASSED` execution from the same connector config version can satisfy activation. Store `activatedAt`, `activatedBy`, `testExecutionId`, `configVersion` and evidence reference.

- [ ] **Step 4: Add positive activation test**

Assert passing evidence transitions state to `Active` and returns evidence metadata without secrets.

- [ ] **Step 5: Add review decision test**

Assert approve/reject requires authenticated tenant, review belongs to same tenant, and correction values are stored as audit/learning evidence.

- [ ] **Step 6: Add retry-safe vs unsafe error test**

Retry-safe transport timeout may create bounded replay; auth/mapping/ambiguous lookup creates recovery obligation and does not loop.

- [ ] **Step 7: Run API + engine tests**

Run: `node --test tests/portal-connectors-handler.test.mjs tests/connector-engine.test.mjs`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add platform/api/portal-connectors-handler.mjs netlify/functions/_portal-connectors-store.mjs tests/portal-connectors-handler.test.mjs tests/connector-engine.test.mjs
git commit -m "feat: enforce connector activation and review lifecycle"
```

---

### Task 5: Build browser connector store and generic wizard state

**Files:**
- Create: `portal-next/connector-builder-store.js`
- Test: `tests/connector-builder-store.test.mjs`

**Interfaces:**
- Produces `createConnectorBuilderStore({fetchImpl})`.
- Methods: `loadTemplates()`, `start(templateId)`, `updateSource(patch)`, `setDocumentType(type)`, `addField(field)`, `updateField(key,patch)`, `removeField(key)`, `setLookups(rules)`, `setMappings(rows)`, `setTarget(target)`, `setReviewPolicy(policy)`, `saveDraft()`, `runTest(input)`, `activate()`, `loadExecutions()`, `loadReviewQueue()`.
- State exposes `draft`, `validation`, `testExecution`, `runtime`, `error`.

- [ ] **Step 1: Write failing store tests**

```js
test('template prefill stays editable',()=>{
  const store=createConnectorBuilderStore({fetchImpl:async()=>{}});
  store.start('purchase-invoice');
  store.addField({key:'department_code',label:'Afdeling',type:'string',required:false});
  store.setTarget({type:'exact',action:'purchase-entry'});
  assert.equal(store.state.draft.documentSchema.fields.some(f=>f.key==='department_code'),true);
  assert.equal(store.state.draft.target.type,'exact');
});
```

- [ ] **Step 2: Run store tests and verify RED**

Run: `node --test tests/connector-builder-store.test.mjs`
Expected: FAIL because store does not exist.

- [ ] **Step 3: Implement in-memory draft state plus API boundary**

Do not store credentials in browser state. API error codes `TENANT_NOT_CONFIGURED`, `ADAPTER_NOT_CONFIGURED`, `REVIEW_REQUIRED`, `TEST_EVIDENCE_REQUIRED` must remain distinguishable for UI rendering.

- [ ] **Step 4: Add test that Active cannot be set client-side**

The store must derive runtime state from API response only; direct mutation attempts must not mark connector active.

- [ ] **Step 5: Add custom source/target independence test**

Start ISO template, switch source to SharePoint and target to Supabase, then verify mapping remains intact.

- [ ] **Step 6: Run store suite**

Run: `node --test tests/connector-builder-store.test.mjs`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add portal-next/connector-builder-store.js tests/connector-builder-store.test.mjs
git commit -m "feat: add connector builder client store"
```

---

### Task 6: Build native Data & Koppelingen builder UI

**Files:**
- Create: `portal-next/connector-builder-view.js`
- Create: `portal-next/connector-builder.css`
- Modify: `portal-next/portal-project-views.js`
- Modify: `portal-next/portal-navigation-complete.js`
- Modify: `portal-next/index.html` only if explicit stylesheet/module import is required.
- Test: `tests/connector-builder-view.test.mjs`
- Test: `tests/portal-connector-builder-integration.test.mjs`

**Interfaces:**
- `renderConnectorHub({plannedIntegrations,connectors,templates})` renders three separated groups: Geplande koppelingen, Gebouwde koppelingen, Templates.
- `renderConnectorWizard(state)` renders stages 1-10 and actionable validation.
- `renderConnectorTestResult(execution)` renders field confidence, lookups, validation and proposed target payload.
- `renderConnectorEvidence(connector,executions)` renders evidence/runtime truth without fabricated success.

- [ ] **Step 1: Write failing hub separation test**

```js
test('koppelingen distinguishes planned, built and templates',()=>{
  const html=renderConnectorHub({plannedIntegrations:[{name:'GA4'}],connectors:[{name:'Mail naar AFAS',state:'Configured'}],templates:[{name:'E-mail PDF -> AFAS Document Intake'}]});
  assert.match(html,/Geplande koppelingen/);
  assert.match(html,/Gebouwde koppelingen/);
  assert.match(html,/Templates/);
  assert.doesNotMatch(html,/Configured[^]*Actief/);
});
```

- [ ] **Step 2: Run view tests and verify RED**

Run: `node --test tests/connector-builder-view.test.mjs`
Expected: FAIL because view module does not exist.

- [ ] **Step 3: Implement hub and ten-stage wizard renderer**

Use semantic buttons, labels, fieldsets and status regions. Include buttons for `Koppeling bouwen`, template choice, add/remove custom field, add lookup, add mapping, test and activate. Activation control is disabled unless server evidence says eligible.

- [ ] **Step 4: Add mapping UI test**

Assert arbitrary extracted field, lookup result, transformation selector and target field can render in the same mapping row.

- [ ] **Step 5: Add review/test evidence view test**

Assert original document metadata, confidence, lookup result, proposed payload, validation warnings and approve/reject/retry controls render when state requires review.

- [ ] **Step 6: Integrate into existing `koppelingen` route**

Modify `portal-project-views.js` so offer-derived integrations are still visible but delegated to connector hub rendering. Modify navigation to initialize builder store for authorized tenant and support deep links such as `?page=koppelingen&connector=new&template=email-pdf-afas` without treating query params as authorization.

- [ ] **Step 7: Add integration regression test**

Assert `renderProjectPage('koppelingen',project)` contains the planned integration section and the native builder entry, and contains no legacy iframe/link dependency.

- [ ] **Step 8: Run UI unit/integration tests**

Run: `node --test tests/connector-builder-view.test.mjs tests/portal-connector-builder-integration.test.mjs`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add portal-next/connector-builder-view.js portal-next/connector-builder.css portal-next/portal-project-views.js portal-next/portal-navigation-complete.js portal-next/index.html tests/connector-builder-view.test.mjs tests/portal-connector-builder-integration.test.mjs
git commit -m "feat: add native connector builder to Portal Next"
```

---

### Task 7: Make purchase-invoice, ISO and Email/PDF->AFAS templates usable end-to-end

**Files:**
- Modify: `portal-next/connector-templates.js`
- Modify: `platform/connectors/connector-engine.mjs`
- Modify: `platform/connectors/connector-adapters.mjs`
- Test: `tests/connector-templates.test.mjs`
- Test: `tests/connector-engine.test.mjs`
- Test: `tests/portal-connector-builder-integration.test.mjs`

**Interfaces:**
- Purchase invoice template includes supplier, invoice, PO, amount/VAT, currency and accounting mapping hooks.
- ISO template includes standard, certificate number, scope, issuer, issue/expiry dates, sites and optional custom fields.
- Email/PDF->AFAS includes PDF attachment filter, optional archive stage, AFAS lookup, `KnSubject` target profile and review policy hooks.

- [ ] **Step 1: Add failing purchase-invoice duplicate/PO validation tests**

Assert duplicate invoice detection and unresolved PO prevent activation/test target stage.

- [ ] **Step 2: Add failing ISO expiry/custom-field tests**

Assert ISO expiry is extracted as data but no active alert is claimed without an actual scheduler/runtime contract.

- [ ] **Step 3: Add failing AFAS template configurability test**

Assert mailbox, extraction fields, archive step, review thresholds, GetConnector and target profile remain editable and no AFAS token appears client-side.

- [ ] **Step 4: Implement minimal template-specific rules on generic contracts**

Rules must be declarative configuration consumed by engine validators; do not branch the entire engine on template IDs.

- [ ] **Step 5: Run all connector model/engine/integration tests**

Run: `node --test tests/connector-*.test.mjs tests/portal-connectors-handler.test.mjs tests/portal-connector-builder-integration.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add portal-next/connector-templates.js platform/connectors/connector-engine.mjs platform/connectors/connector-adapters.mjs tests/connector-templates.test.mjs tests/connector-engine.test.mjs tests/portal-connector-builder-integration.test.mjs
git commit -m "feat: complete connector document templates"
```

---

### Task 8: Mobile, accessibility and live-preview regression coverage

**Files:**
- Modify/Create: existing Portal Next Playwright/live preview spec, preferably `tests/portal-connector-builder-live.spec.mjs` if workflow globs support it.
- Modify: `portal-next/connector-builder.css`
- Modify: portal regression workflow only when needed to include the test.

**Interfaces:**
- Verifies deep link to connector hub and wizard.
- Desktop and mobile complete all ten stages with a safe fixture/test adapter.
- No hover-only actions; focusable controls and visible labels.

- [ ] **Step 1: Write failing browser test for desktop wizard**

Test sequence: open Portal Next preview with authenticated test fixture -> Koppelingen -> Koppeling bouwen -> choose purchase invoice -> add custom field -> configure lookup -> mapping -> target -> test -> observe `Test passed` evidence -> activation becomes available.

- [ ] **Step 2: Run browser test against deploy/local fixture and verify RED**

Use the repository's current Portal Live Preview command/workflow invocation. Expected initial failure on missing builder interaction.

- [ ] **Step 3: Add mobile browser test**

Use mobile viewport, touch/click controls, verify stage navigation, add/remove field, mapping, test evidence and no horizontal interaction blocker.

- [ ] **Step 4: Fix only demonstrated UI/accessibility failures**

Adjust CSS/markup based on browser evidence; no cosmetic redesign unrelated to screenshot-led Portal Next design.

- [ ] **Step 5: Run unit + browser connector suite**

Run connector Node tests plus the exact Playwright command used by `Business OS Live Preview`/portal regression workflow.
Expected: PASS desktop and mobile.

- [ ] **Step 6: Commit**

```bash
git add portal-next/connector-builder.css tests/portal-connector-builder-live.spec.mjs .github/workflows
git commit -m "test: cover connector builder desktop and mobile"
```

---

### Task 9: Release-gate integration and production verification

**Files:**
- Modify only if required by existing contracts: `.github/workflows/...`, test manifest/config files.
- No product-code change unless a gate exposes a real root cause.

**Interfaces:**
- Exact feature head must pass Required test, Portal Native Regression Tests, Business OS Live Preview, BRAIN delivery/materiality contract when triggered, Netlify deploy preview.

- [ ] **Step 1: Run complete local/test command set available in repo**

Run all connector tests plus existing portal native regression command.
Expected: PASS.

- [ ] **Step 2: Open draft PR from `feature/portal-next-generic-connector-builder` to `main`**

PR body must state:
- generic builder scope;
- planned-vs-runtime integration separation;
- Email/PDF->AFAS first template;
- purchase invoice/ISO/custom schema support;
- no route switch for IJsselmonde unless separately approved;
- unsupported adapters fail closed/not configured.

- [ ] **Step 3: Verify exact-head CI**

Poll the exact PR head and inspect any failed job logs. Fix root cause on branch and repeat until the exact head is green.

- [ ] **Step 4: Verify deploy preview manually/automatically**

Confirm Portal Next Koppelingen page serves the native hub and builder on desktop/mobile and test fixtures do not claim production `Active` without evidence.

- [ ] **Step 5: Merge only after required `test` context and release gates are green**

Use expected head SHA to prevent moving-head merge.

- [ ] **Step 6: Verify Netlify production readback on the exact merge SHA**

Confirm production deploy state `ready`, `commit_ref` equals merge SHA, and new `portal-connectors` function is present when server API is included.

- [ ] **Step 7: Verify public/runtime behavior**

Check Portal Next loads, planned integrations remain visible, connector hub loads only under authenticated tenant context, unauthenticated API denies access, and configured adapters remain truthful (`Niet geconfigureerd` where credentials/runtime are absent).

- [ ] **Step 8: Record closed-loop learning**

Capture implementation outcome/evidence and prevention rules in the repository learning/BRAIN delivery path. If external Brain writeback is unavailable, leave a dedupeable open writeback obligation rather than claiming success.

---

## Self-review

### Spec coverage
- Generic sources, custom document types/fields: Tasks 1, 5, 6.
- PDF/email extraction: Tasks 3, 7.
- Purchase invoices and ISO: Tasks 1, 3, 7.
- Database lookup/enrichment: Tasks 3, 6.
- Arbitrary mapping/transforms: Tasks 1, 3, 6.
- AFAS/Exact/database/API targets: Tasks 1, 3, 7.
- Human review: Tasks 3, 4, 6.
- Tenant/security/secrets: Tasks 2, 4, 5.
- Safe test + activation evidence: Tasks 3, 4, 6.
- Dedupe/retry/self-heal: Tasks 3, 4.
- Runtime monitoring/evidence: Tasks 4, 6.
- Planned vs built vs templates continuity: Task 6.
- Desktop/mobile/release gates: Tasks 8, 9.

### Placeholder scan
No `TBD`, `TODO`, unspecified test steps, or arbitrary "implement error handling" placeholders remain. Unsupported runtime adapters have an explicit `ADAPTER_NOT_CONFIGURED` contract.

### Type/signature consistency
`createConnectorDraft`, `validateConnectorDraft`, `activationEligibility`, `runConnectorTest`, `evaluateActivation`, `createConnectorBuilderStore`, `renderConnectorHub` and `renderConnectorWizard` are defined before later tasks consume them. Connector lifecycle names remain Draft/Configured/Test failed/Test passed/Awaiting approval/Ready to activate/Active/Degraded/Paused/Error/Retired at product level, while engine/API error codes remain machine-readable uppercase constants.