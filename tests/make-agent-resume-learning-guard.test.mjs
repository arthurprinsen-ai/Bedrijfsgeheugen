import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const policyPath = 'config/make-agent-resume-learning-guard.json';
const incidentPath = 'brain/learning/incidents/make-agent-unconditional-bg168-resume-hazard-2026-08-31.json';

const confirmedIds = [7088501,7088523,7088532,7088535,7088538,7088545,7088548,7088553,7088558,7088567,7088574,7088579,7088585,7088656,7089001,7089148];

test('Make agent resume gate permanently retires legacy runners unless authority is explicitly re-established through current gates', async () => {
  const policy = JSON.parse(await readFile(policyPath, 'utf8'));
  assert.equal(policy.version, 'MAKE-AGENT-RESUME-LEARNING-GUARD-v2');
  assert.equal(policy.resumeAllowed, false);
  assert.equal(policy.state, 'LEGACY_RETIRED_PATH');
  assert.equal(policy.authorityContract, 'config/powerhouse-runtime-authority.json');
  assert.deepEqual(policy.confirmedAffectedScenarioIds.sort((a,b)=>a-b), confirmedIds);
  assert.equal(policy.inventory.complete, true);
  assert.equal(policy.inventory.classification, 'LEGACY_RETIRED_PATH');
  assert.equal(policy.invariants.productionExecutionAllowed, false);
  assert.equal(policy.invariants.authority, 'NONE');
  assert.equal(policy.invariants.historicalEvidencePreserved, true);
  assert.equal(policy.invariants.pausedWithIsActiveTrueCountsAsDisabled, false);
  assert.equal(policy.invariants.silentResumeAllowed, false);
  assert.equal(policy.invariants.paidCapacityIncreaseAllowedAutonomously, false);
  assert.equal(policy.reenableGate.policy, 'EXPLICIT_REENABLE_THROUGH_CURRENT_GATES_ONLY');
  assert.equal(policy.reenableGate.automaticProviderResume, false);
  assert.ok(policy.reenableGate.required.some(x=>x.includes('runtime authority contract')));
  assert.ok(policy.reenableGate.required.some(x=>x.includes('exact production execution/readback')));
});

test('resume hazard incident retains complete 16-agent evidence without secrets', async () => {
  const incidentText = await readFile(incidentPath, 'utf8');
  const incident = JSON.parse(incidentText);
  assert.equal(incident.fingerprint, 'make|agent-template|unconditional-bg168-dispatch-on-resume-v1');
  assert.equal(incident.pattern, 'paused-isActive-resume-hazard-v1');
  assert.equal(incident.status, 'CONTAINED_BY_TEAM_PAUSE_NOT_STRUCTURALLY_FIXED');
  assert.equal(incident.confirmedAffectedAgents.length, 16);
  assert.deepEqual(incident.confirmedAffectedAgents.map(x=>x.scenarioId).sort((a,b)=>a-b), confirmedIds);
  assert.ok(incident.preventionRules.includes('Decide materiality before invoking BG168; internal BG168 classification cannot eliminate invocation cost already incurred.'));
  assert.ok(incident.preventionRules.includes('Do not treat Make status=paused with isActive=true as a structural deactivation or completed fix.'));
  assert.ok(!incidentText.includes('refresh_capability'));
  assert.ok(!incidentText.includes('capabilityToken'));
});
