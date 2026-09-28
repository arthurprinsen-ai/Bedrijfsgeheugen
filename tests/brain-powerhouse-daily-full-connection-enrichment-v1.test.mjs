import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const learning=JSON.parse(fs.readFileSync('brain/learning/2026-09-28-powerhouse-daily-full-connection-enrichment-v1.json','utf8'));
const skill=fs.readFileSync('.agents/skills/powerhouse-daily-full-connection-enrichment/SKILL.md','utf8');

test('daily full graph enrichment stays canonical and complete',()=>{
  assert.equal(learning.fingerprint,'powerhouse-daily-full-connection-enrichment-v1');
  assert.equal(learning.status,'LIVE_PROVEN_RUNTIME');
  assert.equal(learning.production_evidence.connections_total,23295);
  assert.equal(learning.production_evidence.connections_enriched_today,23295);
  assert.equal(learning.production_evidence.connections_remaining_today,0);
  assert.equal(learning.production_evidence.full_graph_daily_refresh,true);
  assert.match(skill,/Iedere connectie.*iedere kalenderdag/i);
});
