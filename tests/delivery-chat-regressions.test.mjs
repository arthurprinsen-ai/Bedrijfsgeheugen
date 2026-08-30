import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const lessons=JSON.parse(fs.readFileSync('docs/brain/delivery-failure-lessons.json','utf8')).lessons;
const rules=JSON.parse(fs.readFileSync('config/delivery-prevention-rules.json','utf8')).rules;
const workflow=fs.readFileSync('.github/workflows/repo-writer-parity-rollback.yml','utf8');
const delivery=JSON.parse(fs.readFileSync('config/brain-delivery-system.json','utf8'));
const readinessTest=fs.readFileSync('tests/repository-protection-readiness.test.mjs','utf8');
const preflight=JSON.parse(fs.readFileSync('config/brain-chat-learning-contract.json','utf8'));

const required=[
 ['delivery-failure|writeback|shared|git-diff-missed-untracked-evidence','CAPTURE_TRACKED_AND_UNTRACKED_EVIDENCE'],
 ['delivery-failure|writeback|shared|detached-head-short-push-refspec','FULLY_QUALIFY_DETACHED_HEAD_PUSH_REFSPEC'],
 ['delivery-failure|pipeline|shared|negative-test-coupled-to-live-fixture','ISOLATE_NEGATIVE_TEST_FIXTURES'],
 ['delivery-failure|pipeline|shared|classified-change-test-not-executed','CLASSIFY_AND_EXECUTE_CHANGED_TEST_PATHS'],
 ['delivery-failure|governance|shared|platform-control-assumed-green','FAIL_CLOSED_ON_UNVERIFIED_PLATFORM_CONTROLS'],
 ['delivery-failure|pr|shared|parallel-identical-candidates-raced','CONSOLIDATE_PARALLEL_IDENTICAL_CANDIDATES'],
 ['delivery-failure|verification|shared|duplicate-writer-handoff','SINGLE_CANONICAL_WRITER_HANDOFF'],
 ['delivery-failure|integration|automation|make-subscenario-input-envelope','VALIDATE_MAKE_SUBSCENARIO_INPUT_ENVELOPE'],
 ['delivery-failure|governance|shared|red-first-test-pushed-directly-to-unprotected-main','NEVER_DEVELOP_OR_TDD_DIRECTLY_ON_MAIN'],
 ['delivery-failure|production-persistence|shared|stale-current-main-readback','REFRESH_MAIN_IMMEDIATELY_BEFORE_PRODUCTION_PERSISTENCE']
];

test('chat recovery failures remain PROVEN lessons with active prevention rules',()=>{
 for(const [fingerprint,ruleId] of required){
   const lesson=lessons.find(x=>x.fingerprint===fingerprint);
   assert.ok(lesson,`missing lesson ${fingerprint}`);
   assert.equal(lesson.status,'PROVEN');
   assert.equal(lesson.preventionRule,ruleId);
   const rule=rules.find(x=>x.id===ruleId);
   assert.ok(rule,`missing prevention ${ruleId}`);
   assert.equal(rule.active,true);
 }
});

test('writer parity writeback permanently covers untracked evidence and detached HEAD',()=>{
 assert.match(workflow,/git status --porcelain=v1 --untracked-files=all/);
 assert.match(workflow,/HEAD:refs\/heads\/\$branch/);
 assert.match(workflow,/UNAPPROVED_PARITY_EVIDENCE_FILE/);
});

test('readiness and protection regressions remain scenario-derived and classified',()=>{
 const backend=delivery.lanes.find(l=>l.id==='backend');
 assert.ok(backend.paths.includes('tests/repository-protection-'));
 assert.match(readinessTest,/const operationalOnly = state\.writers\.map/);
 assert.match(readinessTest,/computeMainProtectionReady\(operationalOnly\), false/);
});

test('candidate-only TDD is part of mandatory Brain chat-learning preflight',()=>{
 assert.equal(preflight.preflightRequired,true);
 assert.equal(preflight.newAgentsMustReadBeforeExecution,true);
 assert.ok(preflight.canonicalSources.includes('docs/brain/delivery-failure-lessons.json'));
 assert.ok(preflight.canonicalSources.includes('config/delivery-prevention-rules.json'));
 const lesson=lessons.find(x=>x.fingerprint==='delivery-failure|governance|shared|red-first-test-pushed-directly-to-unprotected-main');
 assert.match(lesson.fix,/candidate branch/i);
 assert.match(lesson.fix,/BG169/i);
});

test('final production persistence requires a fresh current-main readback',()=>{
 const lesson=lessons.find(x=>x.fingerprint==='delivery-failure|production-persistence|shared|stale-current-main-readback');
 assert.ok(lesson);
 assert.equal(lesson.status,'PROVEN');
 assert.match(lesson.rootCause,/reused after additional commits landed/i);
 assert.match(lesson.fix,/re-read main immediately before final production persistence/i);
 assert.match(lesson.fix,/never reuse the stale SHA/i);
 const rule=rules.find(x=>x.id==='REFRESH_MAIN_IMMEDIATELY_BEFORE_PRODUCTION_PERSISTENCE');
 assert.ok(rule);
 assert.equal(rule.active,true);
 assert.equal(rule.enforcedBy,'bg169-final-production-readback-contract');
});
