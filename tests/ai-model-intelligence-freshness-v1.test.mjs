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


test('Bedrock catalog keeps provider API IDs separate from internal labels and blocks EOL models',()=>{
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const amazon=c.models.filter(x=>x.provider==='Amazon');
 assert.equal(amazon.length,13);
 for(const m of amazon){
  assert.match(m.provider_model_id,/^amazon\.[a-z0-9-]+/);
  assert.match(m.source,/^https:\/\/docs\.aws\.amazon\.com\//);
  assert.equal(m.claim_evidence.model_identity.provider_model_id,m.provider_model_id);
 }
 for(const [id,date] of [
   ['amazon-nova-sonic','2026-09-14'],
   ['amazon-nova-canvas','2026-09-30'],
   ['amazon-nova-reel','2026-09-30']
 ]){
  const m=c.models.find(x=>x.id===id);
  assert.equal(m.status,'retired');
  assert.equal(m.selection_eligible,false);
  assert.equal(m.eol_date,date);
  assert.equal(m.claim_evidence.lifecycle.state,'EOL_REMOVED_IN_LISTED_REGIONS');
 }
});


test('Mistral models use verified hosted API IDs and no duplicate aliases for new selections',()=>{
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const verified={
  'mistral-medium-3-5':'mistral-medium-3-5',
  'mistral-large-3':'mistral-large-2512',
  'mistral-small-4':'mistral-small-2603',
  'ministral-3-8b':'ministral-8b-2512',
  'mistral-ocr-3':'mistral-ocr-2512',
  'voxtral-tts':'voxtral-mini-tts-2603',
  'voxtral-mini-transcribe-2':'voxtral-mini-2602',
  'voxtral-mini-transcribe-realtime':'voxtral-mini-transcribe-realtime-2602',
  'voxtral-small':'voxtral-small-2507',
  'mistral-moderation-2':'mistral-moderation-2603',
  'zai-glm-5.3':'zai-glm-5-3',
  'zai-glm-5.2':'zai-glm-5-2',
  'leanstral-1.5':'labs-leanstral-1-5',
  'mistral-ocr-4.0':'mistral-ocr-4-0'
 };
 for(const [id,api] of Object.entries(verified)){
  const m=c.models.find(x=>x.id===id);
  assert.ok(m,id);
  assert.equal(m.provider_model_id,api,id);
  assert.match(m.source,/^https:\/\/docs\.mistral\.ai\/models\//);
  assert.equal(m.claim_evidence.model_identity.provider_model_id,api);
  assert.equal(m.claim_evidence.provider_contracts.status,'UNVERIFIED_REQUIRES_AUTHORIZED_CONTRACT');
 }
 const alias=c.models.find(x=>x.id==='mistral-medium-3.5');
 assert.equal(alias.selection_eligible,false);
 assert.equal(alias.duplicate_of,'mistral-medium-3-5');
 const shield=c.models.find(x=>x.id==='shieldstral-1');
 assert.equal(shield.selection_eligible,false);
 assert.equal(shield.provider_model_id,null);
 const glm=c.models.find(x=>x.id==='zai-glm-5.3');
 assert.deepEqual([glm.input_usd_m,glm.cached_input_usd_m,glm.output_usd_m],[1.4,0.14,4.4]);
});


test('publisher families are not mistaken for deployable model IDs; Falcon has a specific licensed card',()=>{
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 for(const id of ['llama-open-weight','qwen-open-weight']){
  const m=c.models.find(x=>x.id===id);
  assert.equal(m.record_kind,'model_family');
  assert.equal(m.selection_eligible,false);
  assert.equal(m.claim_evidence.model_identity.status,'NOT_A_SINGLE_DEPLOYABLE_MODEL_ID');
 }
 const falcon=c.models.find(x=>x.id==='falcon-h1r-7b');
 assert.equal(falcon.provider_model_id,'tiiuae/Falcon-H1R-7B');
 assert.equal(falcon.claim_evidence.license.value.startsWith('Falcon-LLM License'),true);
});


test('supplier identity receipts are internally consistent, source-aligned and do not certify missing claims',async()=>{
 const {createHash}=await import('node:crypto');
 const raw=fs.readFileSync('data/ai-model-catalog-v1.json');
 const c=JSON.parse(raw.toString('utf8'));
 const evidence=JSON.parse(fs.readFileSync('data/evidence/ai-model-official-sources-2026-10-14.json','utf8'));
 const catalogBlobSha=createHash('sha1').update('blob '+raw.byteLength+String.fromCharCode(0)).update(raw).digest('hex');
 assert.equal(evidence.audited_catalog_blob_sha,catalogBlobSha,
   'Evidence must be regenerated whenever the catalog changes');
 assert.equal(evidence.models_checked,c.models.length);
 assert.equal(evidence.receipts.length,c.models.length);
 const models=new Map(c.models.map(m=>[m.id,m]));
 assert.equal(models.size,c.models.length);
 for(const receipt of evidence.receipts){
   const m=models.get(receipt.model_id);
   assert.ok(m,'Unknown model receipt: '+receipt.model_id);
   assert.equal(receipt.source_url,m.source,receipt.model_id);
   assert.equal(receipt.full_model_verification_granted,false,receipt.model_id);
   assert.equal(receipt.customer_dpa_verified,false,receipt.model_id);
   assert.equal(receipt.customer_runtime_residency_verified,false,receipt.model_id);
 }
 const idMentions=evidence.receipts.filter(r=>r.status==='OFFICIAL_PAGE_MODEL_ID_MENTION').length;
 const idMissing=evidence.receipts.filter(r=>r.status==='OFFICIAL_PAGE_NO_EXACT_MODEL_ID').length;
 const apiIdMentions=evidence.receipts.filter(r=>r.status==='OFFICIAL_PAGE_API_ID_MENTION').length;
 const fetchFailures=evidence.receipts.filter(r=>r.status==='SOURCE_FETCH_FAILED').length;
 assert.equal(idMentions,evidence.model_id_mentions);
 assert.equal(idMissing,evidence.model_id_not_explicit);
 const publisherFamilies=evidence.receipts.filter(r=>r.status==='PUBLISHER_FAMILY_REFERENCE_NOT_MODEL_ID').length;
 assert.equal(publisherFamilies,evidence.non_deployable_family_references);
 assert.equal(apiIdMentions,evidence.provider_api_id_mentions);
 assert.equal(idMentions+idMissing+apiIdMentions+publisherFamilies+fetchFailures,c.models.length);
 for(const receipt of evidence.receipts.filter(r=>r.status==='PUBLISHER_FAMILY_REFERENCE_NOT_MODEL_ID')){
  const item=models.get(receipt.model_id);
  assert.equal(item?.record_kind,'model_family');
  assert.equal(item?.selection_eligible,false);
  assert.equal(receipt.identity_claim_verified,false);
  assert.equal(receipt.family_reference_only,true);
 }
 assert.equal(fetchFailures,evidence.model_source_fetch_failed);
 for(const row of evidence.receipts.filter(r=>r.status==='OFFICIAL_PAGE_API_ID_MENTION')){
  assert.ok(row.provider_api_id,'Provider API mention requires a concrete provider API identifier');
  assert.equal(row.provider_api_id_mentioned_in_document,true);
 }
 const sources=new Set(c.models.map(m=>m.source));
 assert.equal(evidence.source_urls_checked,sources.size);
 assert.equal(evidence.source_urls_retrieved,sources.size-evidence.unavailable_sources);
 assert.equal(evidence.total_unique_source_documents_checked,Object.keys(evidence.source_checks).length);
 assert.equal(evidence.supplemental_source_urls_checked,
   Object.keys(evidence.source_checks).filter(url=>!sources.has(url)).length);
 assert.equal(evidence.unavailable_sources,
   Object.values(evidence.source_checks).filter(x=>x.state!=='FETCHED').length);
 for(const receipt of evidence.receipts.filter(r=>r.status==='OFFICIAL_PAGE_NO_EXACT_MODEL_ID')){
  const item=models.get(receipt.model_id);
  assert.equal(item?.record_kind,'model_family',
   'Unverified deployable model identity: '+receipt.model_id);
  assert.equal(item?.selection_eligible,false,receipt.model_id);
 }
 const countedByProvider={};
 for(const receipt of evidence.receipts){
  const p=countedByProvider[receipt.provider]??={total:0,identity_mentions:0,provider_api_id_mentions:0,
   family_references:0,no_exact_id:0,fetch_failed:0,not_run:0};
  p.total++;
  switch(receipt.status){
   case 'OFFICIAL_PAGE_MODEL_ID_MENTION':p.identity_mentions++;break;
   case 'OFFICIAL_PAGE_API_ID_MENTION':p.provider_api_id_mentions++;break;
   case 'PUBLISHER_FAMILY_REFERENCE_NOT_MODEL_ID':p.family_references++;break;
   case 'OFFICIAL_PAGE_NO_EXACT_MODEL_ID':p.no_exact_id++;break;
   case 'SOURCE_FETCH_FAILED':p.fetch_failed++;break;
   default:p.not_run++;break;
  }
 }
 assert.deepEqual(evidence.by_provider,countedByProvider,
  'Provider totals must reconcile with exactly one category per catalog record');
 assert.equal(evidence.whole_model_verifications_added,0);
});
