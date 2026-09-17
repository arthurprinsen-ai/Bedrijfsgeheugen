import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyTask,
  buildStablePolicyPrefix,
  compactToolOutput,
  EvidenceCache,
  LatencyTrace,
  runParallelStateRetrieval,
  buildMinimalContextPack
} from '../scripts/brain/powerhouse-fast-execution.mjs';

test('classifies work into FAST, STANDARD and DEEP without deep-by-default', () => {
  assert.equal(classifyTask({ task: 'status readback van huidige deploy' }), 'FAST');
  assert.equal(classifyTask({ task: 'fix bug en deploy feature' }), 'STANDARD');
  assert.equal(classifyTask({ task: 'security architectuur database migration incident root cause' }), 'DEEP');
  assert.equal(classifyTask({ task: '', risk: 'high' }), 'DEEP');
});

test('stable policy prefix is deterministic and versioned', () => {
  const a = buildStablePolicyPrefix();
  const b = buildStablePolicyPrefix();
  assert.deepEqual(a, b);
  assert.equal(a.version, 'POWERHOUSE-FAST-EXECUTION-v1');
  assert.equal(a.existingStateFirst, true);
  assert.equal(a.defaultEnabled, true);
});

test('tool output is bounded before it enters model context', () => {
  const huge = Array.from({ length: 1000 }, (_, i) => `line ${i}`).join('\n');
  const compacted = compactToolOutput(huge, { maxChars: 1200, maxLines: 40 });
  assert.ok(compacted.length <= 1400);
  assert.match(compacted, /TRUNCATED/);
});

test('tool output handles undefined and non-serializable values safely', () => {
  assert.equal(compactToolOutput(undefined), 'undefined');
  const cyclic = {};
  cyclic.self = cyclic;
  assert.match(compactToolOutput(cyclic), /\[Unserializable tool output:/);
});

test('fresh evidence is reused and expired evidence is rejected', () => {
  let now = 1_000;
  const cache = new EvidenceCache({ now: () => now });
  cache.put('deploy:main', { sha: 'abc' }, { ttlMs: 100 });
  assert.deepEqual(cache.get('deploy:main'), { sha: 'abc' });
  now = 1_101;
  assert.equal(cache.get('deploy:main'), null);
});

test('candidate-bound evidence is never reused for a different or missing candidate identity', () => {
  const cache = new EvidenceCache({ now: () => 1_000 });
  cache.put('release', { green: true }, { ttlMs: 1_000, candidateId: 'sha-a' });
  assert.deepEqual(cache.get('release', { candidateId: 'sha-a' }), { green: true });
  assert.equal(cache.get('release', { candidateId: 'sha-b' }), null);

  cache.put('unbound-release', { green: true }, { ttlMs: 1_000 });
  assert.equal(cache.get('unbound-release', { candidateId: 'sha-a' }), null);
});

test('state retrieval starts adapters concurrently', async () => {
  const starts = [];
  const adapter = name => async () => {
    starts.push(name);
    await new Promise(resolve => setTimeout(resolve, 25));
    return name;
  };
  const result = await runParallelStateRetrieval({
    github: adapter('github'),
    runtime: adapter('runtime'),
    data: adapter('data'),
    obligations: adapter('obligations')
  });
  assert.equal(starts.length, 4);
  assert.deepEqual(result, { github: 'github', runtime: 'runtime', data: 'data', obligations: 'obligations' });
});

test('minimal context packet is bounded and task scoped', () => {
  const packet = buildMinimalContextPack({
    task: 'check deploy',
    executionClass: 'FAST',
    hotState: { currentSha: 'abc', irrelevant: 'x'.repeat(10000) },
    delta: [{ id: 1, change: 'deploy' }],
    evidence: [{ key: 'deploy', value: 'green' }],
    maxChars: 2500
  });
  assert.equal(packet.executionClass, 'FAST');
  assert.equal(packet.task, 'check deploy');
  assert.ok(JSON.stringify(packet).length <= 2500);
});

test('minimal context packet remains bounded under an unusually small budget', () => {
  const packet = buildMinimalContextPack({
    task: 'x'.repeat(5000),
    hotState: { huge: 'y'.repeat(5000) },
    delta: [{ huge: 'z'.repeat(5000) }],
    evidence: [{ huge: 'e'.repeat(5000) }],
    maxChars: 900
  });
  assert.ok(JSON.stringify(packet).length <= 900);
  assert.equal(packet.bounded, true);
});

test('latency trace emits all required SLI fields', () => {
  let now = 100;
  const trace = new LatencyTrace({ now: () => now });
  trace.markStart('context'); now += 3; trace.markEnd('context');
  trace.markStart('reasoning'); now += 5; trace.markEnd('reasoning');
  trace.markStart('toolWait'); now += 7; trace.markEnd('toolWait');
  trace.markStart('test'); now += 11; trace.markEnd('test');
  trace.markStart('deploy'); now += 13; trace.markEnd('deploy');
  trace.markStart('readback'); now += 17; trace.markEnd('readback');
  const metrics = trace.snapshot();
  for (const key of ['context-build-ms','reasoning-ms','tool-wait-ms','test-ms','deploy-ms','readback-ms','total-ms']) {
    assert.equal(typeof metrics[key], 'number');
  }
});