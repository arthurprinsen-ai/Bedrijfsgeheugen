import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadCanonicalPortalState,
  createRuntimeReporter,
} from '../platform/client/portal-runtime.mjs';

test('canonical portal state wins when the authenticated endpoint returns 200', async () => {
  let fallbackCalls = 0;
  const canonical = { company: { name: 'Canonical BV' }, sourceMeta: { kind: 'canonical' } };
  const result = await loadCanonicalPortalState({
    fetchFn: async () => ({ ok: true, json: async () => ({ data: canonical }) }),
    fallback: () => { fallbackCalls += 1; return { company: { name: 'Local BV' } }; },
  });
  assert.deepEqual(result, canonical);
  assert.equal(fallbackCalls, 0);
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
    fetchFn: async (url, options) => { calls.push({ url, body: JSON.parse(options.body) }); return { ok: true }; },
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
  assert.deepEqual(calls.map(call => call.body.metricName), ['cached_ms', 'interactive_ms']);
  assert.deepEqual(calls.map(call => call.body.metricValueMs), [125, 877]);
  assert.ok(calls.every(call => call.body.revision === revision));
  assert.ok(calls.every(call => call.body.sessionId === 'session-1'));
  assert.ok(calls.every(call => call.body.surface === 'klantportaal'));
});
