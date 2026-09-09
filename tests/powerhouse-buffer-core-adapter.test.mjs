import test from 'node:test';
import assert from 'node:assert/strict';
import { bufferEnvelopeToCoreEvents, runBufferCollection } from '../netlify/functions/buffer-social-collect.mjs';

test('Buffer envelope becomes publication plus metric evidence in one core',()=>{
  const events=bufferEnvelopeToCoreEvents({postId:'p1',externalPostId:'p1',platform:'linkedin',contentHash:'abc',text:'AI en bedrijfskennis',publishedAt:'2026-09-09T06:00:00Z',observedAt:'2026-09-09T07:00:00Z',metrics:{impressions:100,clicks:4},dataQuality:'OBSERVED'});
  assert.equal(events.length,2);
  assert.equal(events[0].eventType,'social_post_published');
  assert.equal(events[1].eventType,'social_metric_observed');
  assert.equal(events[0].contentKey,'abc');
  assert.equal(events[1].evidence.metrics.clicks,4);
});

test('primary Buffer path can inject unified ingest without legacy social store',async()=>{
  const observed=[];
  const fetchFn=async (_url,options={})=>{
    const body=JSON.parse(options.body||'{}');
    if(String(body.query).includes('GetOrganizations'))return Response.json({data:{account:{organizations:[{id:'org1'}]}}});
    if(String(body.query).includes('GetChannels'))return Response.json({data:{channels:[{id:'c1',service:'linkedin'}]}});
    return Response.json({data:{posts:{edges:[{node:{id:'p1',text:'AI kennis proces',createdAt:'2026-09-09T06:00:00Z',sentAt:'2026-09-09T06:00:00Z',channelId:'c1',metrics:[{type:'impressions',value:100}],metricsUpdatedAt:'2026-09-09T07:00:00Z'}}],pageInfo:{hasNextPage:false,endCursor:null}}}});
  };
  const result=await runBufferCollection({apiKey:'x',fetchFn,ingest:async e=>observed.push(e),now:new Date('2026-09-09T07:00:00Z')});
  assert.equal(result.ok,true);
  assert.equal(result.posts,1);
  assert.equal(observed.length,1);
});
