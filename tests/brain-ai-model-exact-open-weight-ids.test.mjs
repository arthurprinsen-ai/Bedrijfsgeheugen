import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
test('open-weight entries identify exact published checkpoints, not broad families',()=>{
 assert.equal(catalog.models.length,110);
 const byId=new Map(catalog.models.map(m=>[m.id,m]));
 for(const deprecated of ['llama-open-weight','qwen-open-weight']) assert.equal(byId.has(deprecated),false);
 const selected=[
  ['llama-4-scout-17b-16e-instruct','meta-llama/Llama-4-Scout-17B-16E-Instruct'],
  ['qwen3-32b','Qwen/Qwen3-32B']
 ];
 for(const [id,canonical] of selected){
  const m=byId.get(id);
  assert.ok(m,id+' must exist');
  assert.equal(m.canonical_model_id,canonical);
  assert.equal(m.record_kind,'individual_model');
  assert.equal(m.verification_state,'PARTIAL');
  assert.equal(m.auto_recommendation_eligible,false);
  assert.equal(m.eu_processing,null);
  assert.equal(m.eu_storage,null);
  assert.equal(m.input_usd_m,null);
  assert.equal(m.output_usd_m,null);
  assert.match(m.source,/^https:\/\/huggingface\.co\//);
 }
});
