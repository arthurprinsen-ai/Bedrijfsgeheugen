import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beginMaterialRun, completeMaterialRun, UNIVERSAL_INGRESS_VERSION } from '../scripts/brain/powerhouse-universal-runtime-ingress.mjs';
import { REQUIRED_COMPLETION_CATEGORIES } from '../scripts/brain/powerhouse-universal-completion-gate.mjs';
import { AGENT_FABRIC_COMMANDS, createAgentFabricGateway } from '../platform/api/agent-fabric-gateway.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const observedAt = '2026-09-17T18:45:00.000Z';

function fakeFabric() {
  return {
    intake: payload => payload,
    intakeOpportunity: payload => payload,
    transition: payload => payload,
    recordLearning: payload => payload,
    getWork: id => ({ id }),
    listWork: query => [query],
    suggestLearning: payload => [payload],
  };
}

function completeManifest({ runId = 'run-1', candidateId = 'sha-abc' } = {}) {
  const evidence = () => ({ state: 'COMPLETE', evidence: [{ source: 'test', observedAt }] });
  return {
    version: 'POWERHOUSE-UNIVERSAL-COMPLETION-MANIFEST-v1',
    runId,
    terminalState: 'LIVE & BEWEZEN',
    candidateId,
    categories: Object.fromEntries(REQUIRED_COMPLETION_CATEGORIES.map(name => [name, evidence()])),
    openObligations: [],
    canonicalWriteback: ['brain/learning/universal-ingress-test.json'],
    productionReadback: { candidateId, source: 'production-test', observedAt },
  };
}

test('universal ingress policy covers every managed material actor class', () => {
  const policy = JSON.parse(fs.readFileSync(path.join(rootDir, 'config/powerhouse-universal-ingress-v1.json'), 'utf8'));
  assert.equal(policy.version, 'POWERHOUSE-UNIVERSAL-INGRESS-v1');
  assert.equal(policy.status, 'ACTIVE');
  assert.equal(policy.fail_closed, true);
  for (const actorKind of ['chat','agent','workflow','scheduled','portal','cockpit','edge_function','runtime']) {
    assert.ok(policy.actor_kinds.includes(actorKind), `missing actor kind ${actorKind}`);
  }
});

test('beginMaterialRun creates a READY identity-bound immutable receipt', () => {
  const receipt = beginMaterialRun({
    rootDir,
    runId: 'run-1',
    actorKind: 'agent',
    actorId: 'agent:test',
    candidateId: 'sha-abc',
    observedAt,
  });
  assert.equal(UNIVERSAL_INGRESS_VERSION, 'POWERHOUSE-UNIVERSAL-INGRESS-v1');
  assert.equal(receipt.status, 'ADMITTED');
  assert.equal(receipt.preflightStatus, 'READY');
  assert.equal(receipt.runId, 'run-1');
  assert.equal(receipt.candidateId, 'sha-abc');
  assert.equal(receipt.policyVersion, 'POWERHOUSE-UNIVERSAL-INGRESS-v1');
  assert.equal(receipt.completionPolicyVersion, 'POWERHOUSE-UNIVERSAL-COMPLETION-v1');
  assert.equal(receipt.skillVersion, 'POWERHOUSE-LEARNING-SKILL-INDEX-v1');
  assert.equal(receipt.deliveryVersion, 'POWERHOUSE-GITHUB-DELIVERY-STATE-MACHINE-v1');
  assert.match(receipt.skillProjectionDigest, /^[a-f0-9]{64}$/);
  assert.match(receipt.preflightDigest, /^[a-f0-9]{64}$/);
  assert.match(receipt.receiptDigest, /^[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(receipt), true);
});

test('equivalent ingress identity and preflight produce stable digests', () => {
  const input = { rootDir, runId: 'run-stable', actorKind: 'chat', actorId: 'chat:managed', candidateId: 'sha-stable' };
  const first = beginMaterialRun({ ...input, observedAt: '2026-09-17T18:45:00.000Z' });
  const second = beginMaterialRun({ ...input, observedAt: '2026-09-17T18:46:00.000Z' });
  assert.equal(first.preflightDigest, second.preflightDigest);
  assert.equal(first.receiptDigest, second.receiptDigest);
  assert.notEqual(first.observedAt, second.observedAt);
});

test('beginMaterialRun fails closed on incomplete or unsupported identity', () => {
  assert.throws(() => beginMaterialRun({ rootDir, runId: '', actorKind: 'agent', actorId: 'agent:x', candidateId: 'sha-x', observedAt }), /runId/i);
  assert.throws(() => beginMaterialRun({ rootDir, runId: 'run-x', actorKind: 'unknown', actorId: 'x', candidateId: 'sha-x', observedAt }), /actorKind/i);
  assert.throws(() => beginMaterialRun({ rootDir, runId: 'run-x', actorKind: 'agent', actorId: '', candidateId: 'sha-x', observedAt }), /actorId/i);
  assert.throws(() => beginMaterialRun({ rootDir, runId: 'run-x', actorKind: 'agent', actorId: 'agent:x', candidateId: '', observedAt }), /candidateId/i);
});

test('completeMaterialRun requires exact ingress/run/candidate continuity', () => {
  const ingressReceipt = beginMaterialRun({ rootDir, runId: 'run-1', actorKind: 'agent', actorId: 'agent:test', candidateId: 'sha-abc', observedAt });
  const result = completeMaterialRun({ ingressReceipt, manifest: completeManifest() });
  assert.equal(result.ok, true);
  assert.equal(result.ingressReceipt.receiptDigest, ingressReceipt.receiptDigest);

  assert.throws(
    () => completeMaterialRun({ ingressReceipt, manifest: completeManifest({ runId: 'run-other' }) }),
    /INGRESS_IDENTITY_MISMATCH.*runId/i,
  );
  assert.throws(
    () => completeMaterialRun({ ingressReceipt, manifest: completeManifest({ candidateId: 'sha-other' }) }),
    /INGRESS_IDENTITY_MISMATCH.*candidateId/i,
  );
});

test('Agent Fabric material commands fail closed without runtime identity', async () => {
  const gateway = createAgentFabricGateway({ fabric: fakeFabric(), rootDir });
  await assert.rejects(
    () => gateway.command({ type: AGENT_FABRIC_COMMANDS.INTAKE_SIGNAL, payload: { tenantId: 'A' } }),
    /runtime identity is required/i,
  );
});

test('Agent Fabric command runs canonical preflight before mutation and injects its receipt', async () => {
  const gateway = createAgentFabricGateway({ fabric: fakeFabric(), rootDir });
  const result = await gateway.command({
    type: AGENT_FABRIC_COMMANDS.INTAKE_SIGNAL,
    runtime: { runId: 'run-gw', actorKind: 'agent', actorId: 'agent:gateway', candidateId: 'sha-gw' },
    payload: { tenantId: 'A' },
  });
  assert.equal(result.tenantId, 'A');
  assert.equal(result.runtimeIngressReceipt.version, 'POWERHOUSE-UNIVERSAL-INGRESS-v1');
  assert.equal(result.runtimeIngressReceipt.status, 'ADMITTED');
  assert.equal(result.runtimeIngressReceipt.preflightStatus, 'READY');
  assert.equal(result.runtimeIngressReceipt.runId, 'run-gw');
  assert.equal(result.runtimeIngressReceipt.candidateId, 'sha-gw');
  assert.match(result.runtimeIngressReceipt.preflightDigest, /^[a-f0-9]{64}$/);
});


test('completion rejects stale canonical version bindings', () => {
  const ingressReceipt = beginMaterialRun({ rootDir, runId:'run-stale', actorKind:'agent', actorId:'agent:test', candidateId:'sha-stale', observedAt });
  const original = fs.readFileSync(path.join(rootDir,'config/powerhouse-github-delivery-state-machine-v1.json'),'utf8');
  const parsed = JSON.parse(original);
  parsed.version = parsed.version + '-TEST-DRIFT';
  const tempRoot = fs.mkdtempSync(path.join(process.cwd(), '.tmp-ingress-'));
  fs.cpSync(rootDir,tempRoot,{recursive:true});
  fs.writeFileSync(path.join(tempRoot,'config/powerhouse-github-delivery-state-machine-v1.json'),JSON.stringify(parsed,null,2));
  assert.throws(
    () => completeMaterialRun({ ingressReceipt, manifest:completeManifest({ runId:'run-stale', candidateId:'sha-stale' }), rootDir:tempRoot }),
    /INGRESS_VERSION_STALE deliveryVersion/
  );
  fs.rmSync(tempRoot,{recursive:true,force:true});
});
