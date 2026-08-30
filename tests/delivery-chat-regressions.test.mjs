import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const lessons=JSON.parse(fs.readFileSync('docs/brain/delivery-failure-lessons.json','utf8')).lessons;
const rules=JSON.parse(fs.readFileSync('config/delivery-prevention-rules.json','utf8')).rules;
const workflow=fs.readFileSync('.github/workflows/repo-writer-parity-rollback.yml','utf8');
const delivery=JSON.parse(fs.readFileSync('config/brain-delivery-system.json','utf8'));
const readinessTest=fs.readFileSync('tests/repository-protection-readiness.test.mjs','utf8');

const expected=[
  ['delivery-failure|pipeline|shared|parity-evidence-untracked-files','CAPTURE_UNTRACKED_EVIDENCE_WITH_STATUS'],
  ['delivery-failure|pipeline|shared|detached-head-short-push-ref','FULLY_QUALIFY_DETACHED_HEAD_PUSH_REF'],
  ['delivery-failure|pipeline|shared|readiness-test-coupled-to-live-state','DERIVE_READINESS_FROM_SCENARIO_FIXTURE'],
  ['delivery-failure|pipeline|shared|repository-protection-test-unclassified','CLASSIFY_REPOSITORY_PROTECTION_TESTS'],
];

test('all repeated delivery failures from the 2026-08-30 repair session are PROVEN reusable lessons with active prevention',()=>{
  for(const [fingerprint,ruleId] of expected){
    const lesson=lessons.find(item=>item.fingerprint===fingerprint);
    assert.ok(lesson,`missing lesson ${fingerprint}`);
    assert.equal(lesson.status,'PROVEN');
    assert.equal(lesson.preventionRule,ruleId);
    const rule=rules.find(item=>item.id===ruleId);
    assert.ok(rule,`missing prevention rule ${ruleId}`);
    assert.equal(rule.active,true);
  }
});

test('parity evidence writeback captures untracked files and uses a fully-qualified detached-HEAD push ref',()=>{
  assert.match(workflow,/git status --porcelain=v1 --untracked-files=all/);
  assert.match(workflow,/HEAD:refs\/heads\/\$branch/);
  assert.match(workflow,/test "\$\{#changed\[@\]\}" -eq 8/);
  assert.match(workflow,/UNAPPROVED_PARITY_EVIDENCE_FILE/);
});

test('repository protection regressions are classified and negative readiness is scenario-derived',()=>{
  const backend=delivery.lanes.find(lane=>lane.id==='backend');
  assert.ok(backend.paths.includes('tests/repository-protection-'));
  assert.match(readinessTest,/const operationalOnly = state\.writers\.map/);
  assert.match(readinessTest,/computeMainProtectionReady\(operationalOnly\), false/);
});
