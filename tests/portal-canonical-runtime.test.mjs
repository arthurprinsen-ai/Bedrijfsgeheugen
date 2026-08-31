import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadCanonicalPortalState,
  createRuntimeReporter,
} from '../platform/client/portal-runtime.mjs';

test('canonical portal state wins through the authenticated production route', async () => {
  let fallbackCalls = 0;
  const calls = [];
  const canonical = { company: { name: 'Canonical BV' }, sourceMeta: { kind: 'canonical' } };
  const result = await loadCanonicalPortalState({
    authHeaders: { authorization: 'Bearer identity-jwt' },
    fetchFn: async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => ({ data: canonical }) }; },
    fallback: () => { fallbackCalls += 1; return { company: { name: 'Local BV' } }; },
  });
  assert.deepEqual(result, canonical);
  assert.equal(fallbackCalls, 0);
  assert.equal(calls[0].url, '/api/portal-state');
  assert.equal(calls[0].options.headers.authorization, 'Bearer identity-jwt');
});

test('local portal state is used only when canonical state is unavailable', async () => {
  const local = { company: { name: 'Local BV' } };
  const result = await loadCanonicalPortalState({
    fetchFn: async () => ({ ok: false, status: 503 }),
    fallback: () => local,
  });
  assert.deepEqual(result, local);
});

test('runtime reporter posts genuine elapsed timings once per metric and revision', async () => {
  const calls = [];
  const seen = new Set();
  const revision = '0123456789abcdef0123456789abcdef01234567';
  const reporter = createRuntimeReporter({
    authHeaders: { authorization: 'Bearer identity-jwt' },
    fetchFn: async (url, options) => { calls.push({ url, body: JSON.parse(options.body), headers: options.headers }); return { ok: true }; },
    revision,
    storage: {
      getItem: key => seen.has(key) ? '1' : null,
      setItem: key => { seen.add(key); },
    },
    sessionId: 'session-1',
  });

  await reporter.reportElapsed('cached_ms', 125.4, { route: '/klantportaal.html' });
  await reporter.reportElapsed('cached_ms', 999, { route: '/klantportaal.html' });
  await reporter.reportElapsed('interactive_ms', 876.6, { route: '/klantportaal.html' });

  assert.equal(calls.length, 2);
  assert.ok(calls.every(call => call.url === '/api/brain-runtime-metric'));
  assert.ok(calls.every(call => call.headers.authorization === 'Bearer identity-jwt'));
  assert.deepEqual(calls.map(call => call.body.metricName), ['cached_ms', 'interactive_ms']);
  assert.deepEqual(calls.map(call => call.body.metricValueMs), [125, 877]);
  assert.ok(calls.every(call => call.body.revision === revision));
  assert.ok(calls.every(call => call.body.sessionId === 'session-1'));
  assert.ok(calls.every(call => call.body.surface === 'klantportaal'));
});
