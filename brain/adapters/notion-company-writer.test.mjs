import test from 'node:test';
import assert from 'node:assert/strict';
import {createNotionCompanyWriter} from './notion-company-writer.mjs';

const row={fingerprint:'t1:d1',tenantId:'t1',decisionId:'d1',title:'Automatiseer facturen',sourceOfTruth:'BRAIN_SUPABASE',portfolioBucket:'NOW',status:'PROPOSED',owner:'finance',rank:1,score:4.2,confidence:.84,nextAction:'Goedkeuren',expectedValue:30000,expectedCost:5000,realizedValue:4000,realizedProfit:3000,currency:'EUR',approvalState:'PENDING',evidenceIds:['e1'],lastEvent:{id:'v1',type:'Value',status:'REALISED',occurredAt:'2026-09-11T08:00:00Z'}};

function response(status,body={}){return {ok:status>=200&&status<300,status,json:async()=>body,text:async()=>JSON.stringify(body)};}

test('writer fails closed when Notion configuration is absent',()=>{
  assert.throws(()=>createNotionCompanyWriter({fetchImpl:async()=>response(200)}),/NOTION_TOKEN/);
  assert.throws(()=>createNotionCompanyWriter({token:'secret',fetchImpl:async()=>response(200)}),/NOTION_DATABASE_ID/);
});

test('writer queries by canonical fingerprint then creates when absent',async()=>{
  const calls=[];
  const fetchImpl=async(url,options)=>{calls.push({url,options});return calls.length===1?response(200,{results:[]}):response(200,{id:'page1'});};
  const writer=createNotionCompanyWriter({token:'secret',databaseId:'db1',fetchImpl,notionVersion:'2022-06-28'});
  const result=await writer.upsert(row);
  assert.equal(result.id,'page1');
  assert.equal(result.action,'created');
  assert.match(calls[0].url,/\/v1\/databases\/db1\/query$/);
  assert.equal(calls[0].options.headers.Authorization,'Bearer secret');
  const query=JSON.parse(calls[0].options.body);
  assert.equal(query.filter.rich_text.equals,'t1:d1');
  const create=JSON.parse(calls[1].options.body);
  assert.equal(create.parent.database_id,'db1');
  assert.equal(create.properties.Fingerprint.rich_text[0].text.content,'t1:d1');
  assert.equal(create.properties['Bronwaarheid'].select.name,'BRAIN_SUPABASE');
});

test('writer updates existing page and rejects non-2xx without leaking token',async()=>{
  const calls=[];
  const fetchImpl=async(url,options)=>{calls.push({url,options});return calls.length===1?response(200,{results:[{id:'page-existing'}]}):response(200,{id:'page-existing'});};
  const writer=createNotionCompanyWriter({token:'top-secret',databaseId:'db1',fetchImpl,notionVersion:'2022-06-28'});
  const result=await writer.upsert(row);
  assert.equal(result.action,'updated');
  assert.match(calls[1].url,/\/v1\/pages\/page-existing$/);

  const broken=createNotionCompanyWriter({token:'top-secret',databaseId:'db1',fetchImpl:async()=>response(500,{message:'boom'}),notionVersion:'2022-06-28'});
  await assert.rejects(()=>broken.upsert(row),error=>error.message.includes('Notion query failed')&&!error.message.includes('top-secret'));
});


test('writer prefetches fingerprints in bounded batches and updates known pages without a second lookup',async()=>{
  const calls=[];
  const fetchImpl=async(url,options)=>{
    calls.push({url,options});
    if(url.endsWith('/query')){
      const body=JSON.parse(options.body);
      const filters=body.filter?.or||[body.filter];
      const fingerprints=filters.map(filter=>filter.rich_text.equals);
      return response(200,{results:fingerprints.map((fingerprint,index)=>({
        id:`page-${fingerprint}`,
        properties:{Fingerprint:{rich_text:[{plain_text:fingerprint}]}}
      }))});
    }
    return response(200,{id:'page-t1:d1'});
  };
  const writer=createNotionCompanyWriter({token:'secret',databaseId:'db1',fetchImpl,prefetchBatchSize:2,prefetchConcurrency:2});
  const index=await writer.prefetch(['t1:d1','t1:d2','t1:d3']);
  assert.equal(index.size,3);
  assert.equal(calls.filter(call=>call.url.endsWith('/query')).length,2);

  calls.length=0;
  const result=await writer.upsert(row,{pageId:'page-t1:d1'});
  assert.equal(result.action,'updated');
  assert.equal(calls.filter(call=>call.url.endsWith('/query')).length,0);
  assert.match(calls[0].url,/\/v1\/pages\/page-t1%3Ad1$/);
});

test('writer centrally retries Notion throttling and honors Retry-After',async()=>{
  let attempts=0;
  const sleeps=[];
  const fetchImpl=async()=>{
    attempts++;
    if(attempts===1)return {ok:false,status:429,headers:{get:name=>name.toLowerCase()==='retry-after'?'1':null},json:async()=>({message:'rate limited'})};
    return response(200,{results:[]});
  };
  const writer=createNotionCompanyWriter({token:'secret',databaseId:'db1',fetchImpl,sleepImpl:async ms=>{sleeps.push(ms);}});
  await writer.upsert(row);
  assert.equal(attempts,3);
  assert.equal(sleeps[0],1000);
});
