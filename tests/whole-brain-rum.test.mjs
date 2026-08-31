import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRuntimeMetric,assessRuntimeSlo} from '../brain/operating-loop/runtime-telemetry.mjs';

test('runtime metric accepts only bounded canonical fields',()=>{
  const m=normalizeRuntimeMetric({surface:'portal',route:'/portal/',metricName:'interactive_ms',metricValueMs:450,cacheState:'hit',revision:'abc',sessionId:'s1',metadata:{navigationType:'navigate'},email:'must-not-pass'});
  assert.equal(m.metricValueMs,450);
  assert.equal(m.metricName,'interactive_ms');
  assert.equal('email' in m,false);
  assert.deepEqual(m.metadata,{navigationType:'navigate'});
});

test('runtime SLO assesses cached <1000ms and interactive <2000ms using p95 inputs',()=>{
  assert.equal(assessRuntimeSlo({p95CachedMs:900,p95InteractiveMs:1800,samples:30}).status,'PASS');
  const fail=assessRuntimeSlo({p95CachedMs:1100,p95InteractiveMs:1800,samples:30});
  assert.equal(fail.status,'FAIL'); assert.ok(fail.breaches.includes('cached_ms'));
  assert.equal(assessRuntimeSlo({p95CachedMs:500,p95InteractiveMs:900,samples:2},{minSamples:10}).status,'NOT_PROVEN');
});
