import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createAppDeliveryAdapter,
  createCanonicalAppAdapters,
  classifyAdapterError,
  SUPPORTED_APP_TARGETS,
} from '../brain/adapters/app-delivery.mjs';

const validManifest = {
  contract: 'BRAIN-DELIVERY-v2',
  change_id: 'change-001',
  component_id: 'external-app-delivery',
  lane_id: 'backend',
  component_type: 'service',
  candidate_identity: 'sha:candidate',
  tested_identity: 'sha:candidate',
  registered: true,
  brain_context_loaded: true,
  learning_writeback_configured: true,
  rollback_identity: 'sha:previous',
  scopes: ['external-app-delivery'],
  dependencies: [],
  gates: {
    contract: true,
    quality: true,
    security: true,
    cost_performance: true,
    preview: true,
  },
  production: { status: 'PENDING', deployed_identity: '' },
};

test('supports the four canonical external application targets', () => {
  assert.deepEqual([...SUPPORTED_APP_TARGETS].sort(), ['dataforseo', 'make', 'notion', 'supabase']);
});

test('fails closed before remote execution when delivery contract is invalid', async () => {
  let calls = 0;
  const adapter = createAppDeliveryAdapter({
    target: 'notion',
    invoke: async () => { calls += 1; return { status: 200, body: { ok: true } }; },
  });
  const result = await adapter.deliver({
    manifest: { ...validManifest, contract: 'legacy-v1' },
    payload: { page_id: 'x' },
    idempotency_key: 'change-001:notion',
  });
  assert.equal(result.ok, false);
  assert.equal(result.error_class, 'POLICY');
  assert.equal(calls, 0);
});

test('fails closed when any required delivery gate is red', async () => {
  let calls = 0;
  const adapter = createAppDeliveryAdapter({
    target: 'dataforseo',
    invoke: async () => { calls += 1; return { status: 200 }; },
  });
  const result = await adapter.deliver({
    manifest: { ...validManifest, gates: { ...validManifest.gates, security: false } },
    payload: {},
    idempotency_key: 'change-001:dataforseo',
  });
  assert.equal(result.ok, false);
  assert.equal(result.error_class, 'POLICY');
  assert.equal(calls, 0);
});

test('deduplicates repeated deliveries by idempotency key', async () => {
  let calls = 0;
  const adapter = createAppDeliveryAdapter({
    target: 'make',
    invoke: async () => { calls += 1; return { status: 202, body: { accepted: true } }; },
  });
  const request = {
    manifest: validManifest,
    payload: { scenario: 'BG-test' },
    idempotency_key: 'change-001:make',
  };
  const first = await adapter.deliver(request);
  const second = await adapter.deliver(request);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(second.deduplicated, true);
  assert.equal(calls, 1);
});

test('writes normalized audit evidence for successful delivery', async () => {
  const evidence = [];
  const adapter = createAppDeliveryAdapter({
    target: 'supabase',
    invoke: async () => ({ status: 201, body: { id: 7 } }),
    writeEvidence: async record => evidence.push(record),
  });
  const result = await adapter.deliver({
    manifest: validManifest,
    payload: { table: 'brain_events', row: { id: 7 } },
    idempotency_key: 'change-001:supabase',
  });
  assert.equal(result.ok, true);
  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].contract, 'BRAIN-DELIVERY-v2');
  assert.equal(evidence[0].target, 'supabase');
  assert.equal(evidence[0].change_id, 'change-001');
  assert.equal(evidence[0].status, 'GREEN');
});

test('classifies remote failures deterministically', () => {
  assert.equal(classifyAdapterError({ status: 401 }), 'AUTH');
  assert.equal(classifyAdapterError({ status: 422 }), 'VALIDATION');
  assert.equal(classifyAdapterError({ status: 429 }), 'TRANSIENT');
  assert.equal(classifyAdapterError({ status: 503 }), 'TRANSIENT');
  assert.equal(classifyAdapterError({ status: 409 }), 'REMOTE');
});

test('rejects unknown targets', () => {
  assert.throws(
    () => createAppDeliveryAdapter({ target: 'random-app', invoke: async () => ({ status: 200 }) }),
    /Unsupported app delivery target/,
  );
});

test('canonical factory requires a concrete invoker for every external target', () => {
  const invoker = async () => ({ status: 200 });
  const adapters = createCanonicalAppAdapters({
    notion: invoker,
    make: invoker,
    supabase: invoker,
    dataforseo: invoker,
  });
  assert.deepEqual(Object.keys(adapters).sort(), ['dataforseo', 'make', 'notion', 'supabase']);
});
