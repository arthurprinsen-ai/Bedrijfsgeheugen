import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { classifySupplierClaim } from './ai-model-supplier-evidence-worklist.mjs';

test('supplier claim flags never contradict the evidence ledger',()=>{
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const required=['model_id','status','pricing','capabilities','deployment','governance'];
 const problems=[];
 for(const m of c.models){
  const e=m.verification_evidence||{};
  for(const claim of required){
   if(e.verified_claims?.includes(claim)&&e.not_verified?.includes(claim))
    problems.push(m.id+':CONTRADICTORY_CLAIM:'+claim);
   if(e.verified_claims?.includes(claim)&&classifySupplierClaim(e,claim)!=='MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED')
    problems.push(m.id+':NON_MODEL_SPECIFIC_OR_INCOMPLETE_CLAIM_APPROVAL:'+claim);
   if(e.verified_claims?.includes(claim)&&!e.claim_evidence?.some(x=>x.claim===claim&&
      typeof x.observed_value==='string'&&x.observed_value.trim()))
    problems.push(m.id+':UNSUPPORTED_VERIFIED_CLAIM:'+claim);
  }
 }
 assert.deepEqual(problems,[]);
});

test('all 110 supplier audit summaries reconcile with claim source classifications',()=>{
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const required=['model_id','status','pricing','capabilities','deployment','governance'];
 assert.equal(c.models.length,110);
 const invalid=[];
 for(const m of c.models){
  const e=m.verification_evidence||{}, a=m.supplier_audit||{};
  const classifications=Object.fromEntries(required.map(cl=>[cl,classifySupplierClaim(e,cl)]));
  const missing=required.filter(cl=>classifications[cl]!=='MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED');
  const reviews=required.filter(cl=>!(classifications[cl]==='MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED'&&
    e.claim_scope==='full'&&e.source_url===m.source&&e.checked_on===m.verified_at&&
    e.verified_claims?.includes(cl)&&!e.not_verified?.includes(cl)));
  if(JSON.stringify(a.claim_evidence_classification)!==JSON.stringify(classifications))invalid.push(m.id+':CLASSIFICATION_STALE');
  if(JSON.stringify(a.missing_claim_receipts)!==JSON.stringify(missing)||a.missing_receipt_count!==missing.length)invalid.push(m.id+':RECEIPTS_STALE');
  if(JSON.stringify(a.review_required_claims)!==JSON.stringify(reviews)||a.pending_independent_claim_reviews!==reviews.length)invalid.push(m.id+':REVIEWS_STALE');
  if(a.automatic_recommendation_eligible&&reviews.length)invalid.push(m.id+':UNVERIFIED_AUTO_RECOMMENDATION');
 }
 assert.deepEqual(invalid,[]);
});

test('Third-party model directory remains source-labeled; only auto-eligible models require full fresh supplier approval',()=>{
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 assert.equal(c.models.length,110);
 assert.equal(new Set(c.models.map(m=>m.id)).size,110);
 assert.ok(new Set(c.models.map(m=>m.provider)).size>=10);
 const failures=[];
 const required=['model_id','status','pricing','capabilities','deployment','governance'];
 const tenantOnly=['dpa','signed_dpa','contract','tenant_data_residency','tenant_zdr','customer_cmk','private_networking_enabled'];
 for(const m of c.models){
  const issues=[];
  const e=m.verification_evidence;
  const a=m.supplier_audit;
  const wantsAuto=m.auto_recommendation_eligible===true||a?.automatic_recommendation_eligible===true;
  if(!/^https:\/\/[^ ]+$/.test(m.source??''))issues.push('invalid source');
  if(!m.jurisdiction)issues.push('missing jurisdiction');
  if(!m.verified_at)issues.push('missing historical verification date');
  if(!e||typeof e!=='object')issues.push('missing supplier evidence classification');
  else {
   if(e.source_url!==m.source)issues.push('source mismatch');
   if(!/^\d{4}-\d{2}-\d{2}$/.test(e.checked_on??''))issues.push('invalid evidence date');
   if(tenantOnly.some(claim=>e.verified_claims?.includes(claim)))
     issues.push('tenant-specific claim incorrectly presented as supplier verified');
  }
  if(!a||typeof a.automatic_recommendation_eligible!=='boolean')
    issues.push('missing explicit independent automatic recommendation decision');
  if(!Array.isArray(m.limitations))issues.push('missing limitations');
  if(!m.governance||!Object.hasOwn(m.governance,'storage_residency')||!Object.hasOwn(m.governance,'inference_residency'))
    issues.push('incomplete governance');
  if(!Object.hasOwn(m,'eu_processing')||!Object.hasOwn(m,'eu_storage'))
    issues.push('missing EU flags');
  // Research-only third-party listings are allowed with clear partial/CONFLICT
  // classification. They must not be promoted into the running AI router.
  if(wantsAuto){
   if(m.status!=='active'||m.record_kind==='model_family_placeholder'||m.catalog_alias)
     issues.push('unsafe lifecycle/family/alias recommended');
   if(a?.automatic_recommendation_eligible!==true||a?.independent_verification_required===true)
     issues.push('independent supplier approval not present');
   if(e?.claim_scope!=='full'||(e?.not_verified??[]).length)
     issues.push('partial or conflicting supplier evidence for recommended model');
   if(e?.checked_on!==m.verified_at)issues.push('evidence date differs');
   const age=(Date.now()-new Date((e?.checked_on??'')+'T00:00:00Z'))/86400000;
   if(!Number.isFinite(age)||age<0||age>7)issues.push('stale supplier verification on recommended model');
   for(const claim of required){
    if(!e?.verified_claims?.includes(claim))issues.push('unverified '+claim);
    if(classifySupplierClaim(e,claim)!=='MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED')
      issues.push('missing independently reviewable '+claim);
   }
  }
  if(issues.length)failures.push(m.id+': '+issues.join(', '));
 }
 assert.deepEqual(failures,[], 'Release safety failure(s):\n'+failures.join('\n'));
 const strengths=c.models.flatMap(m=>m.strengths||[]).join(' ').toLowerCase();
 for(const capability of ['image generation','ocr','embedding','moderation'])
   assert.ok(strengths.includes(capability),capability);
 assert.ok(c.models.some(m=>(m.modalities||[]).includes('audio')));
 assert.ok(c.models.some(m=>(m.modalities||[]).includes('video')));
 assert.ok(c.models.some(m=>m.self_host===true));
});

test('Undecided third-party model listings remain non-actionable in the advisor',()=>{
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const html=fs.readFileSync('ai-modelwijzer.html','utf8');
 assert.match(html,/m\.supplier_audit\?\.automatic_recommendation_eligible!==true/);
 assert.match(html,/if\(!fullSupplierEvidence\(m\)\)return false/);
 assert.match(html,/m\.status==='eol'/);
 assert.match(html,/gedeeltelijk\/onvoldoende geverifieerd/);
 assert.ok(c.models.some(m=>m.verification_evidence?.claim_scope==='partial'),
   'Partial listings must be preserved as research, not silently removed');
 for(const m of c.models.filter(m=>m.verification_evidence?.claim_scope!=='full'))
   assert.notEqual(m.supplier_audit?.automatic_recommendation_eligible,true,m.id);
});

test('supplier verification ledger explicitly accounts for every required claim',()=>{
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const claims=['model_id','status','pricing','capabilities','deployment','governance'];
 const omissions=[];
 for(const m of c.models){
  const e=m.verification_evidence||{};
  for(const claim of claims){
   const verified=e.verified_claims?.includes(claim)===true;
   const unverified=e.not_verified?.includes(claim)===true;
   if(verified===unverified) omissions.push(m.id+':'+claim+':INVALID_CLAIM_ACCOUNTING');
  }
 }
 assert.deepEqual(omissions,[]);
});

// A future Mistral model can support EU regions, but only when model-specific proof exists.
test('Mistral EU inference and storage claims need separate scoped evidence',()=>{
 const models=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8')).models;
 for(const m of models.filter(x=>x.provider==='Mistral AI')){
  const e=m.verification_evidence||{};
  if(m.eu_processing===true)
   assert.equal(e.model_eu_region_evidence?.verified,true,`${m.id}: regional inference availability must be validated per model`);
  if(m.eu_storage===true)
   assert.equal(e.model_eu_storage_evidence?.verified,true,`${m.id}: EU inference does not prove EU control-plane storage`);
 }
});


// Supplier platform-specific AWS evidence overrides a stale generic provider platform
// table only for the published Bedrock model/endpoint claim, never for customer rights.
test('Embed 4 Bedrock Marketplace claim cannot certify customer entitlement or pricing', () => {
 const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const model=catalog.models.find(m=>m.id==='embed-4');
 assert.ok(model,'Cohere Embed 4 must exist in the catalog');
 const proof=model.aws_bedrock_embed_v4_source_review_20261015;
 assert.ok(proof,'Independently checked, dated AWS Bedrock card is required');
 assert.equal(proof.source_url,'https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-cohere-embed-v4.html');
 assert.equal(proof.aws_bedrock_id,'cohere.embed-v4:0');
 assert.equal(proof.eu_geo_profile,'eu.cohere.embed-v4:0');
 assert.equal(proof.global_profile,'global.cohere.embed-v4:0');
 assert.equal(proof.aws_marketplace_billing,true);
 assert.ok(model.deployment.some(value=>value.includes('AWS Bedrock Marketplace')));
 assert.ok(model.verification_evidence.claim_evidence.some(e=>
   e.claim==='deployment' &&
   e.url===proof.source_url &&
   e.checked_on==='2026-10-15' &&
   e.observed_value.includes('cohere.embed-v4:0')
 ));
 assert.equal(proof.aws_region_account_authorization_confirmed,false);
 assert.equal(proof.customer_region_residency_confirmed,false);
 assert.equal(proof.aws_marketplace_customer_rates_confirmed,false);
 assert.equal(proof.signed_customer_contract_verified,false);
 assert.equal(proof.production_release_approved,false);
 assert.equal(proof.automatic_recommendation_eligible,false);
 assert.equal(model.verification_evidence.claim_scope,'partial');
 assert.ok(model.verification_evidence.not_verified.includes('pricing'));
 assert.ok(model.verification_evidence.not_verified.includes('governance'));
 assert.notEqual(model.supplier_audit?.automatic_recommendation_eligible,true);
});


test('same seven-day supplier receipt policy gates daily audit and public model advisor',()=>{
 const policy=JSON.parse(fs.readFileSync('config/powerhouse-ai-model-intelligence-v1.json','utf8'));
 const audit=fs.readFileSync('scripts/brain/ai-model-intelligence-audit.mjs','utf8');
 const advisor=fs.readFileSync('ai-modelwijzer.html','utf8');
 assert.equal(policy.refresh.fail_closed_on_stale_pricing_days,7);
 assert.match(audit,/const staleAfter=policy\.refresh\.fail_closed_on_stale_pricing_days;/);
 assert.match(audit,/stale_supplier_claim_receipts:staleSupplierReceipts/);
 assert.match(audit,/stale_auto_recommendation_candidates:staleAutoCandidates/);
 assert.ok(audit.includes("!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)"),'Claim receipt date must parse as an ISO calendar date');
 assert.ok(advisor.includes('if(!Number.isFinite(age)||age<0||age>7)return false;'));
 assert.ok(!advisor.includes('age>14)return false;'),'The public advisor must not retain the old fourteen-day automatic eligibility window');
});
