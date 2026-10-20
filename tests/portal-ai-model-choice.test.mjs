import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const parse=path=>JSON.parse(read(path));
const catalog=parse('data/ai-model-catalog-v1.json');
const supplier=parse('portal-v2/ai-model-supplier-status-v1.json');
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
 assert.match(nav,/'ai-modelkeuze':\{label:'AI-modellen kiezen(?: & datasoevereiniteit)?'\}/);
 assert.match(nav,/'ai-capabilities','ai-modelkeuze','data-ai-passport'/);
 assert.match(hub,/'ai-capabilities','ai-modelkeuze','data-ai-passport'/);
 assert.match(page,/mountAiModelChoice/);
 assert.match(page,/pageId==='ai-modelkeuze'/);
 assert.match(plan,/'ai-modelkeuze':'pro'/);
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

test('six highlighted models are present and map to the advertised portal responsibilities',()=>{
 const src=read('portal-v2/modules/ai-model-choice.js');
 const highlights=['gpt-6-luna','gpt-6-sol','mistral-medium-3-5','gpt-oss-20b','mistral-ocr-3','text-embedding-3-small'];
 for(const id of highlights){
  assert.ok(catalog.models.some(m=>m.id===id),id);
  assert.equal(supplier.records[id],'VERIFIED',id);
  assert.ok(src.includes("'"+id+"'"),id);
 }
 for(const workload of ['brain','routine','analysis','documents','knowledge','sensitive']){
  assert.match(src,new RegExp("\\['"+workload+"','"));
 }
 assert.match(src,/schemaVersion:3,models:draft\.models,defaultModelId:draft\.defaultModelId,assignments:draft\.assignments/);
 assert.match(src,/JSON\.stringify\(readback\?\.assignments\)/);
 assert.match(src,/value\.policy:'eu-both'/);
 assert.match(src,/review_only_not_activated/);
});

test('customer may manually test only its saved Brain choice through verified tenant gateway',()=>{
 const source=read('portal-v2/modules/ai-model-choice.js');
 assert.match(source,/\/api\/tenant-ai-inference/);
 assert.match(source,/trialButton\.addEventListener\('click'/);
 assert.match(source,/if\(dirty\)/);
 assert.match(source,/draft\.assignments\.brain/);
 assert.match(source,/response\.ok&&result\?\.status==='ANSWERED'/);
 assert.match(source,/Geen fallback naar een andere provider/);
 assert.doesNotMatch(source,/\/api\/portaalvraag/);
});

test('one default model is shown above overrides, persists tenant-scoped, and never activates itself',()=>{
 const src=read('portal-v2/modules/ai-model-choice.js');
 assert.match(src,/Mijn standaard AI-model/);
 assert.match(src,/Standaardmodel voor mijn bedrijf/);
 assert.match(src,/defaultSelect\.addEventListener\('change'/);
 assert.match(src,/draft\.defaultModelId=id/);
 assert.match(src,/draft\.models\.push\(\{modelId:id,routeId:''\}\)/);
 assert.match(src,/defaultRoute\.addEventListener\('change'/);
 assert.match(src,/schemaVersion:3,models:draft\.models,defaultModelId:draft\.defaultModelId/);
 assert.match(src,/readback\?\.defaultModelId!==payload\.defaultModelId/);
 assert.match(src,/Gebruik standaardmodel waar geschikt/);
 assert.match(src,/financiële berekeningen/);
 assert.match(src,/requestState:'review_only_not_activated'/);
});

test('activation center shows a real tenant-scoped server checklist and never requests customer API keys',()=>{
 const src=read('portal-v2/modules/ai-model-choice.js');
 const api=read('netlify/functions/tenant-ai-activation-status.mjs');
 assert.match(src,/Model aansluiten en activeren/);
 assert.match(src,/Activering aanvragen/);
 assert.match(src,/Controleer aansluitstatus/);
 assert.match(src,/activationConsent\.checked/);
 assert.match(src,/portal\.aiModelActivationRequest/);
 assert.match(src,/requestState:'REQUESTED'/);
 assert.match(src,/requestedAt:new Date\(\)\.toISOString\(\)/);
 assert.match(src,/await domainState\.flush\(\)/);
 assert.match(src,/\/api\/tenant-ai-activation-status/);
 assert.match(src,/method:'GET',credentials:'same-origin'/);
 assert.match(src,/proof\?\.reviewRequested===true/);
 assert.match(src,/geen model geactiveerd/i);
 assert.doesNotMatch(src,/type=['"]password['"]/);
 assert.match(api,/resolveIdentityTenant\(user\)/);
 assert.match(api,/createEuPrimaryPortalStore/);
 assert.match(api,/evaluateTenantAiActivation|handleTenantAiActivationStatus/);
 assert.doesNotMatch(api,/signVerifiedRuntimeProof/);
});
