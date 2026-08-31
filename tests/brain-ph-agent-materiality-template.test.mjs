import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const contractPath = 'config/ph-agent-materiality-template-v1.json';
const expectedIds = [7088501,7088523,7088532,7088535,7088538,7088545,7088548,7088553,7088558,7088567,7088574,7088579,7088585,7088656,7089001,7089148];

test('canonical PH agent materiality template is fail-closed and covers PH01-PH16', async () => {
  const contract = JSON.parse(await readFile(contractPath, 'utf8'));
  assert.equal(contract.version, 'PH-AGENT-MATERIALITY-TEMPLATE-v1');
  assert.equal(contract.resumeAllowed, false);
  assert.deepEqual(contract.rollout.batchSizes, [1,2,4,8,16]);
  assert.equal(contract.invariants.nonMaterialBg168Calls, 0);
  assert.equal(contract.invariants.materialBg168CallsMax, 1);
  assert.equal(contract.invariants.primaryResultIndependentOfLearning, true);
  assert.equal(contract.invariants.classifierPreservesRawPrimary, true);
  assert.equal(contract.invariants.runtimeEvidenceRequired, true);
  assert.equal(contract.invariants.paidCapacityIncreaseAllowedAutonomously, false);
  assert.deepEqual(contract.agents.map(a => a.scenarioId).sort((a,b)=>a-b), expectedIds);
  assert.equal(contract.agents.every(a => a.state === 'UNGUARDED'), true);
});

test('staging canary is blueprint-guarded but explicitly not runtime-proven', async () => {
  const contract = JSON.parse(await readFile(contractPath, 'utf8'));
  assert.equal(contract.stagingCanary.scenarioId, 7165093);
  assert.equal(contract.stagingCanary.state, 'GUARDED_BLUEPRINT');
  assert.equal(contract.runtimeAcceptance.nonMaterialProven, false);
  assert.equal(contract.runtimeAcceptance.materialProven, false);
  assert.equal(contract.runtimeAcceptance.learningFailureProven, false);
  assert.equal(contract.runtimeAcceptance.creditSlopeBounded, false);
  assert.equal(contract.runtimeAcceptance.no429Burst, false);
});

test('resume cannot become allowed until every required agent is runtime proven or explicitly exempt', async () => {
  const contract = JSON.parse(await readFile(contractPath, 'utf8'));
  const allowedTerminal = new Set(['RUNTIME_PROVEN','EXEMPT']);
  const allTerminal = contract.agents.every(a => allowedTerminal.has(a.state));
  assert.equal(contract.resumeAllowed, allTerminal && contract.runtimeAcceptance?.creditSlopeBounded === true && contract.runtimeAcceptance?.no429Burst === true);
});
