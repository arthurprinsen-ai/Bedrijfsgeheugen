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
   if(e.verified_claims?.includes(claim)&&classifySupplierClaim(e,claim)==='PROVIDER_BASELINE_ONLY_NOT_MODEL_PROOF')
    problems.push(m.id+':PROVIDER_BASELINE_FALSE_MODEL_APPROVAL:'+claim);
   if(e.verified_claims?.includes(claim)&&!e.claim_evidence?.some(x=>x.claim===claim&&
      typeof x.observed_value==='string'&&x.observed_value.trim()))
    problems.push(m.id+':UNSUPPORTED_VERIFIED_CLAIM:'+claim);
  }
 }
 assert.deepEqual(problems,[]);
});

test('AI model catalog v2 is fresh, source-backed, broad and governance-explicit',()=>{
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 assert.ok(c.models.length>=100);
 assert.ok(new Set(c.models.map(m=>m.provider)).size>=10);
 const failures=[];
 const required=['model_id','status','pricing','capabilities','deployment','governance'];
 for(const m of c.models){
  const issues=[];
  if(!/^https:\/\//.test(m.source??'')) issues.push('invalid source');
  if(!m.jurisdiction) issues.push('missing jurisdiction');
  if(!m.verified_at) issues.push('missing verification date');
  const e=m.verification_evidence;
  if(!e||typeof e!=='object') issues.push('missing supplier evidence');
  else {
   if(e.source_url!==m.source) issues.push('source mismatch');
   if(!/^\d{4}-\d{2}-\d{2}$/.test(e.checked_on??'')) issues.push('invalid evidence date');
   if(e.claim_scope!=='full') issues.push('partial verification');
   if((e.not_verified??[]).length) issues.push('unverified claims');
   if(e.checked_on!==m.verified_at) issues.push('evidence date differs');
   // Supplier facts may not declare tenant-specific agreements or enabled controls as verified.
   // Customer acceptance is a separate, opt-in workflow, not a catalog release dependency.
   const tenantOnly=['dpa','signed_dpa','contract','tenant_data_residency','tenant_zdr','customer_cmk','private_networking_enabled'];
   for(const claim of tenantOnly) if(e.verified_claims?.includes(claim))
     issues.push('tenant-specific claim incorrectly presented as supplier verified '+claim);
   for(const claim of required) {
    if(!e.verified_claims?.includes(claim)) issues.push('unverified '+claim);
    if(classifySupplierClaim(e,claim)!=='MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED')
      issues.push('missing independently reviewable model claim receipt '+claim);
   }
  }
  const age=(Date.now()-new Date((m.verified_at??'')+'T00:00:00Z'))/86400000;
  if(!Number.isFinite(age)||age<0||age>14) issues.push('stale verification');
  if(!Array.isArray(m.limitations)) issues.push('missing limitations');
  if(!m.governance||!Object.hasOwn(m.governance,'storage_residency')||!Object.hasOwn(m.governance,'inference_residency')) issues.push('incomplete governance');
  if(!Object.hasOwn(m,'eu_processing')||!Object.hasOwn(m,'eu_storage')) issues.push('missing EU flags');
  if(issues.length) failures.push(m.id+': '+issues.join(', '));
 }
 assert.deepEqual(failures,[],`Supplier verification failed for ${failures.length}/${c.models.length} models:\n${failures.join('\n')}`);

 const strengths=c.models.flatMap(m=>m.strengths||[]).join(' ').toLowerCase();
 assert.match(strengths,/image generation/);
 assert.match(strengths,/ocr/);
 assert.match(strengths,/embedding/);
 assert.match(strengths,/moderation/);
 assert.ok(c.models.some(m=>(m.modalities||[]).includes('audio')));
 assert.ok(c.models.some(m=>(m.modalities||[]).includes('video')));
 assert.ok(c.models.some(m=>m.self_host===true));
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
