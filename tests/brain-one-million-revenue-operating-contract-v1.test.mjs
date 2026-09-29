import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=(p)=>readFileSync(p,'utf8');

test('€1M revenue operating contract is machine-readable and revenue-first',()=>{
  const c=JSON.parse(read('config/powerhouse-one-million-revenue-operating-contract-v1.json'));
  assert.equal(c.objective.realized_revenue_eur,1000000);
  assert.equal(c.objective.horizon_days,365);
  assert.equal(c.pacing.scan_only_reference.unit_price_eur,2900);
  assert.equal(c.outbound_policy.cold_bulk_autosend,false);
  assert.equal(c.outbound_policy.warm_relationship_email_autosend,true);
  assert.match(c.terminal_definition,/readback/i);
  assert.match(c.terminal_definition,/learning/i);
});

test('single canonical commercial scheduler executes full acquisition cycle',()=>{
  const sql=read('supabase/migrations/20260929162000_powerhouse_one_million_revenue_operating_contract_v1.sql');
  assert.match(sql,/jobname='powerhouse-commercial-learning-v1'/);
  assert.match(sql,/cron\.schedule\(\s*'powerhouse-commercial-learning-v1'/);
  assert.match(sql,/powerhouse_trigger_based_mkb_acquisition_cycle_v1\(\)/);
  assert.doesNotMatch(sql,/cron\.schedule\(\s*'powerhouse-one-million/i);
});

test('agents chats skills and system map inherit the same commercial authority',()=>{
  const agents=read('AGENTS.md');
  const chats=JSON.parse(read('config/brain-chat-learning-contract.json'));
  const map=read('platform/system-map/canonical-system-map.mjs');
  assert.match(agents,/powerhouse-one-million-revenue-operating-contract-v1/);
  assert.equal(chats.policy.requireOneMillionRevenueOperatingContract,true);
  assert.match(map,/one-million-revenue-operating-contract/);
  for(const p of [
    '.agents/skills/powerhouse-growth-swarm/SKILL.md',
    '.agents/skills/powerhouse-linkedin-sales-machine/SKILL.md',
    '.agents/skills/powerhouse-persuasion-revenue/SKILL.md',
    '.agents/skills/powerhouse-relationship-revenue/SKILL.md',
    '.agents/skills/seo-revenue-growth/SKILL.md'
  ]) assert.match(read(p),/powerhouse-one-million-revenue-operating-contract-v1/);
});

test('identity and anti-spam boundaries remain hard gates',()=>{
  const c=JSON.parse(read('config/powerhouse-one-million-revenue-operating-contract-v1.json'));
  assert.equal(c.content_identity.linkedin_personal.includes('personal-life-only'),true);
  assert.equal(c.content_identity.instagram.includes('Mira-only'),true);
  assert.equal(c.outbound_policy.cold_bulk_autosend,false);
  assert.match(c.outbound_policy.opt_out_and_suppression,/absolute/i);
});
