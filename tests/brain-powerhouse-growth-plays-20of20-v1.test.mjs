import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync('supabase/migrations/20260928161000_powerhouse_growth_plays_20of20_persuasion_extension_v1.sql','utf8');
const persuasion=fs.readFileSync('.agents/skills/powerhouse-persuasion-revenue/SKILL.md','utf8');
const growth=fs.readFileSync('.agents/skills/powerhouse-growth-swarm/SKILL.md','utf8');

test('all seven formerly incomplete plays have execution paths',()=>{
  for(const play of [
    'mkb-friction-index','positive-public-teardown','anti-consultancy-challenge',
    'boardroom-fear-of-blindness','competitor-switch-pages','data-contribution-flywheel','risk-reversal'
  ]) assert.ok(migration.includes(play),play);
  assert.match(migration,/readiness='ACTIVE'/);
});

test('canonical cycle preserves existing persuasion optimizer and adds executor',()=>{
  assert.match(migration,/powerhouse_activate_all_growth_plays_v2/);
  assert.match(migration,/powerhouse_execute_growth_play_actions_v1/);
  assert.match(migration,/powerhouse_optimize_prepared_outreach_v1/);
  assert.match(migration,/powerhouse_dispatch_autonomous_outreach_v1/);
});

test('decision is never terminal when safe execution exists',()=>{
  assert.match(persuasion,/optimizer-output, draft, recommendation of score is nooit terminal/i);
  assert.match(growth,/zelfstandig kiezen, uitvoeren, readback vastleggen en leren/i);
});

test('persuasion guardrails reject deception and sensitive profiling',()=>{
  assert.match(migration,/fake scarcity/i);
  assert.match(migration,/fabricated social proof/i);
  assert.match(migration,/sensitive-trait targeting/i);
  assert.match(persuasion,/psychologische persoonlijkheidsprofilering/i);
});

test('external email path keeps canonical safeguards',()=>{
  assert.match(migration,/unsubscribe/);
  assert.match(migration,/negative_reply/);
  assert.match(migration,/interval '30 days'/);
  assert.match(migration,/provider_ack_required/);
});

test('optimizer is measured on realized revenue',()=>{
  assert.match(migration,/persuasion-revenue-optimizer-v1/);
  assert.match(migration,/'realized_revenue'/);
  assert.match(migration,/min_matured_per_arm/);
});
