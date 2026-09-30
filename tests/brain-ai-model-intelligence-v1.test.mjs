import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
const config=JSON.parse(fs.readFileSync('config/powerhouse-ai-model-intelligence-v1.json','utf8'));
const html=fs.readFileSync('ai-modelwijzer.html','utf8');
const governance=JSON.parse(fs.readFileSync('data/ai-provider-governance-v1.json','utf8'));

test('AI Modelwijzer keeps goal, cost and sovereignty contracts',()=>{
  assert.ok(catalog.models.length>=100);
  assert.ok(new Set(catalog.models.map(m=>m.provider)).size>=10);
  assert.equal(config.decision_policy.user_goal_first,true);
  assert.equal(config.decision_policy.no_single_best_model_claim,true);
  assert.match(html,/id="goalInput"/);
  assert.match(html,/Dataresidentie ≠ data-soevereiniteit/);
  assert.match(html,/id="euOnly"/);
  assert.match(html,/id="selfHost"/);
  assert.match(html,/id="zdr"/);
  assert.match(html,/id="customerControl"/);
  assert.match(html,/id="providerGovernanceGrid"/);
  assert.match(html,/data\/ai-provider-governance-v1\.json/);
  assert.ok(governance.providers.length>=10);
  assert.ok(governance.providers.flatMap(p=>p.paths).length>=15);
  for(const p of governance.providers.flatMap(p=>p.paths)){
    assert.ok(Object.prototype.hasOwnProperty.call(p,'storage_residency'));
    assert.ok(Object.prototype.hasOwnProperty.call(p,'inference_residency'));
    assert.ok(Object.prototype.hasOwnProperty.call(p,'zero_data_retention'));
    assert.ok(p.source);
  }
  for(const m of catalog.models){
    assert.match(String(m.source||''),/^https:\/\//);
    assert.ok(m.jurisdiction);
    assert.ok(Object.prototype.hasOwnProperty.call(m,'eu_processing'));
    assert.ok(Object.prototype.hasOwnProperty.call(m,'eu_storage'));
    assert.ok(Object.prototype.hasOwnProperty.call(m,'self_host'));
  }
});

test('catalog evidence is freshness bounded',()=>{
  const ageDays=(Date.now()-new Date(catalog.verified_at+'T00:00:00Z'))/86400000;
  assert.ok(ageDays<=14,'catalog must be refreshed within 14 days');
});
