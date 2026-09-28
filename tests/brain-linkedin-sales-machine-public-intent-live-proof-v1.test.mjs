import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Sales Machine public intent bridge is canonically live-proven',()=>{
  const skill=fs.readFileSync('.agents/skills/powerhouse-linkedin-sales-machine/SKILL.md','utf8');
  const learning=JSON.parse(fs.readFileSync('brain/learning/2026-09-28-linkedin-sales-machine-public-intent-bridge-v1.json','utf8'));
  const map=fs.readFileSync('platform/system-map/canonical-system-map.mjs','utf8');
  assert.match(skill,/public-intent-bridge-v1-live-proof/);
  assert.equal(learning.status,'LIVE_PROVEN_RUNTIME');
  assert.equal(learning.production_evidence.exact_main_to_production,true);
  assert.match(map,/linkedin-sales-machine-public-intent-bridge/);
  assert.match(map,/LIVE_PROVEN_RUNTIME/);
});
