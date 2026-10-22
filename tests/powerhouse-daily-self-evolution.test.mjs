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
  assert.equal(s.fingerprint,'powerhouse-daily-self-evolution-v2');
  assert.deepEqual(s.missing_controls,[]);
  assert.equal(s.status,'READY_FOR_DAILY_SELF_EVOLUTION');
  assert.ok(s.surfaces.find(x=>x.surface==='chats'));
  assert.ok(s.surfaces.find(x=>x.surface==='agents'));
  assert.ok(s.surfaces.find(x=>x.surface==='skills'));
  assert.ok(s.surfaces.find(x=>x.surface==='delivery'));
});


test('daily self evolution is scheduled/manual only and cannot add PR fanout',()=>{
  const workflow=fs.readFileSync('.github/workflows/powerhouse-daily-self-evolution.yml','utf8');
  assert.match(workflow,/schedule:/);
  assert.match(workflow,/workflow_dispatch:/);
  assert.doesNotMatch(workflow,/^  pull_request:/m);
});


test('stale provider catalog is fail-closed but cannot halt independent daily learning',()=>{
  const workflow=fs.readFileSync('.github/workflows/powerhouse-daily-self-evolution.yml','utf8');
  const jobs=workflow.split(/^jobs:\s*$/m)[1];
  assert.ok(jobs,'daily workflow contains jobs');
  const isolated=jobs.split(/^  model-freshness:\s*$/m);
  assert.equal(isolated.length,2,'existing improve and independent model-freshness jobs are separate');
  const [improve,modelAudit]=isolated;
  assert.match(improve,/^  improve:\s*$/m);
  assert.match(improve,/node scripts\/brain\/daily-self-evolution\.mjs/);
  assert.match(improve,/node scripts\/brain\/continuous-improvement\/run-autonomous-improvement\.mjs/);
  assert.match(improve,/node scripts\/brain\/powerhouse-engineering-closed-loop\.mjs --self-test/);
  assert.doesNotMatch(improve,/ai-model-intelligence-audit\.mjs/,'stale catalog may not short-circuit other learning tasks');
  assert.doesNotMatch(improve,/needs:\s*(\[?model-freshness)/,'daily learning cannot depend on provider audit');
  assert.match(modelAudit,/node --test tests\/ai-model-intelligence-freshness-v1\.test\.mjs/);
  assert.match(modelAudit,/node scripts\/brain\/ai-model-intelligence-audit\.mjs/);
  assert.match(modelAudit,/if: always\(\)/);
  assert.match(modelAudit,/ai-model-intelligence-audit\.json/);
  assert.doesNotMatch(modelAudit,/continue-on-error:|\|\| true|exit 0/,'provider freshness must stay red when evidence is stale');
  assert.equal((workflow.match(/schedule:/g)||[]).length,1,'no duplicate daily scheduler');
});
