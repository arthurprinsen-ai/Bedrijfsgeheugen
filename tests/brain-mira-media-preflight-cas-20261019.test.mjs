import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {writeMediaPreflight} from '../supabase/functions/powerhouse-instagram-media-router/preflight-write.mjs';

test('preflight preserves an active producer before an asset URL exists',async()=>{
  const job={id:'job',status:'CLAIMED',updated_at:'v1',asset_manifest:{claimed_by:'worker',openart_history_id:'pending'}};
  const db={from(){throw Error('active claim must not be written');}};
  assert.deepEqual(await writeMediaPreflight(db,job,{status:'WAITING_ASSET'}),{kind:'preserved',status:'CLAIMED'});
});
test('bounded provider/quality failure remains visible instead of reopening generation',async()=>{
  const job={id:'job',status:'WAITING_ASSET',asset_manifest:{automatic_generation_budget_exhausted:true}};
  assert.deepEqual(await writeMediaPreflight({from(){throw Error('must preserve failure');}},job,{}),{kind:'preserved',status:'WAITING_ASSET'});
});

function fakeDb(current,error=null){
  const filters={};let writes=0;
  const builder={eq(k,v){filters[k]=v;return this;},select(){return this;},async maybeSingle(){
    if(error)return {data:null,error};
    if(filters.id!==current.id||filters.updated_at!==current.updated_at)return {data:null,error:null};
    writes++;return {data:{id:current.id},error:null};
  }};
  return {from(){return {update(){return builder;},insert(){return builder;}};},filters,get writes(){return writes;}};
}
test('a worker claim acquired after the preflight read cannot be overwritten',async()=>{
  const db=fakeDb({id:'job',updated_at:'v2'});
  assert.deepEqual(await writeMediaPreflight(db,{id:'job',status:'WAITING_ASSET',updated_at:'v1'},{status:'WAITING_ASSET'}),{kind:'stale'});
  assert.equal(db.writes,0);assert.deepEqual(db.filters,{id:'job',updated_at:'v1'});
});
test('unchanged existing row applies once and insert contention asks for reread',async()=>{
  const db=fakeDb({id:'job',updated_at:'v1'});
  assert.deepEqual(await writeMediaPreflight(db,{id:'job',status:'WAITING_ASSET',updated_at:'v1'},{}),{kind:'applied'});
  assert.equal(db.writes,1);
  assert.deepEqual(await writeMediaPreflight(fakeDb({}, {code:'23505'}),null,{}),{kind:'stale'});
});
test('router uses the tested CAS boundary and returns before obligation mutation on a stale read',async()=>{
  const source=await readFile(new URL('../supabase/functions/powerhouse-instagram-media-router/index.ts',import.meta.url),'utf8');
  assert.match(source,/import \{writeMediaPreflight\} from '\.\/preflight-write\.mjs'/);
  assert.match(source,/await writeMediaPreflight\(db,job,row\)/);
  assert.ok(source.indexOf("write.kind==='stale'")<source.lastIndexOf("if(!verifiedMedia)"));
});
