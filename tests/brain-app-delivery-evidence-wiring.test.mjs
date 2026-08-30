import test from 'node:test';
import assert from 'node:assert/strict';

import { createAppDeliveryAdapter } from '../brain/adapters/app-delivery.mjs';
import { createSupabaseEvidenceWriter } from '../brain/adapters/supabase-evidence.mjs';

const manifest = {
  contract: 'BRAIN-DELIVERY-v2',
  change_id: 'change-auto-evidence-001',
  component_id: 'external-app-delivery',
  registered: true,
  brain_context_loaded: true,
  learning_writeback_configured: true,
  gates: {
    contract: true,
    quality: true,
    security: true,
    cost_performance: true,
    preview: true,
  },
};

test('adapter construction fails closed without a real evidence writer', () => {
  assert.throws(
    () => createAppDeliveryAdapter({ target: 'notion', invoke: async () => ({ status: 200 }) }),
    /evidence writer is required/i,
  );
});

test('Supabase evidence writer inserts one normalized append-only record', async () => {
  const calls = [];
  const writer = createSupabaseEvidenceWriter({
    url: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-secret',
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return { ok: true, status: 201, text: async () => '' };
    },
  });

  await writer({
    contract: 'BRAIN-DELIVERY-v2',
    target: 'make',
    change_id: 'change-auto-evidence-001',
    component_id: 'BG193',
    idempotency_key: 'change-auto-evidence-001:make',
    status: 'GREEN',
    remote_status: 200,
    remote_ref: 'execution-123',
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://example.supabase.co/rest/v1/brain_delivery_evidence?on_conflict=idempotency_key');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers.apikey, 'service-role-secret');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer service-role-secret');
  assert.match(calls[0].init.headers.Prefer, /resolution=ignore-duplicates/);
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.contract, undefined);
  assert.equal(body.target, 'make');
  assert.equal(body.change_id, 'change-auto-evidence-001');
  assert.equal(body.idempotency_key, 'change-auto-evidence-001:make');
  assert.equal(body.status, 'GREEN');
});

test('delivery fails closed when persistent evidence cannot be written', async () => {
  let remoteCalls = 0;
  const adapter = createAppDeliveryAdapter({
    target: 'dataforseo',
    invoke: async () => {
      remoteCalls += 1;
      return { status: 200, body: { id: 'dfs-1' } };
    },
    writeEvidence: async () => {
      const error = new Error('evidence store unavailable');
      error.status = 503;
      throw error;
    },
  });

  const result = await adapter.deliver({
    manifest,
    payload: { capability: true },
    idempotency_key: 'change-auto-evidence-001:dataforseo',
  });

  assert.equal(remoteCalls, 1);
  assert.equal(result.ok, false);
  assert.equal(result.error_class, 'TRANSIENT');
  assert.match(result.reason, /evidence store unavailable/i);
});
