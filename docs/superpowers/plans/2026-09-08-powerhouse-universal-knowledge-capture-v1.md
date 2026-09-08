# Powerhouse Universal Knowledge Capture v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every material Bedrijfsgeheugen/Powerhouse chat, agent action, release, deploy, incident and architecture change produce one normalized, source-linked knowledge event that is routed through BG168 → BG166 → BG167 and projected back into Powerhouse.

**Architecture:** Extend the existing Brain contracts, adapters, operating-loop and completion gates instead of adding a second memory system. Add a versioned Universal Knowledge Event contract, thin source adapters, deterministic architecture-impact resolution, blocked-write spool/replay, structured BG168/BG166/BG167 compatibility, cockpit/timeline projection and release closure rules. The homepage-video repair is the first end-to-end canary.

**Tech Stack:** Node.js 22 ES modules, `node:test`, existing Brain operating-loop/contracts/adapters, Make scenarios BG168/BG166/BG167, Notion knowledge projection, GitHub Actions Brain foundation suite, Netlify production evidence.

**Spec:** `docs/superpowers/specs/2026-09-08-powerhouse-universal-knowledge-capture-v1-design.md`

## Global Constraints
- BG168 → BG166 → BG167 remains the only canonical material-learning path.
- No full chat transcript or full agent log is stored by default; normalized knowledge + strong source references only.
- Notion, cockpit and repository docs are projections, never competing canonical memories.
- Materiality promotion remains owned by BG168.
- Duplicate/coalesced events may not trigger duplicate durable writes or duplicate BG167 refreshes.
- A record cannot be `closed` without downstream evidence and BG167 readback; an external platform blocker leaves a visible owned obligation.
- Do not store secrets, tokens, credentials or confidential raw provider responses in the knowledge event.
- Existing `brain/contracts/envelope.schema.json`, completion gate, adapter conformance and operating-loop contracts remain compatible.
- Existing Brain foundation suite remains green through `node scripts/brain/test-all.mjs` and `.github/workflows/brain-foundation-verify.yml`.
- Make-capacity or platform-control blockers must be read back directly; do not infer runtime health from repository tests.

---

### Task 1: Universal Knowledge Event Contract and Validator

**Files:**
- Create: `brain/contracts/knowledge-event-v1.schema.json`
- Create: `brain/knowledge/knowledge-event.mjs`
- Create: `scripts/brain/test-universal-knowledge-event.mjs`
- Modify: `brain/contracts/envelope.schema.json`

**Interfaces:**
- Produces: `normalizeKnowledgeEvent(input, { now, idFactory })` → immutable `powerhouse.knowledge-event.v1` object.
- Produces: `validateKnowledgeEvent(event)` → `{ valid, errors }`.
- Preserves the existing generic envelope identity fields by mapping `event_id -> id`, `captured_at -> created_at`, actor/service -> `producer`, and source references -> `provenance`.

- [ ] **Step 1: Write the failing contract test.**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeKnowledgeEvent,validateKnowledgeEvent} from '../../brain/knowledge/knowledge-event.mjs';

test('normalizes a source-linked material knowledge event',()=>{
  const event=normalizeKnowledgeEvent({
    source_type:'github',
    source_refs:[{system:'github',kind:'pull_request',id:'1159',relationship:'origin'}],
    actor:{type:'human',id:'arthurprinsen-ai',name:'Arthur Prinsen'},
    component:'website:homepage-hero-video',
    architecture_layer:'frontend',
    intent:'restore homepage hero video playback',
    decision:{decision:'add lifecycle recovery',rationale:'static autoplay attributes were insufficient',owner:'Powerhouse'},
    action:{summary:'add initHeroVideoRecovery',technical_changes:['assets/js/menu.js']},
    evidence:[{kind:'commit',id:'7695e386ed7b234391dfa4d8ef0de7479dd48aa5'}],
    outcome:{status:'success',summary:'production deploy ready'},
    rollback:{strategy:'revert merge SHA',last_known_good_ref:'121d5a6c715a5fba2655f743a502b64cb0a26ac8'}
  },{now:()=> '2026-09-08T10:37:11.053Z',idFactory:()=> 'uke-1159'});
  assert.equal(event.schema_version,'powerhouse.knowledge-event.v1');
  assert.equal(event.event_id,'uke-1159');
  assert.equal(event.producer,'human:arthurprinsen-ai');
  assert.equal(validateKnowledgeEvent(event).valid,true);
});

test('rejects secrets and missing source refs',()=>{
  const invalid={schema_version:'powerhouse.knowledge-event.v1',event_id:'x',source_refs:[],context_summary:'token=secret'};
  const result=validateKnowledgeEvent(invalid);
  assert.equal(result.valid,false);
  assert.ok(result.errors.some(x=>x.includes('source_refs')));
});
```

- [ ] **Step 2: Run the test and verify RED.**

Run: `node --test scripts/brain/test-universal-knowledge-event.mjs`

Expected: FAIL because `brain/knowledge/knowledge-event.mjs` does not exist.

- [ ] **Step 3: Implement the schema and minimal normalizer/validator.**

```js
const SOURCE_TYPES=new Set(['chat','agent','github','netlify','make','notion','portal','crm','human','other']);
const OUTCOME_STATES=new Set(['success','failed','partial','blocked','open']);
const SECRET_PATTERN=/(authorization|api[_-]?key|bearer\s+[a-z0-9._-]+|password|token\s*[=:])/i;

export function validateKnowledgeEvent(event={}){
  const errors=[];
  if(event.schema_version!=='powerhouse.knowledge-event.v1') errors.push('schema_version');
  if(!String(event.event_id||'').trim()) errors.push('event_id');
  if(!SOURCE_TYPES.has(event.source_type)) errors.push('source_type');
  if(!Array.isArray(event.source_refs)||event.source_refs.length===0) errors.push('source_refs');
  if(!String(event.component||'').trim()) errors.push('component');
  if(!OUTCOME_STATES.has(event.outcome?.status)) errors.push('outcome.status');
  if(SECRET_PATTERN.test(JSON.stringify(event))) errors.push('secret-like content');
  return {valid:errors.length===0,errors};
}
```

`normalizeKnowledgeEvent` must add deterministic defaults for `writeback:{state:'pending',bg168_ref:null,bg166_ref:null}` and `readback:{state:'pending',bg167_ref:null,verified_at:null}`, preserve all source refs, and freeze the returned object.

- [ ] **Step 4: Run the focused test and the whole Brain suite.**

Run: `node --test scripts/brain/test-universal-knowledge-event.mjs && node scripts/brain/test-all.mjs`

Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add brain/contracts/knowledge-event-v1.schema.json brain/contracts/envelope.schema.json brain/knowledge/knowledge-event.mjs scripts/brain/test-universal-knowledge-event.mjs
git commit -m "feat: add universal knowledge event contract"
```

### Task 2: Source Reference Contract and Thin Capture Adapters

**Files:**
- Create: `brain/knowledge/source-ref.mjs`
- Create: `brain/adapters/knowledge-chat.mjs`
- Create: `brain/adapters/knowledge-agent.mjs`
- Create: `brain/adapters/knowledge-github.mjs`
- Create: `brain/adapters/knowledge-netlify.mjs`
- Create: `brain/adapters/knowledge-make.mjs`
- Create: `brain/adapters/knowledge-notion.mjs`
- Create: `brain/adapters/knowledge-business.mjs`
- Create: `scripts/brain/test-universal-capture-adapters.mjs`
- Modify: `brain/contracts/adapter-conformance-v1.json`

**Interfaces:**
- `sourceRef({system,kind,id,url,sha,version,execution_id,deploy_id,relationship})` validates and returns immutable source reference.
- Every adapter exports `toKnowledgeEvent(input, options)` and delegates final construction to `normalizeKnowledgeEvent`.
- `knowledge-business.mjs` covers portal, CRM and explicit human interventions; no separate persistence is introduced.

- [ ] **Step 1: Write adapter tests using one sample per source.**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {toKnowledgeEvent as githubEvent} from '../../brain/adapters/knowledge-github.mjs';
import {toKnowledgeEvent as netlifyEvent} from '../../brain/adapters/knowledge-netlify.mjs';

test('github and netlify adapters preserve authoritative ids without copying raw payloads',()=>{
  const g=githubEvent({pr:1159,head_sha:'f74cfdfa1225ba1ad8427e5719ec7b4f1f18c84a',merge_sha:'7695e386ed7b234391dfa4d8ef0de7479dd48aa5',component:'website:homepage-hero-video',intent:'repair video',outcome:'success'});
  const n=netlifyEvent({deploy_id:'6a9fe513a7af0e0008661320',commit_ref:'7695e386ed7b234391dfa4d8ef0de7479dd48aa5',state:'ready',component:'website:homepage-hero-video'});
  assert.ok(g.source_refs.some(x=>x.kind==='pull_request'&&x.id==='1159'));
  assert.ok(n.source_refs.some(x=>x.deploy_id==='6a9fe513a7af0e0008661320'));
  assert.equal(JSON.stringify(g).includes('raw_response'),false);
});
```

- [ ] **Step 2: Run RED.**

Run: `node --test scripts/brain/test-universal-capture-adapters.mjs`

- [ ] **Step 3: Implement source refs and adapters as normalization-only modules.**

```js
export function sourceRef(input={}){
  const ref={
    system:String(input.system||'').trim(),kind:String(input.kind||'').trim(),id:String(input.id||'').trim(),
    ...(input.url?{url:String(input.url)}:{}),...(input.sha?{sha:String(input.sha)}:{}),
    ...(input.execution_id?{execution_id:String(input.execution_id)}:{}),...(input.deploy_id?{deploy_id:String(input.deploy_id)}:{}),
    relationship:String(input.relationship||'evidence')
  };
  if(!ref.system||!ref.kind||!ref.id) throw new TypeError('source reference requires system, kind and id');
  return Object.freeze(ref);
}
```

Adapters must not perform network writes. Their only responsibility is source-specific field extraction into the common envelope.

- [ ] **Step 4: Extend adapter conformance.**

Keep `universal_event_ingest` mandatory and add contract evidence names `source_reference_contract` and `normalized_knowledge_event_v1`. Update `brain/operating-loop/adapter-conformance.mjs` only if required to evaluate the new evidence keys; do not weaken any existing required evidence.

- [ ] **Step 5: Run focused + full suite and commit.**

Run: `node --test scripts/brain/test-universal-capture-adapters.mjs && node scripts/brain/test-all.mjs`

```bash
git add brain/knowledge/source-ref.mjs brain/adapters/knowledge-*.mjs brain/contracts/adapter-conformance-v1.json brain/operating-loop/adapter-conformance.mjs scripts/brain/test-universal-capture-adapters.mjs
git commit -m "feat: normalize knowledge events from all material sources"
```

### Task 3: Deterministic Architecture Impact Resolver

**Files:**
- Create: `brain/knowledge/architecture-impact-resolver.mjs`
- Create: `brain/contracts/knowledge-component-registry-v1.json`
- Create: `scripts/brain/test-knowledge-architecture-impact.mjs`
- Modify: `brain/operating-loop/change-impact.mjs` only if a missing reusable primitive is proven by the failing test.

**Interfaces:**
- `resolveArchitectureImpact(event,{registry,graphRecords,tenantId})` → `{components,layers,dependencies,blast_radius,documentation_surfaces,expected_tests,rollback_owner,confidence}`.
- Explicit file/route/scenario mappings win over inference.
- Material technical events with no canonical mapping return `status:'UNMAPPED'` and must not be closable.

- [ ] **Step 1: Add failing tests for known mapping, dependency expansion and unmapped fail-closed.**

```js
import test from 'node:test';import assert from 'node:assert/strict';
import {resolveArchitectureImpact} from '../../brain/knowledge/architecture-impact-resolver.mjs';
const registry={components:[{id:'website:homepage-hero-video',layer:'frontend',paths:['assets/js/menu.js','index.html'],docs:['Powerhouse Direct Knowledge Base'],tests:['website / targeted-browser','website / broad-browser'],rollbackOwner:'Website Release'}]};

test('maps homepage video change deterministically',()=>{
 const result=resolveArchitectureImpact({action:{technical_changes:['assets/js/menu.js']}},{registry,graphRecords:[],tenantId:'bedrijfsgeheugen'});
 assert.deepEqual(result.components,['website:homepage-hero-video']);
 assert.equal(result.confidence,1);
});

test('material unmapped change fails closed',()=>{
 const result=resolveArchitectureImpact({action:{technical_changes:['unknown/new.mjs']}},{registry,graphRecords:[],tenantId:'bedrijfsgeheugen'});
 assert.equal(result.status,'UNMAPPED');
});
```

- [ ] **Step 2: Run RED.**

Run: `node --test scripts/brain/test-knowledge-architecture-impact.mjs`

- [ ] **Step 3: Implement deterministic path/route/scenario matching, then use existing `analyzeChangeImpact` for dependency expansion.**

```js
import {analyzeChangeImpact} from '../operating-loop/change-impact.mjs';
export function resolveArchitectureImpact(event,{registry,graphRecords=[],tenantId}={}){
  const changes=event?.action?.technical_changes||[];
  const matched=(registry?.components||[]).filter(c=>(c.paths||[]).some(p=>changes.includes(p)));
  if(matched.length===0) return Object.freeze({status:'UNMAPPED',components:[],confidence:0});
  const components=[...new Set(matched.map(x=>x.id))];
  const dependencies=components.flatMap(id=>analyzeChangeImpact(graphRecords,{tenantId,subjectId:id,maxDepth:2}).impacts.map(x=>x.subjectId));
  return Object.freeze({status:'MAPPED',components,layers:[...new Set(matched.map(x=>x.layer))],dependencies:[...new Set(dependencies)],documentation_surfaces:[...new Set(matched.flatMap(x=>x.docs||[]))],expected_tests:[...new Set(matched.flatMap(x=>x.tests||[]))],rollback_owner:[...new Set(matched.map(x=>x.rollbackOwner).filter(Boolean))],confidence:1});
}
```

- [ ] **Step 4: Seed the registry with existing canonical Brain/control-plane and homepage-video components only.** Do not attempt a speculative full-repository migration in this task; future components inherit the same contract when touched.

- [ ] **Step 5: Run full suite and commit.**

### Task 4: Durable Blocked-Write Spool and Exactly-Once Replay

**Files:**
- Create: `brain/knowledge/replay-spool.mjs`
- Create: `brain/contracts/knowledge-replay-spool-v1.json`
- Create: `scripts/brain/test-knowledge-replay-spool.mjs`
- Use existing durable store primitives where available; if production durability requires Supabase, add one migration under `supabase/migrations/` with unique `dedupe_key`.

**Interfaces:**
- `createReplaySpool(store)` with `defer(event, reason)`, `listOpen()`, `claim(dedupeKey)`, `markWritten(dedupeKey,refs)`, `markVerified(dedupeKey,bg167Ref)`.
- Duplicate `defer()` returns the existing obligation.
- Replay closure requires BG167 verification, never BG168/BG166 acknowledgement alone.

- [ ] **Step 1: Write failing exactly-once tests.**

```js
test('duplicate deferred event creates one open obligation',async()=>{
 const spool=createReplaySpool(memoryStore());
 await spool.defer(event,'MAKE_CAPACITY');
 await spool.defer(event,'MAKE_CAPACITY');
 assert.equal((await spool.listOpen()).length,1);
});

test('written event stays open until BG167 readback',async()=>{
 const spool=createReplaySpool(memoryStore());
 await spool.defer(event,'MAKE_CAPACITY');
 await spool.markWritten(event.dedupe_key,{bg166_ref:'write-1'});
 assert.equal((await spool.listOpen()).length,1);
 await spool.markVerified(event.dedupe_key,'bg167-readback-1');
 assert.equal((await spool.listOpen()).length,0);
});
```

- [ ] **Step 2: Implement state transitions `OPEN -> CLAIMED -> WRITTEN -> VERIFIED`, with `BLOCKED` as a reason, not terminal closure.**
- [ ] **Step 3: Add capacity-aware no-retry behavior:** Make capacity failure must call `defer` once and stop; no immediate recursive retry.
- [ ] **Step 4: Run full suite and commit.**

### Task 5: Backward-Compatible BG168, BG166 and BG167 Interface Extensions

**Systems:**
- Make scenario `7136176` — BG168 Multi-Agent Outcome & Learning Router v1
- Make scenario `7135971` — BG166 Error & Learning Ledger Writer v1.2
- Make scenario `7136045` — BG167 Shared Multi-Agent Team Context Hub v1.1

**Repository evidence:**
- Create: `brain/contracts/bg168-knowledge-event-interface-v1.json`
- Create: `brain/contracts/bg166-knowledge-event-interface-v1.json`
- Create: `brain/contracts/bg167-knowledge-readback-interface-v1.json`
- Create: `scripts/brain/test-bg166-bg167-bg168-knowledge-contract.mjs`

**Interfaces:**
- BG168 must continue accepting legacy `agent_id`, `task`, `result` and additionally accept optional `event_json`.
- BG168 output: `{status,event_id,fingerprint,material,dispatched,bg166_ref|null,deferred_reason|null}`.
- BG166 input remains `event_json`; normalizer must preserve Universal Knowledge fields and return `{written,deduped,event_id,fingerprint,bg166_ref,bg167_refresh}`.
- BG167 `request_json` gains readback mode: `{"mode":"readback","event_id":"..."}` or `fingerprint`; returns structured proof with `found`, `event_id`, `fingerprint`, `projection_ref`, `verified_at`.

- [ ] **Step 1: Write repository contract tests first.**

```js
const bg168=JSON.parse(fs.readFileSync('brain/contracts/bg168-knowledge-event-interface-v1.json'));
assert.ok(bg168.inputs.includes('event_json'));
assert.ok(bg168.legacy_inputs.includes('agent_id'));
const bg167=JSON.parse(fs.readFileSync('brain/contracts/bg167-knowledge-readback-interface-v1.json'));
assert.deepEqual(bg167.readback_keys,['event_id','fingerprint']);
```

- [ ] **Step 2: Read each live Make scenario with `scenario_get` and its relevant code/input modules with `scenario_module_get`. Record `lastEdit` before patching.**
- [ ] **Step 3: Patch BG168 atomically.** Extend the interface without removing legacy inputs; parse `event_json` when present, otherwise wrap legacy inputs through the same materiality classifier. Preserve the existing atomic 60-minute idempotency claim and BG166 route.
- [ ] **Step 4: Patch BG166 atomically.** Extend the normalize code to persist event/source/architecture/outcome/readback fields in the existing ledger record. Preserve fingerprint dedupe before Notion write and before BG167 refresh.
- [ ] **Step 5: Patch BG167 atomically.** Add an early readback branch keyed by `mode=readback`; keep the existing private refresh capability guard unchanged for refresh mode.
- [ ] **Step 6: Run one non-material legacy canary and one Universal Knowledge Event canary.** A legacy caller must still return normally; a duplicate universal event must not create a second ledger write.
- [ ] **Step 7: If Make reports `paused`/capacity blocked, do not burn retries.** Mark the runtime part blocked and continue repository work; the homepage-video canary remains in the replay spool until one successful BG168→BG166→BG167 execution is proven.

### Task 6: Completion Gate and Release-Control-Plane Diagnostics

**Files:**
- Modify: `brain/contracts/completion-gate-v1.json`
- Create: `brain/guards/knowledge-completion-gate.mjs`
- Create: `brain/guards/github-required-status-diagnostics.mjs`
- Create: `scripts/brain/test-knowledge-completion-gate.mjs`
- Modify: `scripts/brain/main-protection-certification.mjs`

**Interfaces:**
- `evaluateKnowledgeCompletion(event)` → `COMPLETE|OPEN|BLOCKED` with missing obligations.
- `diagnoseRequiredStatus({requiredContext,headStatuses,headCheckRuns,mergeCheckRuns,mergeApiMessage})` distinguishes `failed`, `queued`, `success`, `success_but_not_recognized`, `expected_on_synthetic_ref`, `provider_mismatch`.

- [ ] **Step 1: Add regression for the PR #1159 status-publication failure.**

```js
test('recognizes synthetic merge-ref required-status gap without rerunning tests',()=>{
 const d=diagnoseRequiredStatus({requiredContext:'test',headStatuses:[{context:'test',state:'success',app_id:15368}],headCheckRuns:[{name:'test',conclusion:'success'}],mergeCheckRuns:[],mergeApiMessage:'Required status check "test" is expected.'});
 assert.equal(d.classification,'expected_on_synthetic_ref');
 assert.equal(d.rerunTests,false);
});
```

- [ ] **Step 2: Extend completion rules.** Material technical events require architecture mapping, source refs, evidence, outcome, rollback, projection and BG167 readback. If an external Brain runtime is blocked, release may remain safe but knowledge status is `BLOCKED`, never `COMPLETE`.
- [ ] **Step 3: Preserve branch protection semantics.** Never suggest disabling the required `test` context. Diagnostics may recommend changing only the up-to-date/synthetic-ref requirement when exact evidence proves that is the mismatch.
- [ ] **Step 4: Run full suite and commit.**

### Task 7: Cockpit/Knowledge Timeline Projection

**Files:**
- Create: `brain/knowledge/timeline-projection.mjs`
- Modify: `brain/operating-loop/executive-cockpit.mjs`
- Modify: `brain/contracts/executive-cockpit-projection-v1.json`
- Create: `scripts/brain/test-knowledge-timeline-projection.mjs`

**Interfaces:**
- `buildKnowledgeTimeline(events,{component,fingerprint,sourceType,outcomeStatus})` returns newest-first material chains.
- `buildExecutiveCockpit` gains `knowledgeTimeline`, `openKnowledgeObligations` and `knowledgeHealth` but leaves existing fields intact.

- [ ] **Step 1: Write a failing homepage-video chain test.**

```js
const timeline=buildKnowledgeTimeline([chat,pr,merge,deploy,learning]);
assert.equal(timeline[0].chain.includes('6a9fe513a7af0e0008661320'),true);
assert.equal(timeline[0].sourceRefs.some(x=>x.id==='1159'),true);
```

- [ ] **Step 2: Implement projection as pure read-model transformation; never write canonical state here.**
- [ ] **Step 3: Extend executive cockpit without changing existing business-health calculations.**
- [ ] **Step 4: Run existing cockpit tests plus new timeline test and commit.**

### Task 8: Homepage Video Repair End-to-End Canary and Permanent Learning

**Files:**
- Create: `brain/learning/homepage-hero-video-autoplay-lifecycle-recovery-v1.json`
- Create: `brain/learning/github-required-test-synthetic-merge-ref-status-gap-v1.json`
- Create: `brain/evidence/homepage-video-knowledge-canary-2026-09-08.json`
- Create: `scripts/brain/test-homepage-video-knowledge-canary.mjs`
- Modify: `config/brain-chat-learning-contract.json` to link the two new canonical learning sources.

**Canary source facts:**
- PR `1159`
- head `f74cfdfa1225ba1ad8427e5719ec7b4f1f18c84a`
- merge `7695e386ed7b234391dfa4d8ef0de7479dd48aa5`
- Netlify deploy `6a9fe513a7af0e0008661320`
- code `assets/js/menu.js` / `initHeroVideoRecovery`
- later main moved to `20c4cf0125f4114e216be368e5480e135ea40e6c`, with the video merge as parent lineage; do not confuse current main with the deploy identity that first delivered the fix.

- [ ] **Step 1: Add two structured PROVEN learning records with fingerprints exactly:** `homepage-hero-video-autoplay-lifecycle-recovery-v1` and `github-required-test-synthetic-merge-ref-status-gap-v1`.
- [ ] **Step 2: Add the canary evidence record containing source refs, outcome, architecture mapping, rollback and expected Brain refs. Do not invent BG168/BG166/BG167 execution IDs before they exist.**
- [ ] **Step 3: Test repository reconstruction.**

```js
assert.equal(canary.source_refs.find(x=>x.kind==='pull_request').id,'1159');
assert.equal(canary.source_refs.find(x=>x.kind==='production_deploy').deploy_id,'6a9fe513a7af0e0008661320');
assert.equal(canary.outcome.status,'success');
assert.equal(canary.readback.state==='verified'||canary.writeback.state==='blocked',true);
```

- [ ] **Step 4: When Make runtime is executable, dispatch this exact canary once through BG168, verify BG166 persistence, then query BG167 by event ID/fingerprint. Update only execution-reference fields after real evidence exists.**
- [ ] **Step 5: Run `node scripts/brain/chat-learning-preflight.mjs` and `node scripts/brain/test-all.mjs`; both must pass.**

### Task 9: CI, Documentation Projection, PR and Production Closure

**Files:**
- Modify: `.github/workflows/brain-foundation-verify.yml` only if new paths are not already covered. Current `brain/**`, `scripts/brain/**`, `tests/brain/**` coverage should make an extra workflow unnecessary.
- Modify: `AGENTS.md` with one concise mandatory completion rule referencing Universal Knowledge Capture; do not duplicate the full spec.
- Add/update the relevant Notion Direct Knowledge Base, Architecture Runbook, Error Register and Master Build/Go-Live Register after implementation evidence exists.

- [ ] **Step 1: Run local/full repository verification.**

Run: `node scripts/brain/test-all.mjs`

Expected: all Brain script and chat/whole-brain tests PASS.

- [ ] **Step 2: Verify no existing contract was weakened.** Confirm `brain/contracts/completion-gate-v1.json` still rejects merge-only/CI-only/HTTP-2xx-only proof and `brain/contracts/adapter-conformance-v1.json` still requires capacity, execution proof, exact revision, rollback and whole-Brain lineage.
- [ ] **Step 3: Open one implementation PR from an isolated implementation branch based on the latest `main`; do not implement on the docs-only design branch.**
- [ ] **Step 4: Require the normal protected `test` context plus Brain foundation gates on the exact head. Do not rerun unrelated suites to treat a status-publication issue.**
- [ ] **Step 5: Merge only the exact green head.**
- [ ] **Step 6: Verify Netlify production only if website/runtime assets changed; otherwise verify the Brain/API runtime or Make execution identities that this change actually affects.**
- [ ] **Step 7: Update Notion projections with actual PR/SHA/Make execution/readback refs, then read them back. Documentation without source evidence remains open.
- [ ] **Step 8: Close Universal Knowledge Capture v1 only when the homepage-video canary is either `readback.state=verified` through BG167 or explicitly `BLOCKED` with one deduplicated replay obligation and owner.**

## Implementation Order and Independence

Tasks 1–4 are repository-only and may be implemented/reviewed independently in isolated worktrees once Task 1 establishes the shared event contract. Task 5 is the Make runtime integration and must consume the exact contract produced by Tasks 1–4. Tasks 6–7 depend on the event contract but may proceed while Make is externally blocked. Task 8 is the integration canary. Task 9 is the final release/documentation closure.

Do not create a second learning service to work around a temporarily paused Make runtime. Keep exactly one blocked replay obligation and resume through BG168 → BG166 → BG167 when runtime evidence allows it.
