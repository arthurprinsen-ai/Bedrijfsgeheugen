import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const optimizer=fs.readFileSync('supabase/migrations/20260928140000_powerhouse_persuasion_growth_optimizer_v1.sql','utf8');
const executor=fs.readFileSync('supabase/migrations/20260928141000_powerhouse_growth_play_action_executor_v1.sql','utf8');
const skill=fs.readFileSync('.agents/skills/powerhouse-persuasion-revenue-optimizer/SKILL.md','utf8');

test('all formerly incomplete plays have activation paths',()=>{
  const plays=['mkb-friction-index','positive-public-teardown','anti-consultancy-challenge','boardroom-fear-of-blindness','competitor-switch-pages','data-contribution-flywheel','risk-reversal'];
  for(const play of plays) assert.ok(optimizer.includes(play),play);
  assert.match(optimizer,/readiness='ACTIVE'/);
});

test('persuasion optimizer blocks deceptive patterns and sensitive profiling',()=>{
  assert.match(optimizer,/fake scarcity/i);
  assert.match(optimizer,/fabricated social proof/i);
  assert.match(optimizer,/sensitive-trait targeting/i);
  assert.match(optimizer,/psychological personality profiling/i);
  assert.match(skill,/dark patterns/i);
});

test('persuasion decisions route to canonical execution',()=>{
  assert.match(executor,/powerhouse-autonomous-outreach/);
  assert.match(executor,/powerhouse-content-orchestrator/);
  assert.match(executor,/autonomous_email/);
  assert.match(executor,/provider_ack_required/);
  assert.match(skill,/nooit terminal delivery/i);
});

test('email execution preserves suppression and cooldown',()=>{
  assert.match(executor,/unsubscribe/);
  assert.match(executor,/negative_reply/);
  assert.match(executor,/interval '30 days'/);
  assert.match(executor,/duplicate_send_forbidden/);
});

test('measurement target is realized revenue',()=>{
  assert.match(optimizer,/persuasion-revenue-optimizer-v1/);
  assert.match(optimizer,/'realized_revenue'/);
  assert.match(optimizer,/min_matured_per_arm/);
});
