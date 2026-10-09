import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readPortalBusinessInputAuthorityPages} from '../supabase/functions/portal-state-eu/business-input-authority-pages.js';
import {repairBusinessInputsFromAuthority} from '../supabase/functions/portal-state-eu/business-input-read-repair.js';

const timestamp=i=>new Date(Date.UTC(2026,9,9,7,0,0)+Math.floor(i/2)*1000).toISOString();
const makeRows=(tenant,count)=>Array.from({length:count},(_,i)=>({
 tenant_id:tenant,record_id:'BR-'+String(i).padStart(5,'0'),
 record_type:'BusinessInput',record_kind:'SourceTruth',
 subject_id:'PORTAL_INPUT-FinancialAssessment-finance-primary',owner_id:'actor',
 updated_at:timestamp(i),observed_at:timestamp(i),source_revision:'rev-'+i,
 provenance:{sourceType:'PortalInput'},
 payload:{canonicalObjectId:'PORTAL_INPUT-FinancialAssessment-finance-primary',
  inputType:'FinancialAssessment',modelId:'finance',instanceId:'primary',
  answers:{metrics:{lastRevision:i}},metadata:{preserveMissing:true},
  submittedAt:timestamp(i),sourcePortal:'portal-v2',truthClass:'SourceTruth'}
}));
function mockClient(all,{errorOffset=null,corruptOffset=null}={}){
 const requests=[];
 return {requests,client:{from(table){
  assert.equal(table,'brain_records');
  let tenant='',type='',sort=[];
  const query={
   select(fields){assert.match(fields,/source_revision/);return query;},
   eq(field,value){if(field==='tenant_id')tenant=value;else if(field==='record_type')type=value;else throw Error('UNEXPECTED_UNSCOPED_PREDICATE');return query;},
   order(field,{ascending}){sort.push([field,ascending]);return query;},
   async range(start,end){
    requests.push({tenant,type,start,end,sort});
    if(start===errorOffset)return {error:{message:'provider unavailable'},data:null};
    if(start===corruptOffset)return {error:null,data:{}};
    assert.equal(type,'BusinessInput');
    assert.deepEqual(sort,[['updated_at',true],['record_id',true]]);
    const own=all.filter(r=>r.tenant_id===tenant).sort((a,b)=>a.updated_at.localeCompare(b.updated_at)||a.record_id.localeCompare(b.record_id));
    return {data:own.slice(start,end+1),error:null};
   }
  };return query;
 }}};
}
test('1501 historical Brain inputs across four pages include the newest revision, never another tenant',async()=>{
 const mock=mockClient([...makeRows('alpha',1501),...makeRows('beta',90)]);
 const rows=await readPortalBusinessInputAuthorityPages(mock.client,'alpha');
 assert.equal(rows.length,1501);
 assert.deepEqual(mock.requests.map(x=>x.start),[0,500,1000,1500]);
 assert.ok(mock.requests.every(x=>x.tenant==='alpha'&&x.type==='BusinessInput'));
 const projected=repairBusinessInputsFromAuthority({},rows);
 assert.equal(projected.businessInputs.length,1);
 assert.equal(projected.businessInputs[0].answers.metrics.lastRevision,1500);
 assert.equal(projected.businessInputs[0].metadata.sourceRevision,'rev-1500');
});
test('deterministic updated_at plus record_id cursor ordering holds for identical timestamps',async()=>{
 const rows=await readPortalBusinessInputAuthorityPages(mockClient(makeRows('alpha',1020).reverse()).client,'alpha');
 assert.equal(rows.length,1020);
 for(let i=1;i<rows.length;i++){
  assert.ok(rows[i].updated_at>rows[i-1].updated_at||rows[i].updated_at===rows[i-1].updated_at&&rows[i].record_id>rows[i-1].record_id);
 }
});
test('midway provider failure or invalid page raises an error before any partial projection is returned',async()=>{
 for(const options of [{errorOffset:500},{corruptOffset:500}]){
  const m=mockClient(makeRows('alpha',1050),options);
  await assert.rejects(readPortalBusinessInputAuthorityPages(m.client,'alpha'),/BUSINESS_INPUT_AUTHORITY_READ_FAILED/);
 }
});
test('resource cap fails closed instead of silently treating old history as complete',async()=>{
 const mock=mockClient(makeRows('alpha',1001));
 await assert.rejects(readPortalBusinessInputAuthorityPages(mock.client,'alpha',{pageSize:250,maxRecords:1000}),/BUSINESS_INPUT_HISTORY_LIMIT_EXCEEDED/);
});
test('zero records and exact page boundary are read successfully with a terminating empty page',async()=>{
 const mock=mockClient(makeRows('alpha',500));
 assert.equal((await readPortalBusinessInputAuthorityPages(mock.client,'alpha')).length,500);
 assert.deepEqual(mock.requests.map(x=>x.start),[0,500]);
 assert.deepEqual(await readPortalBusinessInputAuthorityPages(mock.client,'unknown'),[]);
});
test('production Edge entrypoint is wired to paginated authority reader, not oldest-1000 cutoff',()=>{
 const source=readFileSync(new URL('../supabase/functions/portal-state-eu/index.ts',import.meta.url),'utf8');
 assert.match(source,/await readPortalBusinessInputAuthorityPages\(client,tenantId\)/);
 assert.doesNotMatch(source,/\.order\('updated_at',\{ascending:true\}\)\s*\.limit\(1000\)/);
});
