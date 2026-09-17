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

const candidate = (number, obligationId, lane='portal', candidateType='implementation') => classifyCandidate({
  number,
  state: 'open',
  baseSha: sha,
  headSha: String(number).padStart(40, 'b').slice(0,40),
  body: `Obligation-ID: ${obligationId}\nDelivery-Lane: ${lane}\nCandidate-Type: ${candidateType}\nBase-SHA: ${sha}\nSupersedes: none`,
}, policy);

test('One Loop turns saturated lower-priority admission into WAITING_CAPACITY', () => {
  const current = candidate(10, 'new-work');
  const open = [candidate(1, 'existing-a'), candidate(2, 'existing-b')];
  const result = evaluateAdmission({ candidate: current, openCandidates: open, policy, currentMainSha: sha });
  assert.equal(result.ok, false);
  assert.equal(result.state, 'WAITING_CAPACITY');
  assert.equal(result.reason, 'FINISH_EXISTING_WORK_FIRST');
});

test('security/incident recovery can enter saturated capacity but never bypasses other integrity gates', () => {
  const current = candidate(10, 'incident-fix', 'incident', 'recovery');
  const open = [candidate(1, 'existing-a'), candidate(2, 'existing-b')];
  const result = evaluateAdmission({ candidate: current, openCandidates: open, policy, currentMainSha: sha });
  assert.equal(result.ok, true);
  assert.equal(result.state, 'ADMITTED');
  assert.equal(result.priorityRecovery, true);
});
