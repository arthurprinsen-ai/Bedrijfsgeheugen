import test from 'node:test';
import assert from 'node:assert/strict';
import { createChangeEnvelope } from '../platform/delivery/change-envelope.mjs';

test('normalizes and freezes a repository change envelope', () => {
  const envelope=createChangeEnvelope({
    changeId:'chg-123', owner:'agent-portal', platform:'github',
    baseVersion:'a'.repeat(40), candidateVersion:'b'.repeat(40),
    changedResources:['portal/app.mjs','portal/app.mjs'],
    contractKeys:['portal-state:v4','portal-state:v4'],
    riskClass:'reversible', requiredGates:['portal-regression'],
    rollbackStrategy:'revert-merge', hardBoundary:false,
    expectedEvidence:['exact-production-sha']
  });
  assert.equal(envelope.platform,'github');
  assert.deepEqual(envelope.changedResources,['portal/app.mjs']);
  assert.deepEqual(envelope.contractKeys,['portal-state:v4']);
  assert.equal(Object.isFrozen(envelope),true);
  assert.equal(Object.isFrozen(envelope.contractKeys),true);
});

test('supports non-Git platform versions without forcing SHA format', () => {
  const envelope=createChangeEnvelope({
    changeId:'chg-supa-1', owner:'agent-data', platform:'supabase',
    baseVersion:'schema-v12', candidateVersion:'migration-20260830-01',
    changedResources:['table:portal_state'], contractKeys:['portal-state:v4'],
    riskClass:'reversible', requiredGates:['schema-validation'],
    rollbackStrategy:'down-migration', hardBoundary:false,
    expectedEvidence:['schema-readback']
  });
  assert.equal(envelope.baseVersion,'schema-v12');
  assert.equal(envelope.candidateVersion,'migration-20260830-01');
});

test('fails closed when ownership, platform or outcome evidence is missing', () => {
  const base={changeId:'chg-1',baseVersion:'v1',candidateVersion:'v2',changedResources:['x'],contractKeys:[],riskClass:'reversible',requiredGates:[],rollbackStrategy:'restore',hardBoundary:false,expectedEvidence:['readback']};
  assert.throws(()=>createChangeEnvelope({...base,platform:'github'}),/owner/i);
  assert.throws(()=>createChangeEnvelope({...base,owner:'agent'}),/platform/i);
  assert.throws(()=>createChangeEnvelope({...base,owner:'agent',platform:'notion',expectedEvidence:[]}),/evidence/i);
});
