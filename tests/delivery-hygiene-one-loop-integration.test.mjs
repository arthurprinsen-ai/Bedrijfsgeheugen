import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyCandidate, evaluateAdmission } from '../tools/delivery/delivery-hygiene.mjs';

const sha = 'a'.repeat(40);
const policy = {
  wip: { maxExecutable: 2 },
  allowedLanes: ['backend','portal','website','automation','security','incident','dependency','docs'],
  allowedCandidateTypes: ['implementation','recovery','security','dependency','docs','promotion'],
  nonProductLanes: ['dependency','docs'],
};

const candidate = (number, obligationId, lane='portal', candidateType='implementation', conflictContracts=[]) => classifyCandidate({
  number,
  state: 'open',
  baseSha: sha,
  headSha: String(number).padStart(40, 'b').slice(0,40),
  body: `Obligation-ID: ${obligationId}\nDelivery-Lane: ${lane}\nCandidate-Type: ${candidateType}\nBase-SHA: ${sha}\nSupersedes: none`,
  conflictContracts,
}, policy);

test('One Loop turns saturated conflicting integration admission into WAITING_CAPACITY', () => {
  const contract = ['delivery-control-plane'];
  const current = candidate(10, 'new-work', 'portal', 'implementation', contract);
  const open = [
    candidate(1, 'existing-a', 'portal', 'implementation', contract),
    candidate(2, 'existing-b', 'portal', 'implementation', contract),
  ];
  const result = evaluateAdmission({ candidate: current, openCandidates: open, policy, currentMainSha: sha });
  assert.equal(result.ok, false);
  assert.equal(result.state, 'WAITING_CAPACITY');
  assert.equal(result.reason, 'FINISH_EXISTING_WORK_FIRST');
});

test('unrelated development does not consume integration WIP capacity', () => {
  const current = candidate(10, 'new-work', 'portal', 'implementation', ['portal-state']);
  const open = [
    candidate(1, 'existing-a', 'backend', 'implementation', ['backend-runtime']),
    candidate(2, 'existing-b', 'automation', 'implementation', ['social-publisher']),
  ];
  const result = evaluateAdmission({ candidate: current, openCandidates: open, policy, currentMainSha: sha });
  assert.equal(result.ok, true);
  assert.equal(result.state, 'ADMITTED');
});

test('security/incident recovery can enter saturated capacity but never bypasses other integrity gates', () => {
  const current = candidate(10, 'incident-fix', 'incident', 'recovery');
  const open = [candidate(1, 'existing-a'), candidate(2, 'existing-b')];
  const result = evaluateAdmission({ candidate: current, openCandidates: open, policy, currentMainSha: sha });
  assert.equal(result.ok, true);
  assert.equal(result.state, 'ADMITTED');
  assert.equal(result.priorityRecovery, true);
});
