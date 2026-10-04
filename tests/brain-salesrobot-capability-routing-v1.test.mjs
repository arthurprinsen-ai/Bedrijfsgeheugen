import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync('supabase/migrations/20261004150000_salesrobot_capability_routing_v1.sql','utf8');
const edge=fs.readFileSync('supabase/functions/powerhouse-linkedin-sales-machine/index.ts','utf8');
const skill=fs.readFileSync('.agents/skills/powerhouse-growth-swarm/SKILL.md','utf8');

test('SalesRobot is capability-routed and never a parallel sales brain',()=>{
  assert.match(migration,/powerhouse_channel_capabilities_v1/);
  assert.match(migration,/powerhouse_resolve_commercial_channel_v1/);
  assert.match(migration,/research_wait/);
  assert.match(edge,/SALESROBOT_SEND_MESSAGE/);
  assert.match(edge,/salesrobot\.linkedin_dm/);
  assert.match(edge,/highest-ranked executable channel/);
  assert.doesNotMatch(edge,/dm_capability:'UNAVAILABLE',dm_fallback:'email'/);
  assert.match(skill,/never a parallel sales brain/i);
  assert.match(skill,/zero campaigns is `CONFIG_REQUIRED`/);
});
