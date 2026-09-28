import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync('supabase/migrations/20260928152400_powerhouse_persuasion_revenue_optimizer_v1.sql','utf8');
const skill=fs.readFileSync('.agents/skills/powerhouse-persuasion-revenue/SKILL.md','utf8');

test('persuasion optimizer has bounded strategies',()=>{
  for(const k of ['reciprocity_value_first','authority_evidence','social_proof_peer','loss_aversion','commitment_microstep','contrast_before_after','curiosity_gap','reverse_sell'])
    assert.match(migration,new RegExp(k));
});

test('persuasion optimizer reuses canonical sales state',()=>{
  assert.match(migration,/powerhouse_sales_actions/);
  assert.match(migration,/powerhouse_sales_outcomes/);
  assert.match(migration,/powerhouse_growth_swarm_accounts_v1/);
  assert.match(migration,/powerhouse_optimize_prepared_outreach_v1/);
  assert.match(migration,/powerhouse_trigger_based_mkb_acquisition_cycle_v1/);
  assert.doesNotMatch(migration,/cron\.schedule\s*\(/i);
});

test('truth and contact-pressure gates remain explicit',()=>{
  assert.match(skill,/Nooit bewijs, klantclaims, schaarste, urgentie of financieel effect verzinnen/i);
  assert.match(skill,/geen extra verzendvolume/i);
  assert.match(skill,/opt-out/i);
  assert.match(skill,/provider-capability/i);
});
