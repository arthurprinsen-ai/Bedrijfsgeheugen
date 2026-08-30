import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const policyPath = 'config/make-agent-resume-learning-guard.json';
const incidentPath = 'brain/learning/incidents/make-agent-unconditional-bg168-resume-hazard-2026-08-31.json';

test('Make agent resume gate is fail-closed until caller-side learning guards exist', async () => {
  const policy = JSON.parse(await readFile(policyPath, 'utf8'));
  assert.equal(policy.version, 'MAKE-AGENT-RESUME-LEARNING-GUARD-v1');
  assert.equal(policy.resumeAllowed, false);
  assert.equal(policy.state, 'BLOCKED_PENDING_CALLER_GUARDS_AND_RUNTIME_EVIDENCE');
  assert.deepEqual(policy.confirmedAffectedScenarioIds.sort((a,b)=>a-b), [7088558,7088574,7088579,7088656,7089148]);
  assert.equal(policy.invariants.nonMaterialOutcomeBG168Calls, 0);
  assert.equal(policy.invariants.materialOutcomeBG168CallsMax, 1);
  assert.equal(policy.invariants.learningFailurePreservesPrimaryResult, true);
  assert.equal(policy.invariants.pausedWithIsActiveTrueCountsAsDisabled, false);
  assert.equal(policy.invariants.paidCapacityIncreaseAllowedAutonomously, false);
});

test('resume hazard incident retains evidence without secrets', async () => {
  const incidentText = await readFile(incidentPath, 'utf8');
  const incident = JSON.parse(incidentText);
  assert.equal(incident.fingerprint, 'make|agent-template|unconditional-bg168-dispatch-on-resume-v1');
  assert.equal(incident.pattern, 'paused-isActive-resume-hazard-v1');
  assert.equal(incident.status, 'CONTAINED_BY_TEAM_PAUSE_NOT_STRUCTURALLY_FIXED');
  assert.equal(incident.confirmedAffectedAgents.length, 5);
  assert.ok(incident.preventionRules.includes('Decide materiality before invoking BG168; internal BG168 classification cannot eliminate invocation cost already incurred.'));
  assert.ok(incident.preventionRules.includes('Do not treat Make status=paused with isActive=true as a structural deactivation or completed fix.'));
  assert.ok(!incidentText.includes('refresh_capability'));
  assert.ok(!incidentText.includes('capabilityToken'));
});
