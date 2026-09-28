import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const learning=JSON.parse(fs.readFileSync('brain/learning/2026-09-28-powerhouse-daily-full-connection-enrichment-v2.json','utf8'));
const skill=fs.readFileSync('.agents/skills/powerhouse-relationship-external-intelligence/SKILL.md','utf8');

test('brain preserves the full-graph daily enrichment rule',()=>{
  assert.equal(learning.fingerprint,'powerhouse-daily-full-connection-enrichment-v2');
  assert.equal(learning.status,'LIVE_PROVEN_RUNTIME');
  assert.equal(learning.production_evidence.total_connections,23295);
  assert.equal(learning.production_evidence.enriched_today,23295);
  assert.equal(learning.production_evidence.daily_completion_ratio,1);
  assert.match(skill,/Iedere connectie in .*bg_connecties.* krijgt \*\*minimaal één volledige enrichment-pass per kalenderdag\*\*/);
});
