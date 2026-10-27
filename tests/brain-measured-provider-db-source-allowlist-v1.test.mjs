import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assertMeasurementSourceReadOnly,assertObservedSnapshotFloor,MEASURED_SOURCE_TABLES} from '../supabase/functions/_shared/measured-provider-db-policy.mjs';

const orchestrator=fs.readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');

test('existing content orchestrator reads the two exact owned-brand measurement tables',()=>{
  assert.deepEqual(MEASURED_SOURCE_TABLES,['social_posts','social_metric_snapshots']);
  const allowlist=orchestrator.match(/const DIRECT_TABLES=new Set\((\[[^\n]*\])\)/);
  assert.ok(allowlist,'Direct SQL table allowlist must be explicit');
  const tables=JSON.parse(allowlist[1]);
  assert.ok(tables.includes('social_posts'));
  assert.ok(tables.includes('social_metric_snapshots'));
  assert.ok(orchestrator.includes("'social_metric_snapshots.metrics'"),'provider metric JSON must be normalized');
  assert.ok(orchestrator.includes("eq('tenant_id','bedrijfsgeheugen')"),'owner-only tenant filter retained');
  assert.ok(orchestrator.includes("selectMeasuredNextPostTest({posts:brandPosts||[],snapshots:sourceSnapshots"));
});
test('measurement source is read-only even if another caller tries to invoke writes',()=>{
  for(const name of MEASURED_SOURCE_TABLES){
    assert.equal(assertMeasurementSourceReadOnly(name,'select'),true);
    for(const verb of ['upsert','insert','update','delete'])assert.throws(()=>assertMeasurementSourceReadOnly(name,verb),/DB_SOCIAL_MEASUREMENT_READ_ONLY/);
  }
  assert.ok(orchestrator.includes("assertMeasurementSourceReadOnly(this.table,this.op)"));
});
test('observed_at >= filter accepts only bound ISO UTC timestamp on snapshot table',()=>{
  const floor='2026-10-25T04:30:00.000Z';
  assert.equal(assertObservedSnapshotFloor('social_metric_snapshots','observed_at',floor),floor);
  for(const [table,column,value] of [
   ['social_posts','published_at',floor],['social_metric_snapshots','post_id',floor],
   ['social_metric_snapshots','observed_at','2000-01-01;DROP TABLE'],
   ['social_metric_snapshots','observed_at','2026-10-25'],
   ['social_metric_snapshots','observed_at','2026-02-30T05:00:00.000Z'],
  ])assert.throws(()=>assertObservedSnapshotFloor(table,column,value),/DB_MEASUREMENT_GTE_/);
  assert.ok(orchestrator.includes("gte(column:string,value:any){this.filters.push({kind:'gte'"));
  assert.ok(orchestrator.includes("scalarParam(f.value,values,'timestamptz')"));
  assert.ok(orchestrator.includes(".gte('observed_at',new Date(Date.now()-72*3600000).toISOString())"));
});
test('source errors remain evidence debt, never silently promote an unobserved winner',()=>{
  assert.ok(orchestrator.includes("error_class:'COMPANY_PROVIDER_EVIDENCE_READ_FAILED'"));
  assert.ok(orchestrator.includes("KEEP_CANONICAL_EDITORIAL_DEFAULT"));
  assert.ok(orchestrator.includes("proposeBoundedCreativeExploration("));
  assert.ok(orchestrator.includes("measured_next_post_test:measuredNextPostTest"));
});
