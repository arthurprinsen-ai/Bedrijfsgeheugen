import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [agents,skill,doc,learningText]=await Promise.all([
  readFile('AGENTS.md','utf8'),
  readFile('.agents/skills/powerhouse-continuity/SKILL.md','utf8'),
  readFile('docs/changes/2026-09-25-powerhouse-closed-loop-standard.md','utf8'),
  readFile('brain/learning/2026-09-25-powerhouse-closed-loop-evidence-first-v1.json','utf8')
]);
const learning=JSON.parse(learningText);
const fingerprint='powerhouse-closed-loop-evidence-first-v1';
const lifecycle='signal → analysis → prediction → decision → execution → provider_readback → outcome → realized_value → calibration → next_decision';

test('closed-loop evidence-first delivery is canonical across agent and continuity contracts',()=>{
  assert.match(agents,new RegExp(fingerprint));
  assert.match(skill,new RegExp(fingerprint));
  assert.match(doc,new RegExp(fingerprint));
  assert.ok(agents.includes(lifecycle));
  assert.ok(skill.includes(lifecycle));
});

test('closed-loop learning is machine enforceable and evidence-backed',()=>{
  assert.equal(learning.fingerprint,fingerprint);
  assert.equal(learning.compiler?.failure_class,'DELIVERY');
  assert.equal(learning.compiler?.scope,'GITHUB');
  assert.equal(learning.compiler?.machine_enforceable,true);
  assert.deepEqual(learning.evaluation?.historical_replay,['tests/brain-powerhouse-closed-loop-evidence-first-v1.test.mjs']);
  assert.match(skill,/Predicted\/expected value is never stored as realized value|predicted\/expected value is never stored as realized value/i);
  assert.match(skill,/Missing evidence remains open, blocked, outcome_pending or calibration_pending/i);
});
