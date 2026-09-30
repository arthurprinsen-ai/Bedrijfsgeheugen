import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('ai-modelwijzer.html','utf8');
const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
const config=JSON.parse(fs.readFileSync('config/powerhouse-ai-model-intelligence-v1.json','utf8'));

assert.ok(html.includes('id="goalInput"'));
assert.ok(html.includes('id="modelGrid"'));
assert.ok(html.includes('Data-soevereiniteit'));
assert.ok(html.includes('/api/ai-modelwijzer-lead'));
assert.ok(catalog.models.length>=100);
assert.ok(new Set(catalog.models.map(m=>m.provider)).size>=10);
for (const m of catalog.models) {
  assert.ok(m.id && m.provider && m.source);
  assert.ok(m.scores && typeof m.scores.cost==='number');
  assert.ok('eu_processing' in m && 'eu_storage' in m);
  assert.ok('self_host' in m && 'jurisdiction' in m);
  assert.ok(Array.isArray(m.limitations));
  assert.ok(m.governance && 'storage_residency' in m.governance && 'inference_residency' in m.governance);
  assert.ok(m.verified_at && ['official-provider','official-cloud-provider'].includes(m.source_type));
}
assert.equal(config.decision_policy.user_goal_first,true);
assert.equal(config.decision_policy.no_single_best_model_claim,true);
assert.ok(html.includes('id="modalityFilter"'));
assert.ok(html.includes('id="taskFilter"'));
assert.ok(html.includes('Minder geschikt / valkuilen'));
assert.ok(catalog.models.some(m=>m.id==='gpt-6.1-sol'));
assert.ok(catalog.models.some(m=>m.id==='gemini-3.8-flash'));
assert.ok(catalog.models.some(m=>m.id==='mistral-ocr-4.0'));
assert.ok(catalog.models.some(m=>m.id==='gpt-realtime-2.1'));
assert.ok(catalog.models.some(m=>m.self_host===true));
console.log('ai-model-advisor-v1 ok');

assert.ok(html.includes('id="cadence"'));
assert.ok(html.includes('id="people"'));
assert.ok(html.includes('id="volume"'));
assert.ok(html.includes('id="dataSensitivity"'));
assert.ok(html.includes('id="errorImpact"'));
assert.ok(html.includes('id="integration"'));
assert.ok(html.includes('id="budget"'));
assert.ok(html.includes('id="deploymentPreference"'));
assert.ok(html.includes('function simpleProfile()'));
assert.ok(html.includes('Je hoeft geen modelnamen, tokens of technische termen te kennen'));
assert.ok(html.includes('Eenmalig of terugkerend?'));
