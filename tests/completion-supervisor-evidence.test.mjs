import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deriveTrustedCompletionEvidence } from '../tools/completion-supervisor-evidence.mjs';

const CANDIDATE = 'a'.repeat(40);
const PRODUCTION = 'b'.repeat(40);
const base = { obligationId:'material-change-live-verification', candidateIdentity:CANDIDATE, productionIdentity:PRODUCTION, runId:'4242' };

test('successful candidate delivery mints candidate tests only', () => {
  const evidence = deriveTrustedCompletionEvidence({ ...base, sourceWorkflow:'Unified Brain Delivery', conclusion:'success' });
  assert.deepEqual(evidence.map(item => item.type), ['CANDIDATE_TESTS']);
  assert.equal(evidence[0].producer, 'BRAIN_DELIVERY');
});

test('validated BG169 artifact mints exact protected delivery identities', () => {
  const bg169 = { authority:'BG169', candidate_sha:CANDIDATE, expected_head_sha:CANDIDATE, production_sha:PRODUCTION, execution_proof:true, verified:true };
  const evidence = deriveTrustedCompletionEvidence({ ...base, sourceWorkflow:'Unified Brain Delivery', conclusion:'success', bg169 });
  assert.deepEqual(evidence.map(item => item.type), ['CANDIDATE_TESTS','PROTECTED_DELIVERY','PRODUCTION_IDENTITY']);
  assert.ok(evidence.every(item => item.candidateIdentity === CANDIDATE));
});

test('exact successful production readback mints protected production identity, readback, handoff and learning evidence', () => {
  const readback = { merge_sha:PRODUCTION, status:'LIVE_VERIFIED', routes_ok:true, deployment_required:false, deploy_status:'not_applicable' };
  const evidence = deriveTrustedCompletionEvidence({ ...base, sourceWorkflow:'Production Release Readback', conclusion:'success', readback, capabilityHandoff:true, learningWriteback:true });
  assert.deepEqual(evidence.map(item => item.type), ['PROTECTED_DELIVERY','PRODUCTION_IDENTITY','FUNCTIONAL_READBACK','CAPABILITY_HANDOFF','LEARNING_WRITEBACK']);
  assert.ok(evidence.filter(item => ['PROTECTED_DELIVERY','PRODUCTION_IDENTITY'].includes(item.type)).every(item => item.producer === 'PRODUCTION_READBACK' && item.exactProduction === true));
});

test('failed or mismatched source evidence mints nothing and fails closed', () => {
  assert.deepEqual(deriveTrustedCompletionEvidence({ ...base, sourceWorkflow:'Unified Brain Delivery', conclusion:'failure' }), []);
  assert.throws(() => deriveTrustedCompletionEvidence({ ...base, sourceWorkflow:'Production Release Readback', conclusion:'success', readback:{ merge_sha:CANDIDATE, status:'LIVE_VERIFIED', routes_ok:true } }), /production identity mismatch/);
});

test('outcome obligation sweep resolves squash-merge candidate identity from exactly one associated merged PR', () => {
  const workflow = readFileSync('.github/workflows/outcome-obligation-sweep.yml', 'utf8');
  assert.match(workflow, /pull-requests: read/);
  assert.match(workflow, /git rev-parse \"\$\{SOURCE_HEAD_SHA\}\^2\" 2>\/dev\/null \|\| true/);
  assert.match(workflow, /commits\/\$\{SOURCE_HEAD_SHA\}\/pulls/);
  assert.match(workflow, /\.merge_commit_sha == \$merge/);
  assert.match(workflow, /if length == 1 then \.\[0\]\.head\.sha else empty end/);
  assert.match(workflow, /COMPLETION_CANDIDATE_IDENTITY_MISSING/);
});

test('merged branch cleanup emits operator-visible error evidence on every non-zero exit', () => {
  const workflow = readFileSync('.github/workflows/powerhouse-merged-branch-cleanup.yml', 'utf8');
  assert.match(workflow, /cleanup_evidence\(\)/);
  assert.match(workflow, /if \[ "\$rc" -ne 0 \]; then/);
  assert.match(workflow, /::error::Powerhouse merged branch cleanup failed:/);
  assert.match(workflow, /state=\$state detail=\$\{detail:-UNKNOWN\} branch=\$HEAD_REF expected_head=\$EXPECTED_HEAD_SHA/);
  assert.match(workflow, /write_evidence "\$rc"/);
});
