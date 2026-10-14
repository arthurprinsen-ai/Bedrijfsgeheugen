import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('AI model catalog recovery is evidence-scoped and avoids false verification', () => {
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 assert.equal(c.models.length,110);
 assert.equal(new Set(c.models.map(m=>m.id)).size,c.models.length);
 for(const m of c.models){
  assert.match(m.source,/^https:\/\//);
  assert.ok(m.verified_at);
 }
 const astra=c.models.find(m=>m.id==='gpt-6-astra');
 assert.equal(astra.input_usd_m,10);
 assert.equal(astra.output_usd_m,50);
 assert.equal(astra.cached_input_usd_m,1);
 const governance=astra.verification_evidence?.claim_evidence?.filter(r=>r.claim==='governance')||[];
 const providerOnly=governance.every(r=>r.verification_status==='PROVIDER_POLICY_OBSERVED_TENANT_UNVERIFIED'||
  String(r.scope??'').includes('NOT model-specific'));
 if(providerOnly){
  assert.notEqual(astra.verification_evidence?.claim_scope,'full','Provider policy alone cannot certify full model governance');
  assert.equal(astra.supplier_audit?.claim_evidence_classification?.governance,'PROVIDER_BASELINE_ONLY_NOT_MODEL_PROOF');
 }
 assert.ok(c.models.some(m=>m.verified_at==='2026-09-30'),'Do not restamp unverified models');
});

test('catalog audit requires byte-equivalent semantic production readback when release URL is set',()=>{
 const audit=fs.readFileSync('tests/ai-model-catalog-evidence-audit.mjs','utf8');
 assert.match(audit,/MODEL_CATALOG_PRODUCTION_URL/);
 assert.match(audit,/MODEL_CATALOG_REQUIRE_PRODUCTION_READBACK/);
 assert.match(audit,/PRODUCTION_URL_REQUIRED/);
 assert.match(audit,/CATALOG_CONTENT_MISMATCH/);
 assert.match(audit,/production_readback\.status = 'MATCH'/);
 assert.match(audit,/createHash\('sha256'\)/);
 assert.match(audit,/process\.exitCode = 2/);
});

test('model advisor rejects EOL and family placeholders even when active-only filter is off',()=>{
 const html=fs.readFileSync('ai-modelwijzer.html','utf8');
 assert.match(html,/m\.status==='eol'\|\|m\.auto_recommendation_eligible===false\|\|m\.record_kind==='model_family_placeholder'/);
 const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 for(const m of catalog.models.filter(x=>x.status==='eol'||x.record_kind==='model_family_placeholder'))
   assert.notEqual(m.auto_recommendation_eligible,true);
});

test('supplier source classifications remain fail-closed across all model records',async()=>{
 const { classifySupplierClaim, REQUIRED_SUPPLIER_CLAIMS }=await import('./ai-model-supplier-evidence-worklist.mjs');
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 
 let count=0;
 for(const m of c.models){
  const pending=[];
  for(const claim of REQUIRED_SUPPLIER_CLAIMS){
   const observed=classifySupplierClaim(m.verification_evidence,claim);
   assert.equal(m.supplier_audit?.claim_evidence_classification?.[claim],observed,m.id+'/'+claim);
   if(observed!=='MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED')pending.push(claim);
   count++;
  }
  assert.deepEqual(m.supplier_audit.missing_claim_receipts,pending,m.id+' evidence needs reconciliation');
  assert.equal(m.supplier_audit.automatic_recommendation_eligible,false);
 }
 assert.equal(count,660);
});

test('public advisor cannot recommend catalog-full models without independent audit approval',()=>{
 const html=fs.readFileSync('ai-modelwijzer.html','utf8');
 assert.match(html,/m\.supplier_audit\?\.automatic_recommendation_eligible!==true/);
 assert.match(html,/m\.supplier_audit\?\.independent_verification_required===true/);
 const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 for(const m of catalog.models.filter(x=>x.verification_evidence?.claim_scope==='full')) {
  if(m.supplier_audit?.independent_verification_required===true)
   assert.equal(m.supplier_audit?.automatic_recommendation_eligible,false,m.id);
 }
});

test('advisor excludes incomplete pricing and generic supplier policy as complete evidence',()=>{
 const html=fs.readFileSync('ai-modelwijzer.html','utf8');
 assert.match(html,/PROVIDER_POLICY_OBSERVED_TENANT_UNVERIFIED/);
 assert.match(html,/NOT model-specific/);
 assert.match(html,/HISTORICAL\|PARTIAL\|EXAMPLE\|UNKNOWN\|BASIS_ONLY/);
 assert.match(html,/automatic_recommendation_eligible!==true/);
});

test('advisor explains unverified recommendations rather than concealing the audit hold',()=>{
 const html=fs.readFileSync('ai-modelwijzer.html','utf8');
 assert.match(html,/Geen automatisch geverifieerde aanbeveling beschikbaar/);
 assert.match(html,/De onafhankelijke leveranciersaudit is nog niet volledig afgerond/);
});

test('Cohere aliases resolve to official API IDs without granting supplier or tenant approval',()=>{
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const byId=new Map(c.models.map(m=>[m.id,m]));
 for(const [id,expected] of Object.entries({
  'command-a':'command-a-03-2025',
  'command-a-plus':'command-a-plus-05-2026',
  'command-a-plus-05-2026':'command-a-plus-05-2026'
 })){
  const m=byId.get(id);
  assert.equal(m.provider_api_id,expected);
  assert.ok(m.modalities.includes('image'));
  assert.equal(m.supplier_audit.automatic_recommendation_eligible,false);
 }
 const a=byId.get('command-a');
 assert.equal(a.context_k,256);
 assert.equal(a.input_usd_m,2.5);
 assert.equal(a.output_usd_m,10);
 const plus=byId.get('command-a-plus-05-2026');
 assert.equal(plus.context_k,128);
 assert.equal(plus.input_usd_m,null);
 assert.equal(plus.output_usd_m,null);
});

test('advisor does not recommend aliases with a separate canonical API model record',()=>{
 const html=fs.readFileSync('ai-modelwijzer.html','utf8');
 assert.match(html,/m\.provider_api_id&&catalog\.models\.some\(other=>other!==m&&other\.provider===m\.provider&&other\.id===m\.provider_api_id/);
 const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const aliases=catalog.models.filter(m=>m.provider_api_id&&catalog.models.some(other=>other!==m&&other.provider===m.provider&&other.id===m.provider_api_id&&other.provider_api_id===m.provider_api_id));
 assert.ok(aliases.some(m=>m.id==='command-a-plus'),'The Cohere friendly label must not count as a distinct API model');
 for(const m of aliases)assert.notEqual(m.supplier_audit?.automatic_recommendation_eligible,true);
});

test('Cohere remaining official API mappings remain fail-closed',()=>{
 const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 assert.equal(catalog.models.length,110);
 const byId=new Map(catalog.models.map(m=>[m.id,m]));
 const expected={
  'command-a':'command-a-03-2025',
  'command-a-plus':'command-a-plus-05-2026',
  'command-a-plus-05-2026':'command-a-plus-05-2026',
  'command-a-reasoning-08-2025':'command-a-reasoning-08-2025',
  'embed-4':'embed-v4.0',
  'embed-multilingual-v3.0':'embed-multilingual-v3.0',
  'rerank-4-pro':'rerank-v4.0-pro'
 };
 for(const [id,api] of Object.entries(expected)){
  const m=byId.get(id);
  assert.equal(m.provider_api_id,api,id);
  assert.equal(m.supplier_audit.automatic_recommendation_eligible,false,id);
  assert.ok(m.verification_evidence.claim_evidence.some(e=>e.claim==='model_id'&&e.observed_value.includes(api)),id);
 }
 const r=byId.get('command-a-reasoning-08-2025');
 assert.equal(r.context_k,256);
 assert.equal(r.max_output_tokens,32000);
 assert.ok(r.modalities.includes('image'));
});

test('supplier identity audit stays a scoped verification artifact without implying release acceptance',()=>{
 const artifact='tests/ai-model-supplier-identity-content-audit-20261014.json';
 const policy=JSON.parse(fs.readFileSync('config/brain-delivery-system.json','utf8'));
 assert.ok(fs.existsSync(artifact),'The immutable supplier-source review report must exist');
 assert.ok(artifact.startsWith('tests/'),'Verification-only evidence must live in the tests namespace');
 assert.ok(!policy.lanes.some(lane=>(lane.paths||[]).some(path=>path==='data/ai-model-supplier-'||path==='data/')),'No broad supplier evidence bypass in delivery lanes');
 const report=JSON.parse(fs.readFileSync(artifact,'utf8'));
 const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 assert.equal(report.summary.total_models,110);
 assert.equal(report.summary.model_records_reviewed,110);
 assert.equal(report.records.length,110);
 assert.equal(new Set(report.records.map(item=>item.model_id)).size,110);
 assert.deepEqual(new Set(report.records.map(item=>item.model_id)),new Set(catalog.models.map(item=>item.id)));
 assert.equal(report.summary.independent_full_claim_review_completed,false,
  'Model identity/source reviews do not constitute six-claim supplier verification');
});
