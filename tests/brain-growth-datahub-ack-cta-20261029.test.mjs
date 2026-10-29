import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateDatahubAck} from '../tools/seo-growth/datahub-ack-contract.mjs';

const receipt=(kind,id,extra={})=>({
  datahub:'supabase:growth_'+(kind==='event'?'events':'outcomes'),
  result:{[kind==='event'?'event_id':'outcome_id']:id,queue_id:kind+':'+id,stored:true,deduped:false,...extra}
});
const row=(kind,id)=>kind==='event'?{datahub_event:{event_id:id}}:{outcome:{outcome_id:id}};
test('actual exact Supabase RPC stored response is accepted for event and outcome',()=>{
  for(const kind of ['event','outcome']){
    assert.equal(validateDatahubAck(kind,row(kind,'src-1'),receipt(kind,'src-1')),true);
    assert.equal(validateDatahubAck(kind,row(kind,'src-1'),receipt(kind,'src-1',{stored:false,deduped:true})),true,'idempotent deduplication is valid');
  }
});
test('HTTP success, wrong source ID, wrong queue ID and absent readback never prove storage',()=>{
  for(const kind of ['event','outcome']){
    const source=row(kind,'src-1');
    assert.equal(validateDatahubAck(kind,source,{}),false);
    assert.equal(validateDatahubAck(kind,source,{accepted:true,queue:'durable'}),false);
    assert.equal(validateDatahubAck(kind,source,receipt(kind,'another')),false);
    assert.equal(validateDatahubAck(kind,source,receipt(kind,'src-1',{queue_id:'other'})),false);
    assert.equal(validateDatahubAck(kind,source,receipt(kind,'src-1',{stored:false,deduped:false})),false);
    assert.equal(validateDatahubAck(kind,source,receipt(kind,'src-1',{stored:true,deduped:true})),false);
    assert.equal(validateDatahubAck(kind,source,{...receipt(kind,'src-1'),datahub:'untrusted'}),false);
  }
});
test('production Netlify event replay and commercial outcome path both enforce exact receipt',()=>{
  const replay=readFileSync(new URL('../netlify/functions/growth-replay.mjs',import.meta.url),'utf8');
  const outcome=readFileSync(new URL('../netlify/functions/growth-outcome.mjs',import.meta.url),'utf8');
  assert.match(replay,/validateDatahubAck\(kind,record,result\.body\)/);
  assert.match(replay,/reason:verified\?'stored':result\.ok\?'invalid-datahub-ack'/);
  assert.match(outcome,/validateDatahubAck\('outcome',\{outcome\},result\.body\)/);
});
test('DB migration keeps original idempotency and counts the four website CTA event types',()=>{
  const sql=readFileSync(new URL('../supabase/migrations/20261029174600_growth_cta_alias_truth_and_idempotent_backfill.sql',import.meta.url),'utf8');
  for(const type of ['cta_click','primary_cta_click','secondary_cta_click','money_link_click'])assert.ok(sql.includes("'"+type+"'"));
  assert.match(sql,/on conflict\(event_id\) do nothing/i);
  assert.match(sql,/count\(DISTINCT event_id\)/i);
  assert.match(sql,/is_robot IS FALSE/);
  assert.match(sql,/GREATEST\(public\.growth_page_daily\.cta_clicks,EXCLUDED\.cta_clicks\)/);
});
