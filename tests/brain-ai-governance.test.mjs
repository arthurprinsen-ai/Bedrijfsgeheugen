import test from 'node:test';
import assert from 'node:assert/strict';
import { projectAiGovernance } from '../brain/operating-loop/ai-governance.mjs';
import { createOperatingLoopStore } from '../brain/operating-loop/store.mjs';

const complete = {
  schemaVersion: 'brain-record.v1',
  tenantId: 'tenant-1',
  type: 'Governance',
  kind: 'governance',
  id: 'gov-ai-support',
  subjectId: 'ai-system:support-copilot',
  correlationId: 'ai-governance:support-copilot',
  owner: 'AI Governance Owner',
  status: 'ACTIVE',
  observedAt: '2026-08-31T12:00:00.000Z',
  executed: false,
  verified: true,
  result: null,
  evidenceIds: ['evidence-ai-inventory', 'evidence-risk-assessment'],
  references: ['evidence-ai-inventory', 'evidence-risk-assessment'],
  payload: {
    systemName: 'Support Copilot',
    provider: 'example-provider',
    model: 'example-model',
    purpose: 'Draft internal support answers',
    role: 'deployer',
    riskLevel: 'transparency',
    classificationSource: 'documented-assessment',
    dataCategories: ['support_text'],
    humanOversight: { required: true, control: 'human-approval-before-send' },
    transparencyControl: 'users-are-informed-ai-is-used',
    loggingControl: 'brain-evidence-ledger',
    reviewDueAt: '2026-11-30T00:00:00.000Z'
  },
  provenance: { source: 'brain', sourceId: 'gov-ai-support' },
  graph: { nodes: [], edges: [] }
};

test('AI governance projection is evidence-backed and fail-closed', () => {
  const projection = projectAiGovernance([complete], { now: '2026-08-31T13:00:00.000Z' });
  assert.equal(projection.systems.length, 1);
  assert.equal(projection.systems[0].readiness, 'EVIDENCED');
  assert.equal(projection.systems[0].riskLevel, 'transparency');
  assert.equal(projection.systems[0].humanOversight.control, 'human-approval-before-send');

  const incomplete = structuredClone(complete);
  incomplete.id = 'gov-ai-incomplete';
  incomplete.subjectId = 'ai-system:incomplete';
  incomplete.verified = false;
  incomplete.evidenceIds = [];
  delete incomplete.payload.classificationSource;
  delete incomplete.payload.transparencyControl;
  const failed = projectAiGovernance([incomplete], { now: '2026-08-31T13:00:00.000Z' });
  assert.equal(failed.systems[0].readiness, 'INCOMPLETE');
  assert.ok(failed.systems[0].missing.includes('verified_evidence'));
  assert.ok(failed.systems[0].missing.includes('classification_source'));
  assert.ok(failed.systems[0].missing.includes('transparency_control'));
});

test('unacceptable-risk registry entries are never production-ready by projection', () => {
  const prohibited = structuredClone(complete);
  prohibited.id = 'gov-ai-prohibited';
  prohibited.subjectId = 'ai-system:prohibited';
  prohibited.payload.riskLevel = 'unacceptable';
  const projection = projectAiGovernance([prohibited]);
  assert.equal(projection.systems[0].readiness, 'BLOCKED');
  assert.equal(projection.systems[0].productionAllowed, false);
});

test('operating store persists Governance records and exposes the registry projection', async () => {
  const map = new Map();
  const adapter = {
    async get(key) { return map.get(key) || null; },
    async put(key, value) { map.set(key, value); return value; },
    async list(prefix = '') { return [...map].filter(([key]) => key.startsWith(prefix)).map(([key, value]) => ({ key, value })); }
  };
  const store = createOperatingLoopStore(adapter, { now: () => '2026-08-31T13:00:00.000Z' });
  await store.append({
    tenantId: 'tenant-1',
    type: 'Governance',
    id: 'gov-ai-support',
    subjectId: 'ai-system:support-copilot',
    owner: 'AI Governance Owner',
    verified: true,
    evidenceIds: ['evidence-ai-inventory', 'evidence-risk-assessment'],
    idempotencyKey: 'governance|support-copilot|v1',
    payload: complete.payload
  });
  const projection = await store.getProjection('tenant-1');
  assert.equal(projection.aiGovernance.systems.length, 1);
  assert.equal(projection.aiGovernance.systems[0].systemName, 'Support Copilot');
  assert.equal(projection.aiGovernance.systems[0].readiness, 'EVIDENCED');
});
