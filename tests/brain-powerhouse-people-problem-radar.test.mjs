import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const library=JSON.parse(fs.readFileSync(new URL('../config/powerhouse-problem-library.json', import.meta.url)));
const detection=JSON.parse(fs.readFileSync(new URL('../config/powerhouse-people-problem-detection.json', import.meta.url)));

test('people domain is first-class in canonical problem library',()=>{
  const ids=new Set(library.problems.map(p=>p.problem_id));
  for(let n=31;n<=40;n++) assert.ok(ids.has(`PH-P${String(n).padStart(3,'0')}`));
  assert.equal(library.problems.filter(p=>p.category==='people').length>=12,true);
});

test('people problems preserve canonical evidence/action/outcome contract',()=>{
  for(const p of library.problems.filter(p=>/^PH-P0(31|32|33|34|35|36|37|38|39|40)$/.test(p.problem_id))){
    assert.ok(p.evidence?.hypothesis?.length);
    assert.deepEqual(p.impact.labels,['OBSERVED','ESTIMATED','POTENTIAL']);
    assert.ok(p.data_sources.length);
    assert.ok(p.actions.length);
    assert.ok(p.capabilities.length);
    assert.ok(p.outcomes.length);
  }
});

test('people detection contract is privacy safe and canonical',()=>{
  assert.match(detection.privacy.join(' '),/Do not infer medical diagnoses/);
  assert.equal(detection.rules.length,10);
  for(const rule of detection.rules) assert.match(rule.problem_id,/^PH-P\d{3}$/);
});
