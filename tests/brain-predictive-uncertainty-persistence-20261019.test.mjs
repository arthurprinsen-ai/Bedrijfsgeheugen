import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const moduleUrl=new URL('../supabase/functions/powerhouse-forecast-calibrator/persist-uncertainty.mjs',import.meta.url);
const obligation={obligation_id:'forecast-calibration:21a561a1-7c57-432a-886b-d737f79bd274',payload:{forecast_revision:'59b257d7705f00050e16c272c4bf0247',provenance:'keep'}};
const calibration={reason:'Evidence is insufficient',confidence:0.4};
const now=new Date('2026-10-19T21:00:00Z');
function client(sequence){
 const writes=[],filters=[],sleeps=[];let current;
 const chain={update(value){current=value;writes.push(value);return this;},eq(k,v){filters.push([k,v]);return this;},async select(){
  const next=sequence.shift();
  if(next==='ok')return {error:null,data:[{obligation_id:obligation.obligation_id,status:'OPEN',payload:current.payload,due_at:current.due_at}]};
  if(next==='stale')return {error:null,data:[]};
  if(next==='mismatch')return {error:null,data:[{obligation_id:obligation.obligation_id,status:'OPEN',payload:{...current.payload,last_result:'wrong'},due_at:current.due_at}]};
  return {error:{code:next},data:null};
 }};
 return {db:{from(table){assert.equal(table,'revenue_learning_obligations');return chain;}},writes,filters,sleeps,wait:async(ms)=>sleeps.push(ms)};
}
async function invoke(mock,ob=obligation){const {persistUncertainCalibration}=await import(moduleUrl);return persistUncertainCalibration({db:mock.db,obligation:ob,calibration,now,wait:mock.wait});}
test('uncertain result requires an acknowledged OPEN row at the same revision',async()=>{
 const m=client(['ok']);await invoke(m);assert.equal(m.writes.length,1);
 assert.ok(m.filters.some(([k,v])=>k==='status'&&v==='OPEN'));
 assert.ok(m.filters.some(([k,v])=>k==='payload->>forecast_revision'&&v===obligation.payload.forecast_revision));
 assert.equal(m.writes[0].payload.provenance,'keep');assert.equal(m.writes[0].due_at,'2026-10-26T21:00:00.000Z');
});
test('observed SQL timeout retries the same result once without repeating the model',async()=>{
 const m=client(['57014','ok']);await invoke(m);assert.equal(m.writes.length,2);assert.equal(m.writes[0],m.writes[1]);assert.equal(m.sleeps.length,1);
});
test('two timeouts fail instead of reporting a successful uncertain result',async()=>{
 const m=client(['57014','57014']);await assert.rejects(invoke(m),/CALIBRATION_UNCERTAINTY_PERSIST_FAILED:57014/);assert.equal(m.writes.length,2);
});
test('permission failure is not retried',async()=>{
 const m=client(['42501']);await assert.rejects(invoke(m),/CALIBRATION_UNCERTAINTY_PERSIST_FAILED:42501/);assert.equal(m.writes.length,1);
});
test('stale or closed zero-row write is never acknowledged',async()=>{await assert.rejects(invoke(client(['stale'])),/CALIBRATION_UNCERTAINTY_NOT_ACKNOWLEDGED/);});
test('mismatched readback is never acknowledged',async()=>{await assert.rejects(invoke(client(['mismatch'])),/CALIBRATION_UNCERTAINTY_NOT_ACKNOWLEDGED/);});
test('unbound revision fails before any write',async()=>{const m=client([]);await assert.rejects(invoke(m,{...obligation,payload:{}}),/CALIBRATION_FORECAST_REVISION_REQUIRED/);assert.equal(m.writes.length,0);});
test('canonical refresh filters unchanged candidates before attempting row-locking upsert',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261019210359_predictive_uncertainty_persistence_ack.sql',import.meta.url),'utf8');
 assert.match(sql,/changed as[\s\S]*is distinct from[\s\S]*insert into public\.revenue_learning_obligations/i);
 assert.match(sql,/from changed/);assert.doesNotMatch(sql,/cron\.schedule|create table|supabase_migrations/i);
});

test('calibrator reports uncertainty only after actual persistence acknowledgement',()=>{
 const source=readFileSync(new URL('../supabase/functions/powerhouse-forecast-calibrator/index.ts',import.meta.url),'utf8');
 assert.match(source,/if\(!canCommitCalibration\(c,payload\)\)\{await persistUncertainCalibration\(\{db,obligation:ob,calibration:c\}\);uncertain\+\+/);
});
