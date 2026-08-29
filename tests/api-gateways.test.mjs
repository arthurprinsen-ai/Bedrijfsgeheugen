import test from 'node:test';
import assert from 'node:assert/strict';
import { createQueryGateway } from '../platform/api/query-gateway.mjs';
import { createCommand, authorizeAndPlanCommand } from '../platform/api/command-gateway.mjs';
import { runIntelligence } from '../platform/api/intelligence-gateway.mjs';
import { createProviderRegistry } from '../platform/intelligence/provider-registry.mjs';
import { ACTIONS, DATA_CLASSES, DECISIONS } from '../platform/policy/policy-engine.mjs';

test('query gateway never returns a read model before authorization', async () => {
  let called = false;
  const views = new Map([['ManagementSummaryView', async () => { called = true; return { name:'ManagementSummaryView', data:{ score:72 } }; }]]);
  const denied = createQueryGateway({ views, authorize:async()=>({decision:'DENY',reason:'NO_ACCESS'}) });
  await assert.rejects(() => denied.get({ tenantId:'T1', subjectId:'U1', viewName:'ManagementSummaryView' }), error => error.code === 'QUERY_DENIED');
  assert.equal(called, false);
  const allowed = createQueryGateway({ views, authorize:async()=>({decision:'ALLOW'}) });
  const result = await allowed.get({ tenantId:'T1', subjectId:'U1', viewName:'ManagementSummaryView' });
  assert.equal(result.permissionFiltered, true);
  assert.equal(result.data.score, 72);
});

test('command gateway enforces optimistic version and policy before emitting immutable event', async () => {
  const command = createCommand({ commandId:'CMD-1', tenantId:'T1', actorId:'U1', type:'EditGoal', objectId:'GOAL-1', resourceType:'Goal', action:ACTIONS.EDIT_DRAFT, expectedVersion:4, reason:'adjust target', payload:{ target:120 } });
  await assert.rejects(() => authorizeAndPlanCommand({ command, currentVersion:5, authorize:async()=>({decision:DECISIONS.ALLOW}) }), error => error.code === 'VERSION_CONFLICT');
  await assert.rejects(() => authorizeAndPlanCommand({ command, currentVersion:4, authorize:async()=>({decision:DECISIONS.REQUIRE_APPROVAL}) }), error => error.code === 'APPROVAL_REQUIRED');
  const planned = await authorizeAndPlanCommand({ command, currentVersion:4, authorize:async()=>({decision:DECISIONS.ALLOW}), now:()=> '2026-08-29T10:00:00Z' });
  assert.equal(planned.event.beforeVersion, 4);
  assert.equal(planned.event.afterVersion, 5);
  assert.equal(planned.event.idempotencyKey, 'CMD-1');
});

test('intelligence gateway sends only minimized authorized context and never returns it as stored request metadata', async () => {
  const providers = createProviderRegistry([{ id:'M1', provider:'Vendor', model:'Model', status:'Approved', allowedDataClasses:[DATA_CLASSES.INTERNAL], allowedPurposes:['SUMMARY'], trainingAllowed:false, persistentProviderMemory:false }]);
  const policies = [{ id:'P1', subjectId:'U1', action:ACTIONS.AI_PROCESS, resourceType:'Company', purpose:'SUMMARY', dataClass:DATA_CLASSES.INTERNAL, tenantId:'T1', decision:DECISIONS.ALLOW }];
  let seen;
  const output = await runIntelligence({
    request:{ requestId:'R1', tenantId:'T1', requesterId:'U1', aiUseCaseId:'AI1', purpose:'SUMMARY', resourceType:'Company', resourceId:'C1', providerModelId:'M1', dataClass:DATA_CLASSES.INTERNAL, context:{ score:72, secret:'never-send' } },
    policies, providerRegistry:providers, contextPolicy:{ allowedFields:['score'] }, allowPersistence:true,
    invokeModel:async authorized => { seen = authorized.context; return { type:'Finding', confidence:.9, provenance:{ model:'M1', sources:['C1'] } }; },
  });
  assert.deepEqual(seen, { score:72 });
  assert.equal(output.authorizedRequest.context, undefined);
  assert.equal(output.result.truthClass, 'AIInterpretation');
});
