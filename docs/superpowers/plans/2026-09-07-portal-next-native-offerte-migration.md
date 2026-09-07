# Portal Next Native Offerte Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render de bestaande klant-/offerte-/projectinformatie volledig native in Portal Next, zonder iframe of zichtbare legacy-link, met dezelfde klantcontext en fail-closed runtime/evidence-statussen.

**Architecture:** Voeg een tenant-veilige server-read voor offerte/projectdata toe, normaliseer de bestaande offerte-JSON naar één Portal Project Model en laat alle relevante Portal Next-views uit datzelfde model renderen. `portal-navigation-complete.js` wordt alleen router/controller; data-adaptatie en view-rendering komen in aparte modules. De bestaande `/klantportaal?klant=ijsselmonde` blijft ongewijzigd tijdens de migratie.

**Tech Stack:** ES modules, Node test runner, Netlify Functions, Netlify Identity, bestaande portal projection/read-model code, HTML/CSS/vanilla JS.

**Spec:** `docs/superpowers/specs/2026-09-07-portal-next-native-offerte-migration-design.md`

## Global Constraints

- Geen iframe naar `klantportaal.html` in de eindgebruikersinterface.
- Geen zichtbare `Open los`- of andere legacy-link in Portal Next.
- Geen hardcoded `ijsselmonde` in generieke productiecomponenten.
- Tenant wordt server-side afgeleid via `resolveIdentityTenant(user)`; querystring is nooit autorisatie.
- Geen fictieve klantwaarheid of runtime-success zonder evidence.
- Bestaande IJsselmonde-productieroute blijft ongewijzigd.
- Mobile/tablet/desktop moeten allemaal werken zonder horizontale overflow.
- Deep links behouden klantcontext en openen direct de juiste native pagina.

---

### Task 1: Normaliseer de bestaande offerte naar één Portal Project Model

**Files:**
- Create: `portal-next/portal-project-model.js`
- Create: `tests/portal-project-model.test.mjs`

**Interfaces:**
- Produces: `normalizePortalProject({customer, quote, runtime}) -> PortalProject`
- Produces selectors: `projectParts(project)`, `projectSprints(project)`, `projectStories(project)`, `projectDocuments(project)`, `projectIntegrations(project)`

- [ ] **Step 1: Write the failing adapter test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePortalProject,projectSprints,projectStories} from '../portal-next/portal-project-model.js';

const quote={nummer:'OF-IJS-001',titel:'Analytics en Power BI',bedrag:20000,inhoud:{onderdelen:[{id:'fase1',titel:'Fase 1',prijs:3900,weken:2,sprints:[{titel:'Meetplan',wat:'Meetplan maken',op:'Werkend meetplan'}],stories:[['marketeer','zien welke campagne converteert','budget sturen']],documenten:[{naam:'Meetplan',week:1}],koppelingen:[{naam:'GA4',wat:'Meet website',week:1}]}]}};

test('normaliseert offerte zonder verlies van relaties',()=>{
  const project=normalizePortalProject({customer:{name:'IJsselmonde'},quote,runtime:null});
  assert.equal(project.quote.number,'OF-IJS-001');
  assert.equal(project.parts.length,1);
  assert.equal(projectSprints(project)[0].partId,'fase1');
  assert.equal(projectStories(project)[0].partId,'fase1');
  assert.equal(project.documents[0].week,1);
  assert.equal(project.integrations[0].name,'GA4');
});
```

- [ ] **Step 2: Run test and confirm RED**

Run: `node --test tests/portal-project-model.test.mjs`
Expected: FAIL omdat `portal-project-model.js` nog niet bestaat.

- [ ] **Step 3: Implement the minimal normalized model**

```js
const text=v=>typeof v==='string'?v.trim():'';
const arr=v=>Array.isArray(v)?v:[];
export function normalizePortalProject({customer={},quote={},runtime=null}={}){
  const inhoud=quote?.inhoud&&typeof quote.inhoud==='object'?quote.inhoud:{};
  const parts=arr(inhoud.onderdelen).map((part,index)=>({
    id:text(part.id)||`part-${index+1}`,title:text(part.titel)||'Onderdeel',summary:text(part.kort),price:Number(part.prijs)||0,weeks:Number(part.weken)||0,required:Boolean(part.vast),kind:text(part.soort)||'standard',
    sprints:arr(part.sprints),stories:arr(part.stories),documents:arr(part.documenten),integrations:arr(part.koppelingen)
  }));
  const withPart=(key,mapper)=>parts.flatMap(p=>p[key].map((item,index)=>mapper(item,p,index)));
  return Object.freeze({
    customer:Object.freeze({name:text(customer.name||customer.naam)}),
    quote:Object.freeze({number:text(quote.nummer),title:text(quote.titel||inhoud.titel),status:text(quote.status)||'Niet beschikbaar',amount:Number(quote.bedrag??inhoud.totaal)||0,validUntil:text(quote.geldig_tot||inhoud.geldig),signed:quote.getekend??inhoud.getekend??null,raw:inhoud}),
    parts:Object.freeze(parts),
    sprints:Object.freeze(withPart('sprints',(s,p,i)=>({id:`${p.id}:sprint:${i}`,partId:p.id,title:text(s.titel),work:text(s.wat),deliverable:text(s.op),status:'planned'}))),
    stories:Object.freeze(withPart('stories',(s,p,i)=>({id:`${p.id}:story:${i}`,partId:p.id,role:text(s?.[0]),need:text(s?.[1]),outcome:text(s?.[2])}))),
    documents:Object.freeze(withPart('documents',(d,p,i)=>({id:`${p.id}:document:${i}`,partId:p.id,name:text(d.naam),week:Number(d.week)||null,status:'planned'}))),
    integrations:Object.freeze(withPart('integrations',(k,p,i)=>({id:`${p.id}:integration:${i}`,partId:p.id,name:text(k.naam),purpose:text(k.wat),week:Number(k.week)||null,status:'planned'}))),
    planning:Object.freeze(arr(inhoud.planning).map((p,i)=>({id:`milestone:${i}`,label:text(p?.[0]),detail:text(p?.[1]),status:'planned'}))),
    licenses:inhoud.licenties||null,customerNeeds:Object.freeze(arr(inhoud.vanUNodig)),architecture:inhoud.architectuur||null,subscription:inhoud.doorlopend||null,runtime
  });
}
export const projectParts=p=>p?.parts||[];
export const projectSprints=p=>p?.sprints||[];
export const projectStories=p=>p?.stories||[];
export const projectDocuments=p=>p?.documents||[];
export const projectIntegrations=p=>p?.integrations||[];
```

- [ ] **Step 4: Run model tests GREEN**

Run: `node --test tests/portal-project-model.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add portal-next/portal-project-model.js tests/portal-project-model.test.mjs
git commit -m "feat: add native portal project model"
```

---

### Task 2: Maak een tenant-veilige read API voor offerte/projectdata

**Files:**
- Create: `platform/api/portal-project-handler.mjs`
- Create: `netlify/functions/portal-project.mjs`
- Create: `netlify/functions/_portal-project-store.mjs`
- Create: `tests/portal-project-handler.test.mjs`

**Interfaces:**
- Consumes: `resolveIdentityTenant(user)` uit `platform/read-models/portal-server-state.mjs`
- Produces: authenticated `GET /api/portal-project`
- Store contract: `store.get(tenantId) -> {customer,quote,runtime}|null`

- [ ] **Step 1: Write auth/tenant RED tests**

```js
import test from 'node:test';import assert from 'node:assert/strict';
import {createPortalProjectHandler} from '../platform/api/portal-project-handler.mjs';
test('weigert anonieme gebruiker',async()=>{const h=createPortalProjectHandler({getUser:async()=>null,store:{get:async()=>null}});assert.equal((await h(new Request('https://x/api/portal-project'))).status,401)});
test('leest alleen identity tenant',async()=>{let seen='';const h=createPortalProjectHandler({getUser:async()=>({id:'u1',appMetadata:{tenantId:'tenant-1'}}),store:{get:async id=>(seen=id,{customer:{name:'X'},quote:{nummer:'1'}})}});assert.equal((await h(new Request('https://x/api/portal-project?klant=ijsselmonde'))).status,200);assert.equal(seen,'tenant-1')});
```

- [ ] **Step 2: Run and confirm RED**

Run: `node --test tests/portal-project-handler.test.mjs`
Expected: FAIL module missing.

- [ ] **Step 3: Implement handler using server identity only**

```js
import {resolveIdentityTenant} from '../read-models/portal-server-state.mjs';
const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});
export function createPortalProjectHandler({getUser,store}={}){
  if(typeof getUser!=='function'||!store?.get)throw new TypeError('getUser and store.get are required');
  return async request=>{if(request.method!=='GET')return new Response('Method Not Allowed',{status:405});const user=await getUser();if(!user?.id)return json({error:'UNAUTHORIZED'},401);const tenantId=resolveIdentityTenant(user);if(!tenantId)return json({error:'FORBIDDEN'},403);const record=await store.get(tenantId);return record?json(record):json({error:'NOT_FOUND'},404)};
}
```

- [ ] **Step 4: Implement store on the existing server-side data boundary**

`_portal-project-store.mjs` must query the existing customer/offerte source using server credentials, first resolve the customer record for the identity tenant mapping, then select the newest applicable quote and return `{customer,quote,runtime:null}`. It must never accept a browser supplied customer slug as authorization input.

- [ ] **Step 5: Wire Netlify function**

```js
import {getUser} from '@netlify/identity';
import {createPortalProjectHandler} from '../../platform/api/portal-project-handler.mjs';
import {createPortalProjectStore} from './_portal-project-store.mjs';
export default createPortalProjectHandler({getUser,store:createPortalProjectStore()});
export const config={path:'/api/portal-project'};
```

- [ ] **Step 6: Run tests GREEN and commit**

Run: `node --test tests/portal-project-handler.test.mjs`
Expected: PASS.

```bash
git add platform/api/portal-project-handler.mjs netlify/functions/portal-project.mjs netlify/functions/_portal-project-store.mjs tests/portal-project-handler.test.mjs
git commit -m "feat: expose tenant safe portal project read model"
```

---

### Task 3: Voeg client store toe en maak ontbrekende data fail-closed

**Files:**
- Create: `portal-next/portal-project-store.js`
- Create: `tests/portal-project-store.test.mjs`

**Interfaces:**
- Produces: `loadPortalProject({fetchFn,endpoint}) -> Promise<{state,project,error}>`
- `state` is exactly `ready | empty | unauthorized | error`

- [ ] **Step 1: Write RED tests for ready/404/401/network**
- [ ] **Step 2: Run `node --test tests/portal-project-store.test.mjs` and confirm FAIL**
- [ ] **Step 3: Implement fetch to `/api/portal-project`, normalize with `normalizePortalProject`, and return neutral states rather than demo values**
- [ ] **Step 4: Run GREEN and commit**

```bash
git add portal-next/portal-project-store.js tests/portal-project-store.test.mjs
git commit -m "feat: load native portal project safely"
```

---

### Task 4: Bouw native Offerte + Onderdelen + Sprints + Stories

**Files:**
- Create: `portal-next/portal-project-views.js`
- Modify: `portal-next/portal-navigation-complete.js`
- Modify: `portal-next/portal-navigation-complete.css`
- Create: `tests/portal-project-views.test.mjs`

**Interfaces:**
- Produces: `renderProjectPage(pageId,project) -> HTML string`
- Supported pageIds in this task: `offerte`, `roadmap`, `taken-werkstromen`

- [ ] **Step 1: RED test verifies offerte title/number/amount and every part/sprint/story is present**
- [ ] **Step 2: RED test verifies generated HTML contains neither `<iframe` nor `data-open-legacy` nor `klantportaal.html`**
- [ ] **Step 3: Implement semantic cards/accordions for quote, parts, sprints and stories using escaped text only**
- [ ] **Step 4: Replace `parityHtml(page)` path for migrated project pages with `renderProjectPage(page.id,project)`**
- [ ] **Step 5: Run GREEN and commit**

Run: `node --test tests/portal-project-views.test.mjs tests/portal-next-ijsselmonde-example.test.mjs`
Expected: existing legacy-frame expectation must be deliberately replaced by a native-no-legacy expectation.

---

### Task 5: Bouw native Documenten en Koppelingen

**Files:**
- Modify: `portal-next/portal-project-views.js`
- Modify: `portal-next/portal-navigation-complete.js`
- Create: `tests/portal-project-docs-integrations.test.mjs`

**Interfaces:**
- `renderProjectPage('documenten',project)` renders all planned deliverables.
- `renderProjectPage('koppelingen',project)` renders all quote integrations.

- [ ] **Step 1: RED test checks every document keeps `partId` + `week` and defaults to `planned`, never `completed`**
- [ ] **Step 2: RED test checks every integration keeps purpose/part/week and defaults to `planned`, never `active`**
- [ ] **Step 3: Implement native views with explicit status labels and links back to part/sprint context**
- [ ] **Step 4: Run GREEN and commit**

---

### Task 6: Verbind planning, acties, outcomes en Brain/Powerhouse evidence

**Files:**
- Modify: `portal-next/portal-project-model.js`
- Modify: `portal-next/portal-project-views.js`
- Reuse: `portal-next/portal-flow-state.js`
- Reuse: `portal-next/portal-powerhouse-adapter.js`
- Create: `tests/portal-project-evidence.test.mjs`

**Interfaces:**
- Planned quote items stay `planned`.
- Runtime can promote states only when adapter/evidence contract permits it.

- [ ] **Step 1: RED tests prove `completed` without evidence remains waiting/planned**
- [ ] **Step 2: RED tests prove observed/verified outcomes are distinct**
- [ ] **Step 3: Merge runtime records into project items by stable IDs without overwriting quote facts**
- [ ] **Step 4: Render trace `Offerte → Datahub → AI Brain → Powerhouse → module → actie → outcome → evidence → learning` with active styling only for evidence-backed stages**
- [ ] **Step 5: Run GREEN and commit**

---

### Task 7: Verwijder de zichtbare legacy-bridge volledig voor gemigreerde projectviews

**Files:**
- Modify: `portal-next/portal-navigation-complete.js`
- Modify: `portal-next/portal-navigation-complete.css`
- Modify: `tests/portal-next-ijsselmonde-example.test.mjs`
- Create: `tests/portal-native-no-legacy.test.mjs`

- [ ] **Step 1: Change the existing test from `legacyFrameUrl` expectation to native deep-link/customer-context expectation**
- [ ] **Step 2: Add repository contract test that Portal Next source contains no `native-legacy-frame`, `data-open-legacy`, `activateEmbeddedLegacyPage`, `styleLegacyDocument` or `/klantportaal.html`**
- [ ] **Step 3: Remove those functions/branches from `portal-navigation-complete.js`**
- [ ] **Step 4: Remove obsolete iframe CSS**
- [ ] **Step 5: Run portal test suite GREEN and commit**

---

### Task 8: Mobile, deep links en volledige parity/releasegate

**Files:**
- Modify: `portal-next/portal-navigation-complete.css`
- Modify: `portal-next/index.html` only where necessary for semantic containers
- Create: `tests/portal-project-parity.test.mjs`
- Extend existing Portal Next browser/live-preview tests

- [ ] **Step 1: Add parity fixture derived from the current IJsselmonde quote schema and assert counts/values for parts, sprints, stories, documents, integrations, planning, licenses, customer input, architecture and subscription**
- [ ] **Step 2: Add deep-link tests for `offerte`, `roadmap`, `documenten`, `koppelingen`, `taken-werkstromen` while preserving the active customer query**
- [ ] **Step 3: Add browser assertions at iPhone/tablet/desktop widths: hamburger works, no horizontal overflow, no iframe/legacy link, project relations open, back/forward works**
- [ ] **Step 4: Run focused suite**

```bash
node --test \
  tests/portal-project-model.test.mjs \
  tests/portal-project-handler.test.mjs \
  tests/portal-project-store.test.mjs \
  tests/portal-project-views.test.mjs \
  tests/portal-project-docs-integrations.test.mjs \
  tests/portal-project-evidence.test.mjs \
  tests/portal-native-no-legacy.test.mjs \
  tests/portal-project-parity.test.mjs \
  tests/portal-content-map.test.mjs
```

Expected: PASS, 0 failures.

- [ ] **Step 5: Run repository required test + portal lane + live preview**
- [ ] **Step 6: Open PR from `feature/portal-next-native-offerte-migration` to `main`; keep IJsselmonde routing unchanged**
- [ ] **Step 7: Merge only with exact expected head SHA and all required checks green**
- [ ] **Step 8: Verify exact merge SHA is the Netlify production commit and production-readback is green**
- [ ] **Step 9: Verify direct examples:**
  - `/portal-next/?klant=ijsselmonde&page=offerte`
  - `/portal-next/?klant=ijsselmonde&page=roadmap`
  - `/portal-next/?klant=ijsselmonde&page=documenten`
  - `/portal-next/?klant=ijsselmonde&page=koppelingen`
  - `/portal-next/?klant=ijsselmonde&page=taken-werkstromen`

## Self-review result

- Spec coverage: offerte, onderdelen, sprints, stories, documenten, koppelingen, planning, acties/outcomes, Brain/Powerhouse/evidence, customer scoping, mobile, deep links en legacy-exit zijn ieder aan een concrete taak gekoppeld.
- Placeholder scan: geen TBD/TODO/implement-later stappen; runtime-statusregels zijn exact fail-closed.
- Type consistency: `PortalProject` en de selectors worden in Task 1 vastgelegd en door alle viewtaken hergebruikt; `renderProjectPage(pageId,project)` is de enige native project-view interface.
- Scope: één samenhangend subsysteem — offerte/projectreadmodel + native Portal Next-weergave — en dus geschikt voor één implementatieplan.
