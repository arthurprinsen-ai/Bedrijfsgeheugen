import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const json=path=>JSON.parse(read(path));

test('all 110 catalogue records have published explicit review status; never imply runtime approval',()=>{
 const catalog=json('data/ai-model-catalog-v1.json');
 const snapshot=json('portal-v2/ai-model-supplier-status-v1.json');
 assert.equal(catalog.models.length,110);
 assert.equal(new Set(catalog.models.map(m=>m.id)).size,110);
 assert.deepEqual(Object.keys(snapshot.records).sort(),catalog.models.map(m=>m.id).sort());
 const statuses=Object.values(snapshot.records);
 assert.equal(statuses.filter(x=>x==='VERIFIED').length,83);
 assert.equal(statuses.filter(x=>x==='PARTIAL').length,26);
 assert.equal(statuses.filter(x=>x==='CONFLICT').length,1);
 assert.equal(snapshot.records['amazon-nova-premier'],'CONFLICT');
 assert.match(snapshot.scope,/not customer entitlement/);
});

test('one canonical protected page exposes model preferences and full tenant-scoped supplier research',()=>{
 const registry=read('portal-v2/page-registry.js');
 const shell=read('portal-v2/page-shell.js');
 const plan=read('portal-v2/plan-access.js');
 assert.match(registry,/'ai-modelkeuze'/);
 assert.match(shell,/mountAiModelChoice/);
 assert.match(shell,/PROTECTED_TRUST_PAGES=[^\n]*'ai-modelkeuze'/);
 assert.match(plan,/'ai-modelkeuze':'pro'/);
});

test('model choice remains a wishlist only, with explicit save/readback and no runtime activation',()=>{
 const client=read('portal-v2/modules/ai-model-choice.js');
 assert.match(client,/requestState:'review_only_not_activated'/);
 assert.match(client,/domainState\.set\('portal\.aiModelPreferences'/);
 assert.match(client,/await domainState\.flush\(\)/);
 assert.match(client,/domainState\.get\('portal\.aiModelPreferences'\)/);
 assert.match(client,/getSnapshot/);
 assert.match(client,/isDemo/);
 assert.match(client,/MODEL_CATALOG_INCOMPLETE/);
 assert.match(client,/snapshot\.records/);
 assert.match(client,/sovereignty_level/);
 assert.match(client,/inference_residency/);
 assert.match(client,/storage_residency/);
 assert.match(client,/aiRisk/);
 // The wishlist must not invoke a provider; only the explicit user-clicked
 // smoke test may POST to the separately authenticated, fail-closed tenant gateway.
 assert.match(client,/trialButton\.addEventListener\('click'/);
 assert.match(client,/fetchImpl\('\/api\/tenant-ai-inference'/);
 assert.match(client,/if\(dirty\)/);
 assert.match(client,/draft\.assignments\.brain/);
 assert.doesNotMatch(client,/fetchImpl\(['"]https:\/\/(?:api\.|bedrock-runtime)/);
});

test('AI sovereignty labels are provider route specific; nothing in catalog is falsely EU certified',()=>{
 const governance=json('data/ai-provider-governance-v1.json');
 const client=read('portal-v2/modules/ai-model-choice.js');
 assert.equal(governance.providers.length>0,true);
 assert.equal(governance.providers.every(p=>Array.isArray(p.paths)&&p.paths.length>0),true);
 assert.match(client,/geen bewijs van klantcontract/);
 assert.match(client,/Een EU-datacenter is niet hetzelfde als volledige datasoevereiniteit/);
 assert.match(client,/EU AI Act:/);
 assert.match(client,/per concrete toepassing/);
 assert.match(client,/nooit automatische aansluiting of uitvoering/);
});
