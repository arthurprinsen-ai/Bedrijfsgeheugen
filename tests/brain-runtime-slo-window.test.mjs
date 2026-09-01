import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {aggregateRuntimeWindow,projectRuntimeSlo} from '../brain/operating-loop/runtime-slo-window.mjs';

const metric=(metricName,metricValueMs,overrides={})=>({surface:'portal',route:'/portal',revision:'a'.repeat(40),sessionId:`s-${metricName}-${metricValueMs}`,metricName,metricValueMs,observedAt:'2026-09-01T06:00:00.000Z',...overrides});

test('runtime window isolates one exact surface route and revision and ignores malformed rows',()=>{
  const rows=[metric('cached_ms',100),metric('interactive_ms',300),metric('cached_ms',999,{revision:'b'.repeat(40)}),{metricName:'cached_ms',metricValueMs:'bad'}];
  const window=aggregateRuntimeWindow(rows,{surface:'portal',route:'/portal',revision:'a'.repeat(40)});
  assert.equal(window.samples,2);
  assert.deepEqual(window.values.cached_ms,[100]);
  assert.deepEqual(window.values.interactive_ms,[300]);
});

test('runtime SLO uses deterministic nearest-rank p95 and remains NOT_PROVEN below real sample threshold',()=>{
  const rows=[];for(let i=1;i<=9;i++){rows.push(metric('cached_ms',i*10));rows.push(metric('interactive_ms',i*20));}
  const projection=projectRuntimeSlo(rows,{surface:'portal',route:'/portal',revision:'a'.repeat(40),minSamples:10});
  assert.equal(projection.status,'NOT_PROVEN');
  assert.equal(projection.realSamples,9);
  assert.equal(projection.obligation.status,'WAITING_FOR_REAL_TRAFFIC');
});

test('runtime SLO passes with enough real sessions below targets',()=>{
  const rows=[];for(let i=1;i<=10;i++){rows.push(metric('cached_ms',100+i));rows.push(metric('interactive_ms',500+i));}
  const projection=projectRuntimeSlo(rows,{surface:'portal',route:'/portal',revision:'a'.repeat(40),minSamples:10});
  assert.equal(projection.status,'PASS');
  assert.equal(projection.realSamples,10);
  assert.equal(projection.p95.cached_ms,110);
  assert.equal(projection.p95.interactive_ms,510);
  assert.equal(projection.obligation,null);
});

test('runtime SLO breach creates deterministic owned outcome obligation instead of false green',()=>{
  const rows=[];for(let i=1;i<=10;i++){rows.push(metric('cached_ms',1200+i));rows.push(metric('interactive_ms',2400+i));}
  const projection=projectRuntimeSlo(rows,{surface:'portal',route:'/portal',revision:'a'.repeat(40),minSamples:10,owner:'Performance Guardian'});
  assert.equal(projection.status,'FAIL');
  assert.deepEqual(projection.breaches,['cached_ms','interactive_ms']);
  assert.equal(projection.obligation.owner,'Performance Guardian');
  assert.equal(projection.obligation.status,'OPEN');
  assert.match(projection.obligation.id,/runtime-slo:portal:\/portal:/);
});

test('runtime ingest contract requires authenticated real samples, persistence, aggregation and independent readback',async()=>{
  const contract=JSON.parse(await readFile('brain/contracts/runtime-rum-ingest-v2.json','utf8'));
  assert.equal(contract.version,'RUNTIME-RUM-INGEST-v2');
  assert.equal(contract.syntheticSamplesForbidden,true);
  assert.deepEqual(contract.stages,['authenticated_ingest','raw_persistence','window_aggregation','slo_assessment','current_state','outcome_obligation','learning_writeback']);
  assert.equal(contract.notEnoughSamplesState,'WAITING_FOR_REAL_TRAFFIC');
});
