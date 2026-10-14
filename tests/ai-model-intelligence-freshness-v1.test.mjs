import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('AI model catalog v2 is fresh, source-backed, broad and governance-explicit',()=>{
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 assert.ok(c.models.length>=100);
 assert.ok(new Set(c.models.map(m=>m.provider)).size>=10);
 for(const m of c.models){
   assert.match(m.source,/^https:\/\//);
   assert.ok(m.jurisdiction);
   assert.ok(m.verified_at);
   const age=(Date.now()-new Date(m.verified_at+'T00:00:00Z'))/86400000;
   assert.ok(age<=14,`${m.id} verification is stale`);
   assert.ok(Array.isArray(m.limitations));
   assert.ok(m.governance);
   assert.ok(Object.prototype.hasOwnProperty.call(m.governance,'storage_residency'));
   assert.ok(Object.prototype.hasOwnProperty.call(m.governance,'inference_residency'));
   assert.ok(Object.prototype.hasOwnProperty.call(m,'eu_processing'));
   assert.ok(Object.prototype.hasOwnProperty.call(m,'eu_storage'));
 }
 const strengths=c.models.flatMap(m=>m.strengths||[]).join(' ').toLowerCase();
 assert.match(strengths,/image generation/);
 assert.match(strengths,/ocr/);
 assert.match(strengths,/embedding/);
 assert.match(strengths,/moderation/);
 assert.ok(c.models.some(m=>(m.modalities||[]).includes('audio')));
 assert.ok(c.models.some(m=>(m.modalities||[]).includes('video')));
 assert.ok(c.models.some(m=>m.self_host===true));
});

test('official price evidence is tier-explicit and cannot refresh whole-model verification by itself',()=>{
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const prices={
  'gpt-6-astra':[10,1,50],
  'gpt-6-sol':[2,0.2,10],
  'gpt-6-luna':[0.1,0.01,0.5],
  'gpt-6.1-sol':[2,0.1,10]
 };
 for(const [id,[input,cached,output]] of Object.entries(prices)){
  const m=c.models.find(x=>x.id===id);
  assert.ok(m,id);
  assert.equal(m.pricing_tier,'standard_short_context');
  assert.equal(m.input_usd_m,input,id);
  assert.equal(m.cached_input_usd_m,cached,id);
  assert.equal(m.output_usd_m,output,id);
  assert.equal(m.claim_evidence?.pricing_short_context?.status,'PROVIDER_DOC_CONFIRMED');
  assert.equal(m.claim_evidence?.provider_contracts?.status,'UNVERIFIED_REQUIRES_AUTHORIZED_CONTRACT');
  assert.notEqual(m.verified_at,m.pricing_source_verified_at,'Price evidence must not silently approve complete model');
 }
 for(const [id,cache] of [['claude-opus-5-5',0.2],['claude-sonnet-5-5',0.1]]){
  const m=c.models.find(x=>x.id===id);
  assert.equal(m.cached_input_usd_m,cache,id);
  assert.equal(m.pricing_tier,'claude_api_direct');
 }
 const google=c.models.find(x=>x.id==='gemini-3.8-flash');
 assert.equal(google.context_tokens,1048576);
 assert.equal(google.input_usd_m,0.75);
 assert.equal(google.output_usd_m,3.75);
 assert.equal(google.pricing_tier,'introductory_2026');
});


test('deprecated Google Flash aliases cannot appear eligible for new routing',()=>{
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 for(const [id,replacement] of [
   ['gemini-3.5-flash','gemini-3.6-flash'],
   ['gemini-3.7-flash','gemini-3.8-flash']
 ]){
   const m=c.models.find(x=>x.id===id);
   assert.ok(m,id);
   assert.equal(m.status,'deprecated',id);
   assert.equal(m.selection_eligible,false,id);
   assert.equal(m.effective_model_id,replacement,id);
   assert.equal(m.claim_evidence.lifecycle.state,'DEPRECATED_AUTO_ROUTED',id);
 }
 assert.equal(
   c.models.find(x=>x.id==='gemini-2.5-flash-lite').new_project_access,
   'RESTRICTED_EXISTING_USERS'
 );
});


test('provider deprecation notices prevent recommending stale Mistral catalog entries',()=>{
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 for(const id of ['mistral-ocr-4.0','zai-glm-5.2','leanstral-1.5']){
  const m=c.models.find(x=>x.id===id);
  assert.ok(m,id);
  assert.equal(m.status,'deprecated',id);
  assert.equal(m.selection_eligible,false,id);
  assert.equal(m.claim_evidence.lifecycle.status,'PROVIDER_DOC_CONFIRMED',id);
 }
});
