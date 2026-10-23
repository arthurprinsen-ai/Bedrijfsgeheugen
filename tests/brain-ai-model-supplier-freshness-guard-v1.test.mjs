import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public supplier claims use the same seven-day fail-closed limit as the daily audit',()=>{
 const settings=JSON.parse(fs.readFileSync('config/powerhouse-ai-model-intelligence-v1.json','utf8'));
 assert.equal(settings.refresh.fail_closed_on_stale_pricing_days,7);
 assert.equal(settings.refresh.fail_closed_on_stale_supplier_claim_days,7);
 const audit=fs.readFileSync('scripts/brain/ai-model-intelligence-audit.mjs','utf8');
 const html=fs.readFileSync('ai-modelwijzer.html','utf8');
 assert.match(audit,/const staleAfter=7;/);
 assert.match(audit,/staleModels\.length/);
 assert.match(audit,/if\(report\.state!=='FRESH'\) process\.exitCode=1;/);
 assert.match(html,/function supplierVerificationAgeDays\(m\)/);
 assert.match(html,/const age=supplierVerificationAgeDays\(m\);/);
 assert.match(html,/if\(!Number\.isFinite\(age\)\|\|age<0\|\|age>7\)return false;/);
 assert.match(html,/leverancierscontrole verouderd/);
 assert.match(html,/\$\{supplierVerificationLabel\(m\)\}/);
 assert.match(html,/m\.supplier_audit\?\.automatic_recommendation_eligible!==true/);
 const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 assert.ok(catalog.models.length>=100);
 for(const model of catalog.models){
  assert.ok(model.source?.startsWith('https://'),model.id);
  assert.equal(typeof model.verified_at,'string',model.id);
 }
});

test('historic status cannot be refreshed by a database row update without an official receipt',()=>{
 const html=fs.readFileSync('ai-modelwijzer.html','utf8');
 assert.match(html,/e\.checked_on!==m\.verified_at/);
 assert.match(html,/e\.source_url!==m\.source/);
 assert.match(html,/e\.claim_scope!=='full'/);
 assert.match(html,/e\.claim_evidence\.some/);
});
