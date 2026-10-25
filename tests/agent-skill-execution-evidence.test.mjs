import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSkillExecutionEvidence, summarizeAgentCoverage, sha256 } from '../tools/brain/agent-skill-execution-evidence.mjs';

const hash = sha256('pinned real skill text');
const manifest = { requiredSkills: [{ id: 'powerhouse-continuity', version: 'v1', contentSha256: hash }] };
const good = () => ({
  runId: 'run-123', agentId: 'growth-agent',
  loaderReceipts: [{ runId: 'run-123', agentId: 'growth-agent', skillId: 'powerhouse-continuity',
    version: 'v1', contentSha256: hash, loaded: true, loaderId: 'trusted-skill-loader', loadedAt: '2026-10-25T15:00:00Z' }],
  applications: [{ runId: 'run-123', skillId: 'powerhouse-continuity',
    assertions: [{ id: 'provider-readback', passed: true, evidenceRef: 'artifact/verified-readback' }] }],
  verifier: { runId: 'run-123', independent: true, passed: true,
    verifierId: 'separate-evaluation-gate', evidenceRef: 'artifact/evaluation-result' }
});
test('hash is stable', () => assert.match(hash, /^[0-9a-f]{64}$/));
test('complete run evidence is accepted as evidence, not proof of production', () =>
  assert.equal(validateSkillExecutionEvidence(good(), manifest).status, 'VERIFIED_EVIDENCE'));
test('missing skill load is not green', () => {
  const x = good(); x.loaderReceipts = [];
  assert.equal(validateSkillExecutionEvidence(x, manifest).status, 'UNPROVEN');
});
test('wrong skill content is not green', () => {
  const x = good(); x.loaderReceipts[0].contentSha256 = sha256('other');
  assert.equal(validateSkillExecutionEvidence(x, manifest).status, 'UNPROVEN');
});
test('claim without independently checked application is not green', () => {
  const x = good(); x.applications[0].assertions[0].passed = false;
  assert.equal(validateSkillExecutionEvidence(x, manifest).status, 'UNPROVEN');
});
test('agent cannot self verify', () => {
  const x = good(); x.verifier.verifierId = x.agentId;
  assert.equal(validateSkillExecutionEvidence(x, manifest).status, 'UNPROVEN');
});
test('new skills cannot self-activate', () => {
  const x = good(); x.innovation = { activationRequested: true, reviewApproved: false };
  assert.ok(validateSkillExecutionEvidence(x, manifest).errors.includes('INNOVATION_APPROVAL_REQUIRED'));
});
test('every run is required', () => {
  const x = good(), y = good(); y.runId = 'run-124';
  assert.equal(summarizeAgentCoverage([x,y], {'growth-agent':manifest}).status, 'UNPROVEN');
});
test('no runs is unknown, not green', () =>
  assert.equal(summarizeAgentCoverage([], {'growth-agent':manifest}).status, 'UNPROVEN'));
