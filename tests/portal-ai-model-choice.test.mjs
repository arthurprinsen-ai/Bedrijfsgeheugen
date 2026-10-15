import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const parse=path=>JSON.parse(read(path));
const catalog=parse('data/ai-model-catalog-v1.json');
const supplier=parse('data/ai-model-supplier-status-v1.json');
const governance=parse('data/ai-provider-governance-v1.json');

test('all 110 supplier statuses match individual catalog identities, with no synthetic approval',()=>{
 assert.equal(catalog.models.length,110);
 const ids=catalog.models.map(model=>model.id);
 assert.equal(new Set(ids).size,110);
 assert.deepEqual(Object.keys(supplier.records).sort(),[...ids].sort());
 assert.equal(Object.keys(supplier.records).length,110);
 assert.equal(Object.values(supplier.records).filter(x=>x==='VERIFIED').length,83);
 assert.equal(Object.values(supplier.records).filter(x=>x==='PARTIAL').length,26);
 assert.equal(Object.values(supplier.records).filter(x=>x==='CONFLICT').length,1);
 const unresolved=catalog.models.filter(x=>supplier.records[x.id]!=='VERIFIED');
 assert.equal(unresolved.length,27);
 for(const model of unresolved)assert.notEqual(model.supplier_audit?.automatic_recommendation_eligible,true,model.id);
});

test('provider governance is route-specific and no unknown route becomes sovereign by default',()=>{
 assert.ok(governance.providers.length>0);
 for(const p of governance.providers){
  assert.ok(p.provider);
  assert.ok(Array.isArray(p.paths)&&p.paths.length>0,p.provider);
  for(const route of p.paths){
   assert.ok(route.id);
   assert.ok(route.storage_residency);
   assert.ok(route.inference_residency);
   assert.ok(route.sovereignty_level);
   assert.match(route.source,/^https:\/\//);
  }
 }
});

test('customer navigation exposes model choice in canonical group and the Data & AI hub',()=>{
 const nav=read('portal-v2/page-registry.js');
 const hub=read('portal-v2/hubs.js');
 const page=read('portal-v2/page-shell.js');
 const plan=read('portal-v2/plan-access.js');
 assert.match(nav,/'ai-modelkeuze':\{label:'AI-modellen kiezen'\}/);
 assert.match(nav,/'ai-capabilities','ai-modelkeuze','data-ai-passport'/);
 assert.match(hub,/'ai-capabilities','ai-modelkeuze','data-ai-passport'/);
 assert.match(page,/mountAiModelChoice/);
 assert.match(page,/pageId==='ai-modelkeuze'/);
 assert.match(plan,/'ai-modelkeuze':'starter'/);
});

test('the customer can request any model but never activate inference via a preference alone',()=>{
 const ui=read('portal-v2/modules/ai-model-choice.js');
 assert.match(ui,/catalog\.models\.length!==110/);
 assert.match(ui,/snapshot\.records/);
 assert.match(ui,/requestState:'review_only_not_activated'/);
 assert.match(ui,/domainState\.set\('portal\.aiModelPreferences',payload\)/);
 assert.match(ui,/domainState\.set\('sourceMeta\.updatedAt',payload\.updatedAt\)/);
 assert.match(ui,/await domainState\.flush\(\)/);
 assert.match(ui,/TENANT_READBACK_MISMATCH/);
 assert.match(ui,/s\?\.mode==='empty'/);
 assert.match(ui,/!stateClient\?\.isDemo/);
 assert.match(ui,/CONFLICT/);
 assert.match(ui,/PARTIAL/);
 assert.match(ui,/source/);
 assert.match(ui,/eu-storage/);
 assert.match(ui,/eu-both/);
 assert.match(ui,/strict/);
 assert.match(ui,/EU AI Act/);
 assert.match(ui,/inference_residency/);
 assert.match(ui,/storage_residency/);
 assert.doesNotMatch(ui,/fetch\(['"]https:\/\/(?:api\.|bedrock-runtime)/);
});
