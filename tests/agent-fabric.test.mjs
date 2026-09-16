import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentRegistry } from '../platform/agents/agent-registry.mjs';
import { createAgentFabric } from '../platform/agents/agent-fabric.mjs';
import { createLearningMemory } from '../platform/agents/learning-memory.mjs';

const agents = [
  { id:'agent-ux', domains:['Website','UX'], capabilities:['analyze','design'] },
  { id:'agent-seo', domains:['Website','SEO'], capabilities:['analyze','optimize'] },
  { id:'agent-security', domains:['Security'], capabilities:['analyze','harden'] },
  { id:'agent-cost', domains:['Cost','Operations'], capabilities:['analyze','optimize'] },
];

const registry = () => createAgentRegistry(agents);

function advanceToVerifying(fabric, workId) {
  fabric.transition({ workId, status:'Investigating' });
  fabric.transition({ workId, status:'FixPrepared' });
  fabric.transition({ workId, status:'Executing' });
  return fabric.transition({ workId, status:'Verifying' });
}

function liveCompletionContext(obligationId, candidateIdentity, productionIdentity) {
  return {
    obligationId,
    workId:'ignored-by-fabric',
    candidateIdentity,
    productionIdentity,
    materialObligations:[{ id:obligationId, status:'COMPLETED' }],
    evidence:[
      { type:'CANDIDATE_TESTS', producer:'BRAIN_DELIVERY', accepted:true, independent:true, taskIdentity:obligationId, candidateIdentity },
      ...['PROTECTED_DELIVERY:BG169','PRODUCTION_IDENTITY:BG169','FUNCTIONAL_READBACK:PRODUCTION_READBACK','OBLIGATIONS_COMPLETE:OUTCOME_OBLIGATION_RUNTIME','CAPABILITY_HANDOFF:BG167','LEARNING_WRITEBACK:BG168_BG166'].map(value => {
        const [type, producer] = value.split(':');
        return { type, producer, accepted:true, independent:true, taskIdentity:obligationId, candidateIdentity, productionIdentity };
      }),
    ],
  };
}

function hardBoundaryContext() {
  return {
    obligationId:'completion-hard-boundary',
    workId:'ignored-by-fabric',
    candidateIdentity:'candidate-boundary',
    materialObligations:[{ id:'production-smoke', status:'OPEN' }],
    hardBoundary:{
      present:true,
      proven:true,
      evidence:'provider:403',
      recovery_packet:{
        blocker:'External control blocks recovery',
        root_cause:'Provider denied the required control change',
        evidence_refs:['provider:403'],
        attempted_repairs:['read current provider state'],
        safe_remaining_actions:['retain last-known-good'],
        minimum_human_action:'enable the existing provider control',
        fix_agent_handoff:'resume completion-hard-boundary after provider readback',
        boundary_fingerprint:'provider|control|403',
        resume_when:{ type:'evidence', ref:'provider-control:available' },
      },
    },
  };
}

test('registry selects a deterministic primary owner and cross-domain support agents', () => {
  const routed = registry().route({ domains:['Website','SEO','UX'], capabilities:['analyze'] });
  assert.equal(routed.primaryAgentId, 'agent-seo');
  assert.deepEqual(routed.supportAgentIds, ['agent-ux']);
});

test('registry fails closed when no eligible agent exists', () => {
  assert.throws(() => registry().route({ domains:['Finance'], capabilities:['reconcile'] }), /no eligible agent/i);
});

test('registry rejects duplicate agent identities', () => {
  assert.throws(() => createAgentRegistry([agents[0], { ...agents[0] }]), /duplicate agent id/i);
});

test('duplicate active signals collapse into one shared AgentWork item', () => {
  const fabric = createAgentFabric({ registry:registry(), now:() => '2026-08-29T12:00:00.000Z' });
  const signal = { tenantId:'TENANT-A', kind:'Failure', problemClass:'website-regression', priority:'P1', domains:['Website','SEO'], capabilities:['analyze'], affectedObjectIds:['page-home'], problem:'Homepage metadata regressed', evidence:['seo-check-1'] };
  const first = fabric.intake(signal);
  const second = fabric.intake({ ...signal, evidence:['seo-check-2'] });
  assert.equal(first.id, second.id);
  assert.equal(fabric.listWork({ tenantId:'TENANT-A' }).length, 1);
  assert.equal(first.primaryAgentId, 'agent-seo');
});

test('cross-domain intake creates one owner with collaborating support agents', () => {
  const fabric = createAgentFabric({ registry:registry() });
  const work = fabric.intake({ tenantId:'TENANT-A', kind:'Failure', problemClass:'website-change', priority:'P1', domains:['Website','SEO','UX','Security'], capabilities:['analyze'], affectedObjectIds:['page-pricing'], problem:'Pricing page change impacts multiple domains', evidence:['change-17'] });
  assert.equal(work.primaryAgentId, 'agent-seo');
  assert.deepEqual(work.supportAgentIds, ['agent-ux','agent-security']);
  assert.equal(work.status, 'Assigned');
});

test('AgentWork transitions through the shared lifecycle and rejects invalid jumps', () => {
  const fabric = createAgentFabric({ registry:registry() });
  const work = fabric.intake({ tenantId:'TENANT-A', kind:'Failure', problemClass:'cost-spike', priority:'P2', domains:['Cost'], capabilities:['analyze'], affectedObjectIds:['make-scenario-4'], problem:'Operations cost spike' });
  const investigating = fabric.transition({ workId:work.id, status:'Investigating', evidence:['cost-trace'] });
  assert.equal(investigating.status, 'Investigating');
  assert.deepEqual(investigating.evidence, ['cost-trace']);
  assert.throws(() => fabric.transition({ workId:work.id, status:'Resolved' }), /invalid AgentWork transition/i);
});

test('AgentWork cannot resolve while a material obligation is still open', () => {
  const fabric = createAgentFabric({ registry:registry() });
  const work = fabric.intake({ tenantId:'TENANT-A', kind:'Failure', problemClass:'production-regression', priority:'P1', domains:['Website'], capabilities:['analyze'], affectedObjectIds:['portal'], problem:'Production regression' });
  advanceToVerifying(fabric, work.id);

  assert.throws(() => fabric.transition({
    workId:work.id,
    status:'Resolved',
    completionContext:{
      localGreen:true,
      materialObligations:[
        { id:'tests', status:'GREEN' },
        { id:'production-smoke', status:'OPEN' }
      ]
    }
  }), /completion readiness/i);
  assert.equal(fabric.getWork(work.id).status, 'Verifying');
});

test('AgentWork resolves only when every material obligation is terminal', () => {
  const fabric = createAgentFabric({ registry:registry() });
  const work = fabric.intake({ tenantId:'TENANT-A', kind:'Failure', problemClass:'production-regression-green', priority:'P1', domains:['Website'], capabilities:['analyze'], affectedObjectIds:['portal'], problem:'Verified production recovery' });
  advanceToVerifying(fabric, work.id);

  const resolved = fabric.transition({
    workId:work.id,
    status:'Resolved',
    completionContext:liveCompletionContext('completion-green', 'candidate-green', 'production-green'),
  });
  assert.equal(resolved.status, 'Resolved');
});

test('AgentWork waits at an explicitly proven hard boundary and never resolves', () => {
  const fabric = createAgentFabric({ registry:registry() });
  const signal = { tenantId:'TENANT-A', kind:'Failure', problemClass:'external-hard-boundary', priority:'P1', domains:['Website'], capabilities:['analyze'], affectedObjectIds:['portal'], problem:'External control blocks recovery' };
  const work = fabric.intake(signal);
  advanceToVerifying(fabric, work.id);

  assert.throws(() => fabric.transition({
    workId:work.id,
    status:'Resolved',
    completionContext:hardBoundaryContext(),
  }), /completion readiness/i);

  const waiting = fabric.transition({ workId:work.id, status:'WaitingApproval', completionContext:hardBoundaryContext() });
  assert.equal(waiting.status, 'WaitingApproval');
  assert.equal(fabric.intake(signal).id, work.id);

  const resumed = fabric.resume({ workId:work.id, evidence:['provider-control:available'] });
  assert.equal(resumed.id, work.id);
  assert.equal(resumed.status, 'Investigating');
  assert.deepEqual(resumed.evidence, ['provider-control:available']);
});

test('AgentWork rejects WaitingApproval when the recovery packet is incomplete', () => {
  const fabric = createAgentFabric({ registry:registry() });
  const work = fabric.intake({ tenantId:'TENANT-A', kind:'Failure', problemClass:'incomplete-boundary', priority:'P1', domains:['Website'], capabilities:['analyze'], affectedObjectIds:['portal'], problem:'Incomplete boundary' });
  advanceToVerifying(fabric, work.id);
  const context = hardBoundaryContext();
  delete context.hardBoundary.recovery_packet.minimum_human_action;
  assert.throws(() => fabric.transition({ workId:work.id, status:'WaitingApproval', completionContext:context }), /waiting readiness/i);
});

test('learning memory rejects outcomes without verification evidence', () => {
  const memory = createLearningMemory();
  assert.throws(() => memory.recordVerified({ tenantId:'TENANT-A', fingerprint:'pattern-1', domains:['SEO'], verified:false, evidence:[] }), /verified learning requires/i);
});

test('verified learning can be reused by another specialist in the same tenant', () => {
  const memory = createLearningMemory();
  const saved = memory.recordVerified({ tenantId:'TENANT-A', fingerprint:'website-regression', domains:['Website','SEO'], sourceAgentId:'agent-seo', actionFingerprint:'restore-canonical-meta', verified:true, evidence:['regression-green','production-smoke-green'], impact:{ seoHealth:'+12' }, confidence:0.96 });
  const matches = memory.findMatches({ tenantId:'TENANT-A', domains:['Website','UX'], fingerprint:'website-regression' });
  assert.equal(matches.length, 1);
  assert.equal(matches[0].id, saved.id);
  const reused = memory.markReused(saved.id, { agentId:'agent-ux' });
  assert.equal(reused.reuseCount, 1);
  assert.deepEqual(reused.reusedByAgentIds, ['agent-ux']);
});

test('shared learning never crosses tenant boundaries', () => {
  const memory = createLearningMemory();
  memory.recordVerified({ tenantId:'TENANT-A', fingerprint:'cost-spike', domains:['Cost'], sourceAgentId:'agent-cost', actionFingerprint:'batch-requests', verified:true, evidence:['cost-check-green'], impact:{ monthlyCost:-20 }, confidence:0.9 });
  assert.deepEqual(memory.findMatches({ tenantId:'TENANT-B', domains:['Cost'], fingerprint:'cost-spike' }), []);
});

test('Agent Fabric attaches matching prior learning to another agent work item', () => {
  const memory = createLearningMemory();
  memory.recordVerified({ tenantId:'TENANT-A', fingerprint:'website-regression', domains:['Website','SEO'], sourceAgentId:'agent-seo', actionFingerprint:'restore-canonical-meta', verified:true, evidence:['prod-green'], impact:{ seoHealth:'+12' }, confidence:0.95 });
  const fabric = createAgentFabric({ registry:registry(), learningMemory:memory });
  const work = fabric.intake({ tenantId:'TENANT-A', kind:'Failure', problemClass:'website-regression', priority:'P1', domains:['Website','UX'], capabilities:['analyze'], affectedObjectIds:['page-about'], problem:'Another website regression' });
  const suggestions = fabric.suggestLearning({ workId:work.id, requesterAgentId:'agent-ux' });
  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0].actionFingerprint, 'restore-canonical-meta');
});

test('proactive opportunities use the same governed AgentWork lifecycle', () => {
  const fabric = createAgentFabric({ registry:registry() });
  const work = fabric.intakeOpportunity({ tenantId:'TENANT-A', problemClass:'make-cost-reduction', domains:['Cost','Operations'], capabilities:['optimize'], affectedObjectIds:['make-all'], problem:'Reduce Make operations', materiality:5, urgency:4, expectedValue:5, risk:2, confidence:0.9 });
  assert.equal(work.trigger, 'OPPORTUNITY_DETECTED');
  assert.equal(work.primaryAgentId, 'agent-cost');
  assert.equal(work.status, 'Assigned');
  assert.equal(work.priority, 'P1');
});

test('opportunity priority is lower when expected value and confidence are low', () => {
  const fabric = createAgentFabric({ registry:registry() });
  const work = fabric.intakeOpportunity({ tenantId:'TENANT-A', problemClass:'small-seo-experiment', domains:['SEO'], capabilities:['optimize'], affectedObjectIds:['blog-1'], problem:'Small SEO tweak', materiality:1, urgency:1, expectedValue:1, risk:1, confidence:0.3 });
  assert.equal(work.priority, 'P3');
});
