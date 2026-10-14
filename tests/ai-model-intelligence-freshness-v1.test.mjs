import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

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
   // Supplier terms are not proof of a tenant's signed agreements or enabled controls.
   const tenantClaims=['dpa','signed_dpa','contract','tenant_data_residency','tenant_zdr','customer_cmk','private_networking_enabled'];
   const tenantReceipts=e.tenant_evidence??[];
   for(const claim of tenantClaims){
    if(!e.verified_claims?.includes(claim)) continue;
    const approved=Array.isArray(tenantReceipts)&&tenantReceipts.some(r=>
      r.claim===claim && r.scope==='customer_specific' &&
      typeof r.tenant_id==='string' && r.tenant_id.trim() &&
      typeof r.approved_by==='string' && r.approved_by.trim() &&
      typeof r.evidence_reference==='string' && r.evidence_reference.trim() &&
      r.checked_on===e.checked_on);
    if(!approved) issues.push('missing customer-specific contract/control evidence '+claim);
   }
   for(const claim of required) {
    if(!e.verified_claims?.includes(claim)) issues.push('unverified '+claim);
    const receipt=e.claim_evidence?.find(x=>x.claim===claim &&
      typeof x.url==='string' && x.url.startsWith('https://') &&
      typeof x.locator==='string' && x.locator.trim() &&
      typeof x.observed_value==='string' && x.observed_value.trim() &&
      x.checked_on===e.checked_on);
    if(!receipt) issues.push('missing claim-specific evidence '+claim);
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