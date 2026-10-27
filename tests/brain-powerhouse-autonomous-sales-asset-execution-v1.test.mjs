import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const persuasion=fs.readFileSync('.agents/skills/powerhouse-persuasion-revenue/SKILL.md','utf8');
const growth=fs.readFileSync('.agents/skills/powerhouse-growth-swarm/SKILL.md','utf8');

test('agent contract forbids recommendation-only terminal states',()=>{
  for(const skill of [persuasion,growth]){
    assert.match(skill,/powerhouse-autonomous-sales-asset-execution-v1/);
    assert.match(skill,/Draft, suggestion, CTA recommendation, asset recommendation and TODO are non-terminal states/i);
    assert.match(skill,/materialize -> provider execute -> provider ack\/readback -> sales outcome -> learning/i);
  }
});

test('DM capability falls back instead of stopping',()=>{
  assert.match(persuasion,/If the provider cannot DM, automatically route to the highest-ranked executable fallback/i);
});
