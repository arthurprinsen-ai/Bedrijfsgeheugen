import test from 'node:test';
import assert from 'node:assert/strict';
import { sha256 } from '../tools/brain/agent-skill-execution-evidence.mjs';
import { buildAttestedAgentRunPayload } from '../tools/brain/attested-agent-run-payload.mjs';

const hash = sha256('pinned skill text');
const manifest = { requiredSkills: [{ id: 'powerhouse-experiment-calendar-closure', version: 'v1', contentSha256: hash }] };
const record = () => ({
  runId: 'run-1', agentId: 'agent-experiment-cycle',
  loaderReceipts: [{ runId: 'run-1', agentId: 'agent-experiment-cycle', skillId: 'powerhouse-experiment-calendar-closure',
    version: 'v1', contentSha256: hash, loaded: true, loaderId: 'trusted-skill-loader', loadedAt: '2026-11-09T07:24:00Z' }],
  applications: [{ runId: 'run-1', skillId: 'powerhouse-experiment-calendar-closure',
    assertions: [{ id: 'one-variable', passed: true, evidenceRef: 'artifact/check' }] }],
  verifier: { runId: 'run-1', independent: true, passed: true, verifierId: 'separate-evaluation-gate', evidenceRef: 'artifact/eval' }
});
const ba = { before: { active_experiments: 9 }, after: { active_experiments: 10 } };

test('verified run yields agent_id, skill_version and before/after', () => {
  const p = buildAttestedAgentRunPayload({ record: record(), manifest, ...ba });
  assert.equal(p.agent_attribution, 'ATTESTED_VERIFIED_EVIDENCE');
  assert.equal(p.agent_id, 'agent-experiment-cycle');
  assert.match(p.skill_version, /^powerhouse-experiment-calendar-closure@v1#[0-9a-f]{12}$/);
  assert.deepEqual(p.before, ba.before);
  assert.deepEqual(p.after, ba.after);
});
test('no agent_id without verified evidence', () => {
  const r = record(); r.loaderReceipts = [];
  const p = buildAttestedAgentRunPayload({ record: r, manifest, ...ba });
  assert.equal(p.agent_attribution, 'UNKNOWN_NOT_ATTESTED');
  assert.equal('agent_id' in p, false);
});
test('self-verification stays unattested', () => {
  const r = record(); r.verifier.verifierId = r.agentId;
  assert.equal(buildAttestedAgentRunPayload({ record: r, manifest, ...ba }).agent_attribution, 'UNKNOWN_NOT_ATTESTED');
});
test('missing before/after stays unattested', () => {
  const p = buildAttestedAgentRunPayload({ record: record(), manifest, before: {}, after: ba.after });
  assert.equal(p.attestation_blocker, 'BEFORE_AFTER_MISSING');
});
test('empty input fails closed', () => {
  assert.equal(buildAttestedAgentRunPayload().agent_attribution, 'UNKNOWN_NOT_ATTESTED');
});
