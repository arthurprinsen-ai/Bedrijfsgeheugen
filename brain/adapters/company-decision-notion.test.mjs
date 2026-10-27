import test from 'node:test';
import assert from 'node:assert/strict';
import {buildNotionDecisionRows,syncCompanyDecisionsToNotion} from './company-decision-notion.mjs';

const projection={
  tenantId:'t1',
  companyDecisions:[
    {id:'d1',subjectId:'process:invoice',title:'Automatiseer facturen',portfolioBucket:'NOW',rank:1,score:4.2,confidence:.84,status:'PROPOSED',owner:'finance',nextAction:'Goedkeuren',expectedValue:30000,investment:5000,currency:'EUR',evidenceIds:['e1']}
  ],
  approvalQueue:[{id:'ap1',decisionId:'d1',status:'PENDING',owner:'arthur',actor:'user:arthur',occurredAt:'2026-09-11T07:00:00Z'}],
  decisionEconomics:{expectedValue:30000,actualCost:1000,realizedValue:4000,realizedProfit:3000,currency:'EUR'},
  auditTimeline:[{id:'v1',type:'Value',decisionId:'d1',actor:'agent:brain',status:'REALISED',occurredAt:'2026-09-11T08:00:00Z'}]
};

test('Notion rows are deterministic projections of canonical decisions, never a second authority',()=>{
  const rows=buildNotionDecisionRows(projection);
  assert.equal(rows.length,1);
  assert.equal(rows[0].decisionId,'d1');
  assert.equal(rows[0].sourceOfTruth,'BRAIN_SUPABASE');
  assert.equal(rows[0].portfolioBucket,'NOW');
  assert.equal(rows[0].approvalState,'PENDING');
  assert.equal(rows[0].expectedValue,30000);
  assert.equal(rows[0].realizedProfit,3000);
  assert.equal(rows[0].lastEvent.id,'v1');
  assert.equal(rows[0].fingerprint,'t1:d1');
});

test('sync upserts each decision idempotently and never mutates canonical projection',async()=>{
  const calls=[];
  const writer={upsert:async row=>{calls.push(row);return {ok:true,id:`notion:${row.decisionId}`};}};
  const before=JSON.stringify(projection);
  const result=await syncCompanyDecisionsToNotion(projection,{writer});
  assert.equal(result.attempted,1);
  assert.equal(result.succeeded,1);
  assert.equal(result.failed,0);
  assert.equal(calls[0].fingerprint,'t1:d1');
  assert.equal(JSON.stringify(projection),before);
});

test('sync fails closed per decision and reports errors instead of claiming success',async()=>{
  const writer={upsert:async()=>{throw new Error('notion unavailable');}};
  const result=await syncCompanyDecisionsToNotion(projection,{writer});
  assert.equal(result.succeeded,0);
  assert.equal(result.failed,1);
  assert.match(result.errors[0].message,/notion unavailable/);
});


test('sync uses bounded parallelism while preserving complete idempotent coverage',async()=>{
  const many={...projection,companyDecisions:Array.from({length:7},(_,index)=>({
    ...projection.companyDecisions[0],
    id:`d${index+1}`,
    title:`Besluit ${index+1}`
  }))};
  let active=0;
  let maxActive=0;
  const seen=[];
  const writer={upsert:async row=>{
    active++;
    maxActive=Math.max(maxActive,active);
    seen.push(row.decisionId);
    await new Promise(resolve=>setTimeout(resolve,5));
    active--;
    return {ok:true,id:`notion:${row.decisionId}`};
  }};
  const result=await syncCompanyDecisionsToNotion(many,{writer,concurrency:3});
  assert.equal(result.attempted,7);
  assert.equal(result.succeeded,7);
  assert.equal(result.failed,0);
  assert.equal(maxActive,3);
  assert.equal(new Set(seen).size,7);
});


test('sync prefetches existing Notion pages once and bypasses per-row lookup for updates',async()=>{
  const many={...projection,companyDecisions:Array.from({length:4},(_,index)=>({
    ...projection.companyDecisions[0],
    id:`d${index+1}`,
    title:`Besluit ${index+1}`
  }))};
  const calls=[];
  const writer={
    prefetch:async fingerprints=>new Map(fingerprints.map(fingerprint=>[fingerprint,`page:${fingerprint}`])),
    upsert:async(row,options={})=>{calls.push({row,options});return {ok:true,id:options.pageId};}
  };
  const result=await syncCompanyDecisionsToNotion(many,{writer,concurrency:3});
  assert.equal(result.succeeded,4);
  assert.equal(result.prefetch.used,true);
  assert.equal(result.prefetch.found,4);
  assert.equal(calls.length,4);
  assert.ok(calls.every(call=>call.options.pageId));
});

test('sync falls back to legacy idempotent upsert when prefetch is transiently unavailable',async()=>{
  const calls=[];
  const writer={
    prefetch:async()=>{throw new Error('temporary prefetch failure');},
    upsert:async(row,options={})=>{calls.push(options);return {ok:true,id:row.decisionId};}
  };
  const result=await syncCompanyDecisionsToNotion(projection,{writer});
  assert.equal(result.succeeded,1);
  assert.equal(result.prefetch.used,false);
  assert.match(result.prefetch.error,/temporary prefetch failure/);
  assert.deepEqual(calls,[{}]);
});
