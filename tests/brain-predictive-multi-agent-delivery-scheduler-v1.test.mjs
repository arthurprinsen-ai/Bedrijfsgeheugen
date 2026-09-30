import test from 'node:test';
import assert from 'node:assert/strict';
import { planConcurrentAgentWork, buildResumableCheckpoint } from '../tools/delivery/predictive-controller.mjs';

test('same obligation parks behind canonical writer but continues independent work',()=>{
 const r=planConcurrentAgentWork({obligationId:'O1',currentHead:'h2',currentMain:'m1',activeCandidates:[{obligationId:'O1',headSha:'h1',active:true}],queue:{inProgress:1},projectedNewRuns:1});
 assert.equal(r.state,'PARK_BEHIND_CANONICAL_WRITER'); assert.equal(r.canMutateCandidate,false); assert.equal(r.canContinueIndependentWork,true);
});
test('non-conflicting obligations build in parallel',()=>{
 const r=planConcurrentAgentWork({obligationId:'O2',currentHead:'h2',currentMain:'m1',changedPaths:['site/a'],conflictContracts:['website'],activeCandidates:[{obligationId:'O1',headSha:'h1',active:true,changedPaths:['supabase/a'],conflictContracts:['schema']}],queue:{inProgress:1},projectedNewRuns:1});
 assert.equal(r.state,'BUILD_PARALLEL'); assert.equal(r.canMutateCandidate,true);
});
test('terminal overlap serializes landing only',()=>{
 const r=planConcurrentAgentWork({obligationId:'O2',currentHead:'h2',currentMain:'m1',terminalIntent:true,changedPaths:['AGENTS.md'],conflictContracts:['delivery-control-plane'],activeCandidates:[{obligationId:'O1',headSha:'h1',active:true,changedPaths:['AGENTS.md'],conflictContracts:['delivery-control-plane']}],queue:{inProgress:1},projectedNewRuns:1});
 assert.equal(r.state,'SERIALIZE_TERMINAL_LANDING'); assert.equal(r.canContinueIndependentWork,true);
});
test('predicted overload batches before mutation',()=>{ const r=planConcurrentAgentWork({obligationId:'O2',currentHead:'h2',currentMain:'m1',queue:{queued:7,inProgress:3},projectedNewRuns:3}); assert.equal(r.state,'BATCH_BEFORE_MUTATION'); });
test('checkpoint can resume without chat context',()=>{ const cp=buildResumableCheckpoint({obligationId:'O1',candidateHead:'h1',mainEpoch:'m1',openGates:['Required test'],nextSafeAction:'read exact-head run'}); assert.equal(cp.version,'POWERHOUSE-ASYNC-CHECKPOINT-v1'); assert.equal(cp.terminal,false); });


test('scheduler config stays automation-scoped instead of waking portal and website lanes', async()=>{
  const { createDeliveryPlan } = await import('../tools/brain-delivery-system.mjs');
  const policy = JSON.parse(await (await import('node:fs/promises')).readFile('config/brain-delivery-system.json','utf8'));
  const plan=createDeliveryPlan({changedPaths:['config/powerhouse-agent-delivery-scheduler-v1.json'],headSha:'1234567890abcdef1234567890abcdef12345678',policy});
  assert.deepEqual(plan.lanes.map(l=>l.id),['automation']);
});


test('complete scheduler governance bundle stays off portal and website lanes', async()=>{
  const { createDeliveryPlan } = await import('../tools/brain-delivery-system.mjs');
  const { readFile } = await import('node:fs/promises');
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json','utf8'));
  const plan=createDeliveryPlan({
    changedPaths:[
      'AGENTS.md',
      'brain/policies/powerhouse-agent-continuity-v1.json',
      'config/powerhouse-agent-delivery-scheduler-v1.json',
      'tools/delivery/predictive-controller.mjs',
      'tests/brain-predictive-multi-agent-delivery-scheduler-v1.test.mjs',
      'tools/brain-delivery-system.mjs',
      '.github/workflows/powerhouse-obligation-terminalizer.yml',
      'tests/brain-obligation-terminalizer-squash.test.mjs',
      'platform/system-map/canonical-system-map.mjs',
      'brain/learning/2026-09-30-predictive-multi-agent-delivery-scheduler-v1.json'
    ],
    headSha:'1234567890abcdef1234567890abcdef12345678',
    policy
  });
  assert.deepEqual(plan.lanes.map(l=>l.id),['automation','backend']);
});
