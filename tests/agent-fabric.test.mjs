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

const READY_PREFLIGHT = Object.freeze({
  version:'BRAIN-CHAT-LEARNING-PREFLIGHT-v1',
  status:'READY',
  contract:'config/brain-chat-learning-contract.json',
  totalBytes:1234,
  sources:Object.freeze([
    Object.freeze({ path:'brain/learning/chat-checkpoint.json', sha256:'a'.repeat(64) })
  ]),
  fingerprints:Object.freeze(['known-failure-v1']),
  preventions:Object.freeze(['reuse proven fix']),
  blockers:Object.freeze([]),
  resume_contracts:Object.freeze([]),
});

const registry = () => createAgentRegistry(agents);
const readyFabric = () => createAgentFabric({ registry:registry(), learningPreflight:() => READY_PREFLIGHT });

function advanceToVerifying(fabric, workId) {
  fabric.transition({ workId, status:'Investigating' });
  fabric.transition({ workId, status:'FixPrepared' });
  fabric.transition({ workId, status:'Executing' });
  return fabric.transition({ workId, status:'Verifying' });
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

test('AgentWork cannot enter execution without a READY chat-learning preflight', () => {
  const fabric = createAgentFabric({ registry:registry() });
  const work = fabric.intake({ tenantId:'TENANT-A', kind:'Failure', problemClass:'preflight-required', priority:'P1', domains:['Website'], capabilities:['analyze'], affectedObjectIds:['portal'], problem:'Execution must consume chat learning first' });
  fabric.transition({ workId:work.id, status:'Investigating' });
  fabric.transition({ workId:work.id, status:'FixPrepared' });

  assert.throws(
    () => fabric.transition({ workId:work.id, status:'Executing' }),
    /chat-learning preflight.*READY/i
  );
  assert.equal(fabric.getWork(work.id).status, 'FixPrepared');
});

test('AgentWork accepts READY preflight and stores only compact execution evidence', () => {
  const fabric = readyFabric();
  const work = fabric.intake({ tenantId:'TENANT-A', kind:'Failure', problemClass:'preflight-ready', priority:'P1', domains:['Website'], capabilities:['analyze'], affectedObjectIds:['portal'], problem:'Ready packet authorizes bounded execution' });
  fabric.transition({ workId:work.id, status:'Investigating' });
  fabric.transition({ workId:work.id, status:'FixPrepared' });
  const executing = fabric.transition({ workId:work.id, status:'Executing' });

  assert.equal(executing.status, 'Executing');
  const evidence = fabric.getMetadata(work.id).chatLearningPreflight;
  assert.equal(evidence.status, 'READY');
  assert.equal(evidence.version, 'BRAIN-CHAT-LEARNING-PREFLIGHT-v1');
  assert.equal(evidence.contract, 'config/brain-chat-learning-contract.json');
  assert.equal(evidence.sourceCount, 1);
  assert.deepEqual(evidence.sourceHashes, [{ path:'brain/learning/chat-checkpoint.json', sha256:'a'.repeat(64) }]);
  assert.match(evidence.packetFingerprint, /^[a-f0-9]{64}$/);
  assert.equal('preventions' in evidence, false);
  assert.equal('fingerprints' in evidence, false);
});

test('AgentWork rejects an incompatible chat-learning preflight version', () => {
  const fabric = createAgentFabric({ registry:registry(), learningPreflight:() => ({ ...READY_PREFLIGHT, version:'BRAIN-CHAT-LEARNING-PREFLIGHT-v0' }) });
  const work = fabric.intake({ tenantId:'TENANT-A', kind:'Failure', problemClass:'preflight-version', priority:'P1', domains:['Website'], capabilities:['analyze'], affectedObjectIds:['portal'], problem:'Stale preflight versions cannot authorize execution' });
  fabric.transition({ workId:work.id, status:'Investigating' });
  fabric.transition({ workId:work.id, status:'FixPrepared' });

  assert.throws(() => fabric.transition({ workId:work.id, status:'Executing' }), /chat-learning preflight.*version/i);
  assert.equal(fabric.getWork(work.id).status, 'FixPrepared');
});

test('AgentWork fails closed when the chat-learning preflight provider fails', () => {
  const fabric = createAgentFabric({ registry:registry(), learningPreflight:() => { throw new Error('source unavailable'); } });
  const work = fabric.intake({ tenantId:'TENANT-A', kind:'Failure', problemClass:'preflight-provider-failure', priority:'P1', domains:['Website'], capabilities:['analyze'], affectedObjectIds:['portal'], problem:'Provider failure cannot authorize execution' });
  fabric.transition({ workId:work.id, status:'Investigating' });
  fabric.transition({ workId:work.id, status:'FixPrepared' });

  assert.throws(() => fabric.transition({ workId:work.id, status:'Executing' }), /chat-learning preflight.*failed.*source unavailable/i);
  assert.equal(fabric.getWork(work.id).status, 'FixPrepared');
});

test('AgentWork cannot resolve while a material obligation is still open', () => {
  const fabric = readyFabric();
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
  const fabric = readyFabric();
  const work = fabric.intake({ tenantId:'TENANT-A', kind:'Failure', problemClass:'production-regression-green', priority:'P1', domains:['Website'], capabilities:['analyze'], affectedObjectIds:['portal'], problem:'Verified production recovery' });
  advanceToVerifying(fabric, work.id);

  const resolved = fabric.transition({
    workId:work.id,
    status:'Resolved',
    completionContext:{
      localGreen:true,
      materialObligations:[
        { id:'tests', status:'GREEN' },
        { id:'production-smoke', status:'VERIFIED' }
      ]
    }
  });
  assert.equal(resolved.status, 'Resolved');
});

test('AgentWork can stop non-green only at an explicitly proven hard boundary', () => {
  const fabric = readyFabric();
  const work = fabric.intake({ tenantId:'TENANT-A', kind:'Failure', problemClass:'external-hard-boundary', priority:'P1', domains:['Website'], capabilities:['analyze'], affectedObjectIds:['portal'], problem:'External control blocks recovery' });
  advanceToVerifying(fabric, work.id);

  const resolved = fabric.transition({
    workId:work.id,
    status:'Resolved',
    completionContext:{
      localGreen:false,
      materialObligations:[{ id:'production-smoke', status:'OPEN' }],
      hardBoundary:{ present:true, proven:true, evidence:'External provider denied the required control change.' }
    }
  });
  assert.equal(resolved.status, 'Resolved');
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
