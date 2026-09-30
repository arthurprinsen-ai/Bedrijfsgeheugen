import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('ai-modelwijzer.html','utf8');
const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
const config=JSON.parse(fs.readFileSync('config/powerhouse-ai-model-intelligence-v1.json','utf8'));

assert.ok(html.includes('id="goalInput"'));
assert.ok(html.includes('id="modelGrid"'));
assert.ok(html.includes('Data-soevereiniteit'));
assert.ok(html.includes('/api/ai-modelwijzer-lead'));
assert.ok(catalog.models.length>=25);
assert.ok(new Set(catalog.models.map(m=>m.provider)).size>=8);
for (const m of catalog.models) {
  assert.ok(m.id && m.provider && m.source);
  assert.ok(m.scores && typeof m.scores.cost==='number');
  assert.ok('eu_processing' in m && 'eu_storage' in m);
  assert.ok('self_host' in m && 'jurisdiction' in m);
}
assert.equal(config.decision_policy.user_goal_first,true);
assert.equal(config.decision_policy.no_single_best_model_claim,true);
console.log('ai-model-advisor-v1 ok');
