import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {deriveNeedProfile,buildNeedDiscoveryContext} from '../brain/revenue/need-discovery.mjs';

test('need discovery asks one next question and does not pitch early',()=>{
  const p=deriveNeedProfile({desired_result:'Minder handwerk'});
  assert.equal(p.stage,'situation');
  assert.equal(p.mayPitch,false);
  assert.match(p.nextQuestion,/Hoe regelen/);
});

test('explicit problem impact urgency unlock a qualified conversation',()=>{
  const p=deriveNeedProfile({desired_result:'Groei',current_approach:'Excel',problem_example:'Offerte gemist',business_impact:'8 uur per week',urgency:'Voor januari'});
  assert.equal(p.mayPitch,true);
  assert.equal(p.offerEligibility,'qualified_conversation');
});

test('all commercial channels share the evidence boundary',()=>{
  for(const channel of ['website','linkedin_company','blog','email','linkedin_dm','portal']){
    const c=buildNeedDiscoveryContext({},channel);
    assert.match(c.evidenceRule,/unknown stays unknown/);
    assert.equal(c.singleQuestion,true);
  }
});

test('runtime, website, portal and governance are wired',()=>{
  for(const path of [
    'netlify/functions/need-discovery.mjs',
    'portal-v2/modules/need-discovery.js',
    'supabase/migrations/20260930202000_powerhouse_need_discovery_v1.sql',
    '.agents/skills/powerhouse-need-discovery/SKILL.md'
  ])assert.ok(fs.existsSync(path),path);
  assert.match(fs.readFileSync('supabase/functions/powerhouse-autonomous-outreach/index.ts','utf8'),/powerhouse_apply_need_discovery_v1/);
  assert.match(fs.readFileSync('portal-v2/page-registry.js','utf8'),/sales-intelligence/);
  assert.match(fs.readFileSync('brain/creative/revenue-content-intelligence.mjs','utf8'),/discoveryQuestion/);
});
