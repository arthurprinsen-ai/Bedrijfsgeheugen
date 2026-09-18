import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildDailySelfEvolutionSnapshot } from '../scripts/brain/daily-self-evolution.mjs';

test('daily self-evolution covers chats agents skills and delivery',()=>{
  const c=JSON.parse(fs.readFileSync('config/powerhouse-daily-self-evolution.json','utf8'));
  for(const required of ['all_existing_chats','all_future_chats','all_existing_agents','all_future_agents','all_skills','all_material_workflows']){
    assert.ok(c.applies_to.includes(required), required);
  }
  assert.equal(c.rules.blind_self_modification_forbidden,true);
  assert.equal(c.rules.evidence_before_promotion,true);
  assert.equal(c.rules.production_readback_required,true);
  assert.equal(c.rules.no_change_is_valid_when_champion_remains_best,true);
});

test('daily snapshot requires the canonical Powerhouse controls',()=>{
  const s=buildDailySelfEvolutionSnapshot({now:'2026-09-18T06:30:00.000Z'});
  assert.equal(s.fingerprint,'powerhouse-daily-self-evolution-v1');
  assert.deepEqual(s.missing_controls,[]);
  assert.equal(s.status,'READY_FOR_DAILY_SELF_EVOLUTION');
  assert.ok(s.surfaces.find(x=>x.surface==='chats'));
  assert.ok(s.surfaces.find(x=>x.surface==='agents'));
  assert.ok(s.surfaces.find(x=>x.surface==='skills'));
  assert.ok(s.surfaces.find(x=>x.surface==='delivery'));
});
