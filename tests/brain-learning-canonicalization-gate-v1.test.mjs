import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { compileLearningEvaluationPlan, validateEvaluationContract } from '../scripts/brain/learning-canonicalization-gate.mjs';

test('all material learning requires historical replay before canonicalization',()=>{
  const plan=compileLearningEvaluationPlan({failure_class:'CI',scope:'GITHUB',machine_enforceable:true,repeat_count:1});
  assert.equal(plan.historical_replay_required,true);
  assert.equal(plan.enforcement_kind,'CI_GATE');
  assert.equal(plan.canonical_eligible,false);
});

test('runtime false-success learning additionally requires canary',()=>{
  const plan=compileLearningEvaluationPlan({failure_class:'FALSE_SUCCESS',scope:'RUNTIME',machine_enforceable:true});
  assert.equal(plan.evaluation_mode,'CANARY');
  assert.equal(plan.canary_required,true);
  assert.equal(plan.shadow_required,false);
});

test('security learning requires shadow then canary',()=>{
  const plan=compileLearningEvaluationPlan({failure_class:'SECURITY',scope:'RUNTIME',machine_enforceable:true,security_sensitive:true});
  assert.equal(plan.evaluation_mode,'SHADOW_THEN_CANARY');
  assert.equal(plan.shadow_required,true);
  assert.equal(plan.canary_required,true);
  assert.equal(plan.enforcement_kind,'CI_SECURITY_GATE');
});

test('recovery learning requires shadow evaluation',()=>{
  const plan=compileLearningEvaluationPlan({failure_class:'RECOVERY',scope:'RUNTIME',machine_enforceable:true});
  assert.equal(plan.shadow_required,true);
  assert.equal(plan.enforcement_kind,'WORKFLOW');
});

test('missing compiler identity or required evaluation evidence fails closed',()=>{
  assert.throws(()=>compileLearningEvaluationPlan({scope:'RUNTIME'}),/LEARNING_FAILURE_CLASS_REQUIRED/);
  const plan=compileLearningEvaluationPlan({failure_class:'FALSE_SUCCESS',scope:'RUNTIME'});
  assert.throws(()=>validateEvaluationContract({evaluation:{}},plan),/LEARNING_EVALUATION_TESTS_REQUIRED:historical_replay/);
});

test('evaluation paths are restricted to classified Brain regression tests',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'learning-gate-'));
  fs.mkdirSync(path.join(dir,'tests'),{recursive:true});
  fs.writeFileSync(path.join(dir,'tests','brain-ok.test.mjs'),'');
  const plan=compileLearningEvaluationPlan({failure_class:'CI',scope:'GITHUB'});
  assert.doesNotThrow(()=>validateEvaluationContract({
    evaluation:{historical_replay:['tests/brain-ok.test.mjs']}
  },plan,{rootDir:dir}));
  assert.throws(()=>validateEvaluationContract({
    evaluation:{historical_replay:['scripts/unsafe.mjs']}
  },plan,{rootDir:dir}),/LEARNING_EVALUATION_TEST_PATH_INVALID/);
});


test('skill projection workflow gates canonicalization before projection',()=>{
  const workflow=fs.readFileSync('.github/workflows/powerhouse-skill-projection.yml','utf8');
  assert.match(workflow,/fetch-depth:\s*0/);
  const gate=workflow.indexOf('Evaluate changed learning before canonicalization');
  const projection=workflow.indexOf('Reconcile all canonical learning into skill projection');
  assert.ok(gate>0 && projection>gate);
  assert.match(workflow,/learning-canonicalization-evidence/);
  assert.match(workflow,/POWERHOUSE_BASE_SHA/);
  assert.match(workflow,/POWERHOUSE_HEAD_SHA/);
});


test('SQL compiler keeps recovery class above generic runtime scope',()=>{
  const sql=fs.readFileSync('supabase/migrations/20260918175027_powerhouse_learning_compiler_precedence_v2.sql','utf8');
  const recovery=sql.indexOf("v_class in ('TIMEOUT','WORKER_LOST','RECOVERY','CONNECTOR_FAILURE','QUEUE_STALL')");
  const runtime=sql.indexOf("v_class in ('PRODUCTION_READBACK','RUNTIME_INVARIANT','FALSE_GREEN','FALSE_SUCCESS')");
  assert.ok(recovery>0 && runtime>recovery);
  assert.match(sql,/v_enforcement := 'WORKFLOW'.*v_eval := 'SHADOW'/s);
});


test('repository and production compiler keep identical recovery precedence',()=>{
  const sql=fs.readFileSync('supabase/migrations/20260918175138_powerhouse_learning_compiler_recovery_precedence_v1.sql','utf8');
  const recovery=sql.indexOf("v_class in ('TIMEOUT','WORKER_LOST','RECOVERY'");
  const runtime=sql.indexOf("v_class in ('PRODUCTION_READBACK','RUNTIME_INVARIANT','FALSE_GREEN','FALSE_SUCCESS') or v_scope='RUNTIME'");
  assert.ok(recovery>0 && runtime>recovery);
  const plan=compileLearningEvaluationPlan({failure_class:'RECOVERY',scope:'RUNTIME',machine_enforceable:true});
  assert.equal(plan.enforcement_kind,'WORKFLOW');
  assert.equal(plan.evaluation_mode,'SHADOW');
});
