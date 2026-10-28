import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {assertMeasurementSourceReadOnly,assertObservedSnapshotFloor,MEASURED_SOURCE_TABLES} from '../supabase/functions/_shared/measured-provider-db-policy.mjs';

const orchestrator=fs.readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');

// Execute the real history query through the real SQL adapter, capturing only
// the SQL boundary. This catches methods that static story-selection tests miss.
async function personalHistoryQuery(runDate,kind){
  const adapter=orchestrator.slice(orchestrator.indexOf('function dbIdent('),orchestrator.indexOf('\nasync function directRpc(')).replace(/^const directSql=.*$/m,'');
  const reserve=kind==='reserve';
  const historyStart=reserve ? orchestrator.indexOf('        {\n',orchestrator.indexOf('const recentTypesForReserve=')) : orchestrator.indexOf('    if(!channelScope||channelScope===\'linkedin_personal\'){\n');
  assert.ok(historyStart>=0,'personal history query exists');
  const history=orchestrator.slice(historyStart,orchestrator.indexOf(reserve?'          for(const r of rr||[])':'      for(const r of recentRows||[])',historyStart));
  const captures=[];
  const directSql={unsafe:async(sql,values)=>{captures.push({sql,values});return [];}};
  const code=stripTypeScriptTypes(adapter+'\nasync function runHistory(runDate){const db={from:table=>new DirectQuery(table)};const channelScope="linkedin_personal";'+history+'return '+(reserve?'rr':'recentRows')+';}}',{mode:'strip'})+'\nreturn runHistory;';
  const run=new Function('directSql','DIRECT_TABLES','assertMeasurementSourceReadOnly','assertObservedSnapshotFloor','DB_JSON_COLUMNS','DB_ARRAY_CASTS','DB_DEFAULT_CONFLICT',code)(directSql,new Set(['content_publication_obligations']),assertMeasurementSourceReadOnly,assertObservedSnapshotFloor,new Set(),new Map(),new Map());
  await run(runDate);
  assert.equal(captures.length,1);
  return captures[0];
}

for(const kind of ['selection','reserve'])for(const [runDate,expected] of [
 ['2026-10-28',['2026-10-21','2026-10-22','2026-10-23','2026-10-24','2026-10-25','2026-10-26','2026-10-27']],
 ['2026-01-03',['2025-12-27','2025-12-28','2025-12-29','2025-12-30','2025-12-31','2026-01-01','2026-01-02']],
 ['2024-03-02',['2024-02-24','2024-02-25','2024-02-26','2024-02-27','2024-02-28','2024-02-29','2024-03-01']],
])test(kind+' personal story history executes with exact seven previous dates: '+runDate,async()=>{
 const {sql,values}=await personalHistoryQuery(runDate,kind);
 assert.match(sql,/from public\."content_publication_obligations"/);
 assert.match(sql,/"tenant_id" = \$1 and "channel" = \$2/);
 assert.deepEqual(values.slice(0,2),['canonical','linkedin_personal']);
 assert.deepEqual(values.filter(v=>/^\d{4}-\d{2}-\d{2}$/.test(v)).sort(),expected);
 assert.deepEqual(values.slice(-2),['PUBLISHED','LIVE_PROVEN']);
 assert.ok(!sql.includes(runDate),'date values stay bound, never SQL interpolated');
});

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
