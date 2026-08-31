import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtimeUrl = new URL('../portal/runtime-telemetry.mjs', import.meta.url);
const indexUrl = new URL('../portal/index.html', import.meta.url);

test('portal RUM binds every metric to exact Netlify release commit identity', async () => {
  const runtime = await readFile(runtimeUrl, 'utf8');
  const html = await readFile(indexUrl, 'utf8');
  assert.ok(runtime.includes("fetch('/release.json'"), 'RUM must read machine-generated production release evidence');
  assert.ok(runtime.includes('commit_ref'), 'RUM must use release.json commit_ref');
  assert.ok(runtime.includes('/^[a-f0-9]{40}$/i'), 'RUM must reject non-exact source revisions');
  assert.equal(html.includes('content="whole-brain-v2"'), false, 'static revision labels are not production identity');
});

test('portal RUM emits each metric at most once per session and route', async () => {
  const runtime = await readFile(runtimeUrl, 'utf8');
  assert.ok(runtime.includes('bg-rum-sent:'), 'RUM needs a durable per-session dedupe key');
  assert.ok(runtime.includes('sessionStorage.setItem'), 'successful scheduling must mark the metric as sent for the session');
});
