import test from 'node:test';
import assert from 'node:assert/strict';
import { createProviderRegistry } from '../platform/intelligence/provider-registry.mjs';
import { ACTIONS, DECISIONS } from '../platform/policy/policy-engine.mjs';
import { TRUTH_CLASSES, LIFECYCLE_STATES } from '../platform/contracts/canonical-object.mjs';
import { createBrainRuntime } from '../platform/brain/runtime.mjs';

function fixture() {
  const providerRegistry = createProviderRegistry([{
    id: 'FAKE-MODEL', provider: 'deterministic-test', model: 'fake-v1', status: 'Approved',
    allowedDataClasses: ['Internal'], allowedPurposes: ['management-insight'],
    trainingAllowed: false, persistentProviderMemory: false,
  }]);

  const policies = [
    { id:'P-VIEW', subjectId:'manager', action:ACTIONS.VIEW, resourceType:'ExternalSignal', tenantId:'T1', decision:DECISIONS.ALLOW },
    { id:'P-AI', subjectId:'manager', action:ACTIONS.AI_PROCESS, resourceType:'ExternalSignal', purpose:'management-insight', dataClass:'Internal', tenantId:'T1', decision:DECISIONS.ALLOW },
    { id:'P-EXEC', subjectId:'manager', action:ACTIONS.EXECUTE, resourceType:'Change', tenantId:'T1', decision:DECISIONS.ALLOW },
    { id:'P-VIEW-ONLY', subjectId:'viewer', action:ACTIONS.VIEW, resourceType:'ExternalSignal', tenantId:'T1', decision:DECISIONS.ALLOW },
  ];

  const providerCalls = [];
  const executions = [];
  const aiProvider = Object.freeze({
    async analyze(request) {
      providerCalls.push(structuredClone(request));
      return {
        type: 'Recommendation',
        text: 'Automatiseer de handmatige overdracht.',
        confidence: 0.91,
        evidenceRefs: [request.context.sourceRef],
        proposedAction: { kind:'AUTOMATE_HANDOFF', targetId:'PROCESS-1' },
      };
    },
  });
  const executor = Object.freeze({
    async execute(command) {
      executions.push(structuredClone(command));
      return { executionId:`EXEC-${executions.length}`, ok:true, observed:{ cycleTimeHours:4 } };
    },
  });

  const runtime = createBrainRuntime({
    policies, providerRegistry,
    contextPolicy:{ allowedFields:['summary','sourceRef','customerId'], pseudonymizeFields:['customerId'] },
    aiProvider, executor,
    now: () => '2026-08-29T12:00:00Z',
  });
  return { runtime, providerCalls, executions };
}

const sourceSignal = Object.freeze({
  id:'SIGNAL-1', tenantId:'T1', type:'ExternalSignal', summary:'Overdracht kost structureel te veel tijd',
  sourceRef:'SRC-CRM-42', customerId:'CUSTOMER-SECRET-123', privateNote:'NEVER-SEND-THIS',
  provenance:{ sourceType:'CRM', sourceRef:'CRM:42' }, idempotencyKey:'crm:42:v7',
});

test('brain runs source -> AI interpretation -> decision -> safe execution -> verification -> impact -> shared learning', async () => {
  const { runtime, providerCalls, executions } = fixture();
  const ingested = runtime.ingest(sourceSignal, { actorId:'source-adapter' });
  assert.equal(ingested.object.truthClass, TRUTH_CLASSES.SOURCE_FACT);
  assert.equal(ingested.object.lifecycle, LIFECYCLE_STATES.ACTIVE);
  assert.equal(ingested.event.schemaVersion, 1);
  assert.equal(ingested.event.tenantId, 'T1');
  assert.ok(ingested.event.correlationId);
  assert.equal(ingested.event.idempotencyKey, 'crm:42:v7');

  const replay = runtime.ingest(sourceSignal, { actorId:'source-adapter' });
  assert.equal(replay.object.id, ingested.object.id);
  assert.equal(runtime.snapshot().events.filter(e => e.idempotencyKey === 'crm:42:v7').length, 1);

  const analysis = await runtime.analyze({
    signalId:'SIGNAL-1', requesterId:'manager', aiUseCaseId:'AIUSE-MGMT', purpose:'management-insight',
    providerModelId:'FAKE-MODEL', dataClass:'Internal', correlationId:ingested.event.correlationId,
  });
  assert.equal(providerCalls.length, 1);
  assert.deepEqual(Object.keys(providerCalls[0].context).sort(), ['customerId','sourceRef','summary']);
  assert.equal(providerCalls[0].context.customerId, 'PSEUDO-19');
  assert.equal('privateNote' in providerCalls[0].context, false);
  assert.equal(analysis.recommendation.truthClass, TRUTH_CLASSES.AI_INTERPRETATION);
  assert.notEqual(analysis.recommendation.truthClass, TRUTH_CLASSES.BUSINESS_TRUTH);
  assert.equal(analysis.recommendation.lifecycle, LIFECYCLE_STATES.REVIEW);

  const decision = runtime.recordDecision({ recommendationId:analysis.recommendation.id, requesterId:'manager', approved:true, reason:'Management approval' });
  assert.equal(decision.decision.truthClass, TRUTH_CLASSES.BUSINESS_TRUTH);
  assert.equal(decision.change.lifecycle, LIFECYCLE_STATES.APPROVED);

  const executed = await runtime.executeChange({ changeId:decision.change.id, requesterId:'manager', risk:'Low', blastRadius:'Low', reversible:true, testsAvailable:true, verifierAvailable:true, budgetAvailable:true });
  assert.equal(executions.length, 1);
  assert.equal(executed.change.lifecycle, LIFECYCLE_STATES.ACTIVE);

  const closed = runtime.verifyAndLearn({ changeId:decision.change.id, requesterId:'manager', regressionPassed:true, productionSmokePassed:true, expectedStateObserved:true, expectedImpact:{ cycleTimeHours:8 }, observedImpact:{ cycleTimeHours:4 } });
  assert.equal(closed.verification.status, 'Verified');
  assert.equal(closed.impact.status, 'Verified');
  assert.equal(closed.learning.shared, true);
  assert.equal(runtime.snapshot().learning.length, 1);
  assert.equal(runtime.snapshot().activeObjects.get(decision.change.id).lifecycle, LIFECYCLE_STATES.ACTIVE);
});

test('view permission does not imply AI processing permission and cross-tenant access fails closed', async () => {
  const { runtime, providerCalls } = fixture();
  runtime.ingest(sourceSignal, { actorId:'source-adapter' });
  await assert.rejects(() => runtime.analyze({ signalId:'SIGNAL-1', requesterId:'viewer', aiUseCaseId:'AIUSE-MGMT', purpose:'management-insight', providerModelId:'FAKE-MODEL', dataClass:'Internal' }), /AI processing denied/i);
  await assert.rejects(() => runtime.analyze({ signalId:'SIGNAL-1', requesterId:'manager', tenantId:'T2', aiUseCaseId:'AIUSE-MGMT', purpose:'management-insight', providerModelId:'FAKE-MODEL', dataClass:'Internal' }), /tenant/i);
  assert.equal(providerCalls.length, 0);
});

test('high-risk autonomous execution is blocked and WORKING never silently replaces ACTIVE', async () => {
  const { runtime, executions } = fixture();
  const ingested = runtime.ingest(sourceSignal, { actorId:'source-adapter' });
  const analysis = await runtime.analyze({ signalId:'SIGNAL-1', requesterId:'manager', aiUseCaseId:'AIUSE-MGMT', purpose:'management-insight', providerModelId:'FAKE-MODEL', dataClass:'Internal', correlationId:ingested.event.correlationId });
  const decision = runtime.recordDecision({ recommendationId:analysis.recommendation.id, requesterId:'manager', approved:true, reason:'Proceed through governed change' });
  await assert.rejects(() => runtime.executeChange({ changeId:decision.change.id, requesterId:'manager', risk:'High', blastRadius:'High', reversible:true, testsAvailable:true, verifierAvailable:true, budgetAvailable:true }), /human|approval|high/i);
  assert.equal(executions.length, 0);
  assert.equal(runtime.snapshot().workingObjects.get(decision.change.id).lifecycle, LIFECYCLE_STATES.APPROVED);
  assert.equal(runtime.snapshot().activeObjects.has(decision.change.id), false);
});

test('self-healing fixes known safe failures but escalates unknown/high-impact failures without mutation', async () => {
  const { runtime, executions } = fixture();
  const safe = await runtime.selfHeal({ failureId:'FAIL-1', tenantId:'T1', actorId:'AGENT-INTEGRATION', knownPattern:true, risk:'Low', reversible:true, regressionTestAvailable:true, verificationAvailable:true, command:{ kind:'REFRESH_TOKEN' } });
  assert.equal(safe.state, 'Resolved');
  assert.equal(safe.learning.shared, true);
  const before = executions.length;
  const unsafe = await runtime.selfHeal({ failureId:'FAIL-2', tenantId:'T1', actorId:'AGENT-INTEGRATION', knownPattern:false, risk:'High', reversible:false, regressionTestAvailable:false, verificationAvailable:false, command:{ kind:'DELETE_DATA' } });
  assert.equal(unsafe.state, 'Escalated');
  assert.equal(executions.length, before);
});

test('audit/evidence are metadata-only: raw business payload and prompt are never persisted', async () => {
  const { runtime } = fixture();
  runtime.ingest(sourceSignal, { actorId:'source-adapter' });
  await runtime.analyze({ signalId:'SIGNAL-1', requesterId:'manager', aiUseCaseId:'AIUSE-MGMT', purpose:'management-insight', providerModelId:'FAKE-MODEL', dataClass:'Internal' });
  const serialized = JSON.stringify(runtime.snapshot().audit);
  assert.equal(serialized.includes('NEVER-SEND-THIS'), false);
  assert.equal(serialized.includes('CUSTOMER-SECRET-123'), false);
  assert.equal(serialized.toLowerCase().includes('prompt'), false);
  assert.ok(runtime.snapshot().audit.every(entry => entry.tenantId && entry.action && entry.correlationId));
});
