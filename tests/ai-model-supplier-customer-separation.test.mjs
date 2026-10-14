import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('generic supplier catalog cannot be blocked by optional customer vault integration',()=>{
 const suite=fs.readFileSync('tests/ai-model-intelligence-freshness-v1.test.mjs','utf8');
 const audit=fs.readFileSync('tests/ai-model-catalog-evidence-audit.mjs','utf8');
 for(const s of [suite,audit]){
  assert.doesNotMatch(s,/customerClaimStatus\(/);
  assert.match(s,/tenant_data_residency/);
  assert.match(s,/private_networking_enabled/);
 }
 assert.match(suite,/claim_evidence/);
 assert.match(audit,/e\.claim_evidence/);
});
