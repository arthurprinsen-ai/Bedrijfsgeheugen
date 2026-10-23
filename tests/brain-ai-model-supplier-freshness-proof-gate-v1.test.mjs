import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');

test('the existing official-supplier source policy is the sole age authority',()=>{
 const policy=JSON.parse(read('config/powerhouse-ai-model-intelligence-v1.json'));
 const audit=read('scripts/brain/ai-model-intelligence-audit.mjs');
 const advisor=read('ai-modelwijzer.html');
 assert.equal(policy.refresh.cadence,'daily');
 assert.equal(policy.refresh.source_policy,'official-provider-first');
 assert.equal(policy.refresh.fail_closed_on_stale_pricing_days,7);
 assert.match(audit,/const staleAfter=policy\.refresh\.fail_closed_on_stale_pricing_days;/);
 assert.match(audit,/const staleSupplierReceipts=catalog\.models\.filter/);
 assert.match(audit,/stale_supplier_claim_receipts:staleSupplierReceipts/);
 assert.match(audit,/stale_auto_recommendation_candidates:staleAutoCandidates/);
 assert.match(audit,/staleSupplierReceipts\.length/);
 assert.match(advisor,/if\(!Number\.isFinite\(age\)\|\|age<0\|\|age>7\)return false;/);
});

test('historical supplier statuses never masquerade as fresh, proven or automatic',()=>{
 const audit=read('scripts/brain/ai-model-intelligence-audit.mjs');
 const advisor=read('ai-modelwijzer.html');
 assert.match(audit,/source_truth_boundary:/);
 assert.match(audit,/isStaleEvidence\(m\.verification_evidence\?\.checked_on\)/);
 assert.match(audit,/isStaleEvidence\(m\.verified_at\)/);
 assert.match(advisor,/m\.supplier_audit\?\.automatic_recommendation_eligible!==true/);
 assert.match(advisor,/if\(!fullSupplierEvidence\(m\)\)return false/);
 assert.ok(!audit.includes('const staleAfter=14;'));
 assert.ok(!advisor.includes('age>14)return false;'));
});

test('no second scheduler is added to the canonical daily improvement workflow',()=>{
 const workflow=read('.github/workflows/powerhouse-daily-self-evolution.yml');
 assert.match(workflow,/model-freshness:/);
 assert.match(workflow,/improve:/);
 assert.match(workflow,/ai-model-intelligence-audit\.mjs/);
 assert.match(workflow,/run-autonomous-improvement\.mjs/);
});
