import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const playbook=JSON.parse(fs.readFileSync('config/powerhouse-growth-swarm-playbook-v1.json','utf8'));
const migration=fs.readFileSync('supabase/migrations/20260928123500_powerhouse_growth_swarm_v1.sql','utf8');
const activation=fs.readFileSync('supabase/migrations/20260928124000_powerhouse_growth_swarm_activation_v1.sql','utf8');
const worker=fs.readFileSync('supabase/functions/powerhouse-growth-tools/index.ts','utf8');
const skill=fs.readFileSync('.agents/skills/powerhouse-growth-swarm/SKILL.md','utf8');

test('growth swarm has exactly the 20 canonical plays',()=>{
  assert.equal(playbook.plays.length,20);
  const keys=new Set(playbook.plays.map(x=>x.key));
  for(const key of ['mkb-friction-index','prebuilt-prospect-dossier','positive-public-teardown','anti-consultancy-challenge','reverse-selling','trigger-hijacking','boardroom-fear-of-blindness','lost-knowledge-calculator','value-before-demo','prospect-generated-content-loop','competitor-switch-pages','ma-knowledge-risk','competitor-benchmark','data-contribution-flywheel','warm-referral','risk-reversal','workshop-leaderboard','dark-funnel','we-disagree-content','revenue-swarm']){
    assert.ok(keys.has(key),key);
  }
});

test('growth swarm reuses canonical Powerhouse state and one scheduler',()=>{
  assert.match(migration,/powerhouse_company_intelligence_v1/);
  assert.match(migration,/powerhouse_person_intelligence_v1/);
  assert.match(migration,/powerhouse_opportunities/);
  assert.match(migration,/powerhouse_sales_outcomes/);
  assert.match(migration,/powerhouse_content_recommendations/);
  assert.match(migration,/powerhouse_trigger_based_mkb_acquisition_cycle_v1/);
  assert.doesNotMatch(migration,/cron\.schedule\s*\(/i);
  assert.doesNotMatch(activation,/cron\.schedule\s*\(/i);
  assert.match(skill,/Single scheduler-owner remains/i);
});

test('public benchmarks and workshops are privacy bounded',()=>{
  assert.match(migration,/having count\(\*\) >= 5/i);
  assert.match(migration,/where workshop_size >= 5/i);
  assert.match(worker,/No participant identities are returned/);
  assert.match(worker,/AGGREGATE_BENCHMARK/);
});

test('financial and M&A tools preserve truth boundaries',()=>{
  assert.match(migration,/SCENARIO_ESTIMATE/);
  assert.match(migration,/Scenario estimate only/);
  assert.match(migration,/ESTIMATED_RISK/);
  assert.match(migration,/not a valuation, legal opinion or transaction recommendation/i);
  assert.match(skill,/Financial impact labels/i);
});

test('revenue swarm materializes dossiers before external outreach',()=>{
  assert.match(activation,/swarm_score>=\.35/);
  assert.match(activation,/growth_swarm_dossier/);
  assert.match(activation,/three_evidence_points/);
  assert.match(activation,/one_economic_hypothesis/);
  const growthAt=activation.indexOf('v_growth_activation:=public.powerhouse_materialize_growth_swarm_v1');
  const linkedinAt=activation.indexOf('v_linkedin_sales_dispatch:=public.powerhouse_dispatch_linkedin_sales_machine_v1');
  const emailAt=activation.indexOf('v_outreach_prepare:=public.powerhouse_prepare_autonomous_outreach_v1');
  assert.ok(growthAt>0 && linkedinAt>growthAt && emailAt>linkedinAt);
});

test('public growth tools keep revenue swarm private',()=>{
  assert.match(worker,/tool==='revenue-swarm'/);
  assert.match(worker,/x-powerhouse-token/);
  assert.match(worker,/UNAUTHORIZED/);
  assert.match(worker,/tool==='lost-knowledge'/);
  assert.match(worker,/tool==='ma-risk'/);
  assert.match(worker,/tool==='workshop-benchmark'/);
});

test('growth swarm forbids fabricated growth claims',()=>{
  assert.ok(playbook.hard_gates.includes('evidence'));
  assert.ok(playbook.prohibited.includes('fabricated benchmarks'));
  assert.ok(playbook.prohibited.includes('fabricated intent'));
  assert.match(skill,/No fake competitor intelligence/i);
});
