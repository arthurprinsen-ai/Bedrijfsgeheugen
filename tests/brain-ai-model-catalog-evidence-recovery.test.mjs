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
 assert.ok(!policy.lanes.some(lane=>(lane.paths||[]).some(path=>path==='data/ai-model-supplier-'||path==='data/ai-model-supplier-identity-content-audit-20261014.json')),'No supplier-specific delivery lane bypass or audit allowlist entry');
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

test('Google Gemini 3.1 Flash Image October 6 deprecation date matches official release notes',()=>{
 const models=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8')).models;
 const m=models.find(x=>x.id==='gemini-3.1-flash-image');
 const statuses=(m.verification_evidence?.claim_evidence||[]).filter(x=>x.claim==='status'&&x.url==='https://ai.google.dev/gemini-api/docs/changelog');
 assert.ok(statuses.length>0);
 for(const s of statuses){
  assert.doesNotMatch(s.locator||'',/October 8,? 2026/i);
  assert.doesNotMatch(s.observed_value||'',/2026-10-08/);
 }
 assert.equal(m.source_date_correction_20261014?.supplier_announcement_date,'2026-10-06');
 assert.equal(m.supplier_audit?.automatic_recommendation_eligible,false);
});

test('Nova Premier official API ID remains separate from authenticated lifecycle clearance',()=>{
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const m=c.models.find(x=>x.id==='amazon-nova-premier');
 assert.equal(m.provider_api_id,'amazon.nova-premier-v1:0');
 assert.equal(m.status,'eol');
 assert.equal(m.supplier_audit.automatic_recommendation_eligible,false);
 assert.notEqual(m.verification_evidence.claim_scope,'full');
 assert.ok(m.verification_evidence.claim_evidence.some(r=>r.claim==='model_id'&&r.observed_value==='amazon.nova-premier-v1:0'));
});


test('110 catalog records with explicit aliases must not be presented as 110 independent model offerings',()=>{
 const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 assert.equal(catalog.models.length,110);
 const offerings=new Map();
 for(const m of catalog.models){
  const canonical=m.provider_api_id||m.canonical_model_id||m.id;
  const key=JSON.stringify([m.provider,canonical]);
  const group=offerings.get(key)||[];
  group.push(m);
  offerings.set(key,group);
 }
 const duplicated=[...offerings.values()].filter(group=>group.length>1);
 const observed=duplicated.map(group=>group.map(m=>m.id).sort().join('|')).sort();
 assert.deepEqual(observed,[
  'command-a-plus|command-a-plus-05-2026',
  'mistral-medium-3-5|mistral-medium-3.5'
 ],'Unexpected canonical provider/API identity collision must be reviewed, not silently double-counted');
 assert.equal(offerings.size,108,'110 catalog records include two explicit aliases, not 110 distinct model offerings');
 for(const group of duplicated){
  const canonical=group.find(m=>m.id===(m.provider_api_id||m.canonical_model_id||m.id));
  assert.ok(canonical,'A duplicate group must contain its canonical API model record');
  for(const alias of group.filter(m=>m!==canonical)){
   assert.equal(alias.alias_of||alias.canonical_model_id,canonical.id);
   assert.equal(alias.supplier_audit?.automatic_recommendation_eligible,false,
    'Aliases may never become a second automatic customer recommendation');
  }
 }
});

test('audio-minute model prices retain their units and do not enter token-cost projections',()=>{
 const models=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8')).models;
 const expected={'gpt-realtime-translate':0.034,'gpt-live-transcribe':0.017,'gpt-realtime-whisper':0.017};
 for(const [id,rate] of Object.entries(expected)){
  const m=models.find(x=>x.id===id);
  assert.ok(m,'Missing model '+id);
  assert.equal(m.pricing_basis?.unit,'audio_minute');
  assert.equal(m.pricing_basis?.usd_per_minute,rate);
  assert.equal(m.input_usd_m,null);
  assert.equal(m.output_usd_m,null);
  assert.ok(['partial','full'].includes(m.verification_evidence?.claim_scope),id+': supplier claim scope must be explicit');
  if(m.verification_evidence?.claim_scope==='full'){
   assert.equal(m.verification_evidence?.checked_on,m.verified_at,id+': full supplier receipt dates must reconcile');
   assert.deepEqual(m.verification_evidence?.not_verified||[],[],id+': no contradictory supplier verified flags');
  }
  assert.equal(m.supplier_audit?.independent_verification_required,true,id+': public receipts do not grant independent acceptance');
  assert.equal(m.supplier_audit?.automatic_recommendation_eligible,false);
 }
 const html=fs.readFileSync('ai-modelwijzer.html','utf8');
 assert.match(html,/function priceDescriptor\(m\)/);
 assert.match(html,/basis\.unit==='audio_minute'/);
 assert.match(html,/basis\.usd_per_minute\.toFixed\(3\)/);
 assert.match(html,/if\(m\.input_usd_m==null\|\|m\.output_usd_m==null\)return null/);
});

test('audio price display is unit-aware in both catalog and advisor, without token projections', async()=>{
 const {runInNewContext}=await import('node:vm');
 const models=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8')).models;
 const html=fs.readFileSync('ai-modelwijzer.html','utf8');
 const start=html.indexOf('function priceDescriptor(m){');
 const end=html.indexOf('function governanceBadges(m){',start);
 assert.ok(start>=0&&end>start,'Modelwijzer pricing functions must be present');
 const scope={
  $:id=>({tasks:{value:'100'},inputTokens:{value:'1000'},outputTokens:{value:'1000'}}[id]),
 };
 runInNewContext(html.slice(start,end),scope,{timeout:1000});
 assert.equal(typeof scope.priceDescriptor,'function');
 assert.equal(typeof scope.monthlyCost,'function');
 for(const [id,rate] of Object.entries({
  'gpt-realtime-translate':0.034,
  'gpt-live-transcribe':0.017,
  'gpt-realtime-whisper':0.017
 })){
  const model=models.find(m=>m.id===id);
  assert.ok(model,id);
  assert.equal(model.pricing_basis?.unit,'audio_minute',id);
  assert.equal(model.pricing_basis.usd_per_minute,rate,id);
  assert.equal(scope.monthlyCost(model),null,'Audio minutes must not be projected as text tokens: '+id);
  assert.match(scope.priceDescriptor(model),new RegExp('USD '+rate.toFixed(3)+' per audiominuut'),id);
  assert.doesNotMatch(scope.priceDescriptor(model),/\/M|miljoen tokens/i,id);
 }
 const tokenModel=models.find(m=>m.input_usd_m!=null&&m.output_usd_m!=null);
 assert.ok(tokenModel);
 const projected=100*((1000/1e6)*tokenModel.input_usd_m+(1000/1e6)*tokenModel.output_usd_m);
 assert.ok(Math.abs(scope.monthlyCost(tokenModel)-projected)<1e-9);
 assert.match(html,/m\._cost==null\?priceDescriptor\(m\)/,'Advisor must display the audio unit when a verified model becomes recommendable');
 assert.match(html,/m\.input_usd_m!=null\?[^\n]*priceDescriptor\(m\)/,'Catalog cards must display the audio rate rather than a token rate');
});

test('GPT-Live and Voxtral audio rates remain duration-based with no synthetic token price',()=>{
 const models=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8')).models;
 const expected={'gpt-live-1':0.05,'voxtral-mini-transcribe-2':0.003,'voxtral-mini-transcribe-realtime':0.006};
 for(const [id,rate] of Object.entries(expected)){
  const m=models.find(m=>m.id===id);
  assert.ok(m,'Missing audio model '+id);
  assert.equal(m.pricing_basis?.unit,'audio_minute');
  assert.equal(m.pricing_basis?.usd_per_minute,rate);
  assert.equal(m.input_usd_m,null);
  assert.equal(m.output_usd_m,null);
  assert.equal(m.supplier_audit?.automatic_recommendation_eligible,false);
  assert.equal(m.supplier_audit?.public_minute_tariff_review_20261014?.customer_contract_verified,false);
 }
 const live=models.find(m=>m.id==='gpt-live-1');
 assert.equal(live.pricing_basis.billing_resolution,'second');
 assert.match(live.pricing_basis.additional_costs_or_conditions,/Backend/);
});


test('Mistral canonical API IDs and negative Labs governance remain non-recommendable',()=>{
 const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const byId=new Map(catalog.models.map(m=>[m.id,m]));
 const medium=byId.get('mistral-medium-3.5');
 assert.equal(medium.provider_api_id,'mistral-medium-3-5');
 assert.equal(medium.supplier_audit.automatic_recommendation_eligible,false);
 assert.ok(medium.verification_evidence.claim_evidence.some(r=>r.claim==='governance'&&r.url==='https://docs.mistral.ai/admin/monitor-comply/zero-data-retention'&&r.verification_status==='MODEL_ENDPOINT_POLICY_OFFICIAL_PUBLIC_SOURCE_VERIFIED_TENANT_UNVERIFIED'));
 const legacy=byId.get('zai-glm-5.2');
 assert.equal(legacy.provider_api_id,'zai-glm-5-2');
 assert.equal(legacy.status,'deprecated');
 assert.equal(legacy.verification_evidence.lifecycle_warning.retirement_date,'2026-10-31');
 assert.ok(legacy.verification_evidence.claim_evidence.some(r=>r.claim==='pricing'&&r.url==='https://docs.mistral.ai/inference/pricing'));
 assert.equal(legacy.supplier_audit.automatic_recommendation_eligible,false);
 const current=byId.get('zai-glm-5.3');
 assert.equal(current.provider_api_id,'zai-glm-5-3');
 const labs=byId.get('leanstral-1.5');
 assert.equal(labs.status,'retired');
 assert.equal(labs.provider_api_id,'labs-leanstral-1-5');
 assert.ok(labs.verification_evidence.claim_evidence.some(r=>
  r.claim==='pricing'&&
  r.url==='https://docs.mistral.ai/resources/changelogs'&&
  r.verification_status==='RETIRED_NO_CURRENT_PROVIDER_TARIFF_SUPPLIER_CONFIRMED'&&
  /no currently deployable|no current/i.test(r.observed_value||'')
 ),'Retired Labs product must have source-scoped evidence that no live supplier API tariff exists');
 assert.equal(labs.input_usd_m,null,'Retired model must never fabricate a current paid/free token rate');
 assert.equal(labs.output_usd_m,null,'Retired model must never advertise an available zero-cost API output rate');
 assert.ok(labs.verification_evidence.claim_evidence.some(r=>r.claim==='governance'&&r.verification_status==='MODEL_LABS_EXCLUSION_OFFICIAL_POLICY_VERIFIED_TENANT_UNVERIFIED'));
 assert.equal(labs.supplier_audit.automatic_recommendation_eligible,false);
});

test('modelwijzer shows catalog source-registration date without implying supplier acceptance',()=>{
 const html=fs.readFileSync('ai-modelwijzer.html','utf8');
 assert.match(html,/id="catalogEvidenceDate"/);
 assert.match(html,/niet alle claims geverifieerd/);
 assert.doesNotMatch(html,/Laatst gecontroleerd: <b>30 september 2026<\/b>/);
 assert.match(html,/m\.verification_evidence\?\.checked_on/);
 assert.match(html,/dates\.sort\(\)\.at\(-1\)/);
 assert.match(html,/timeZone:'UTC'/);
});

test('AWS Nova public model-card readback preserves exact IDs and customer authorization hold',()=>{
 const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const expected={
  'amazon-nova-2-sonic':{api:'amazon.nova-2-sonic-v1:0',context_k:1000,max_output_tokens:64000,regional:['eu-north-1','us-east-1']},
  'amazon-nova-micro':{api:'amazon.nova-micro-v1:0',context_k:128,max_output_tokens:5000,regional:['eu-west-2','us-east-1']},
  'amazon-nova-multimodal-embeddings':{api:'amazon.nova-2-multimodal-embeddings-v1:0',context_k:null,max_output_tokens:null,regional:['us-east-1']}
 };
 for(const [id,asserted] of Object.entries(expected)){
  const model=catalog.models.find(m=>m.id===id);
  assert.ok(model,id+' missing');
  assert.equal(model.provider_api_id,asserted.api,id+' provider ID');
  if(asserted.context_k!=null)assert.equal(model.context_k,asserted.context_k,id+' input context');
  if(asserted.max_output_tokens!=null)assert.equal(model.max_output_tokens,asserted.max_output_tokens,id+' output ceiling');
  const audit=model.supplier_audit?.public_aws_model_card_crosscheck_20261014;
  assert.ok(audit?.model_specific_card_url?.startsWith('https://docs.aws.amazon.com/bedrock/'),id+' official source');
  assert.equal(audit.canonical_bedrock_model_id,asserted.api,id+' audited ID');
  for(const region of asserted.regional)assert.ok(audit.public_in_region_supported?.includes(region),id+' '+region);
  assert.equal(audit.customer_region_and_model_entitlement_verified,false,id+' customer authorization is unverified');
  assert.equal(audit.effective_processing_or_storage_region_verified,false,id+' tenant region unverified');
  assert.equal(audit.current_account_rate_verified,false,id+' price not attested');
  assert.equal(audit.independent_six_claim_supplier_approval,false,id+' no independent supplier signoff');
  assert.equal(model.supplier_audit.automatic_recommendation_eligible,false,id+' no auto recommendation');
  assert.notEqual(model.verification_evidence?.claim_scope,'full',id+' missing source claims cannot become full');
 }
});
