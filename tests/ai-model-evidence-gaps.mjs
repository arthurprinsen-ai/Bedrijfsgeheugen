#!/usr/bin/env node
// Read-only supplier evidence gap inventory; never treats a reachable URL as verified.
import fs from 'node:fs';
const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
const required=['model_id','status','pricing','capabilities','deployment','governance'];
const rows=catalog.models.map(m=>{
 const e=m.verification_evidence||{};
 const missing=required.filter(claim=>!Array.isArray(e.claim_evidence)||!e.claim_evidence.some(r=>
  r.claim===claim && typeof r.url==='string' && r.url.startsWith('https://') &&
  typeof r.locator==='string' && !!r.locator.trim() &&
  typeof r.observed_value==='string' && !!r.observed_value.trim() &&
  r.checked_on===e.checked_on));
 return {model_id:m.id,provider:m.provider,full_verified:e.claim_scope==='full'&&missing.length===0,missing_claims:missing};
});
const summary={models:rows.length,fully_evidenced:rows.filter(r=>r.full_verified).length,
 missing_by_claim:Object.fromEntries(required.map(c=>[c,rows.filter(r=>r.missing_claims.includes(c)).length]))};
console.log(JSON.stringify({summary,models:rows},null,2));
