import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnoseDailyPerformance} from '../tools/content-growth/daily-performance-diagnostics.mjs';
import {queries,collect,readBoundedCanonicalSource} from '../tools/content-growth/collect-canonical-evidence.mjs';
const now=new Date('2026-10-24T10:00:00Z');
const feed={state:'READ_ONLY_PROVIDER_OBSERVED',social:[
 {post_id:'ig1',platform:'instagram',published_at:'2026-10-20T10:00:00Z',observed_at:'2026-10-24T08:00:00Z',data_quality:'OBSERVED',metrics:{views:158,reach:138,likes:0,comments:0,saved:0,shares:0}},
 {post_id:'li1',platform:'linkedin',published_at:'2026-10-20T10:00:00Z',observed_at:'2026-10-24T08:00:00Z',data_quality:'OBSERVED_PARTIAL_SCOPE',metrics:{reactions:4,views_unavailable:true}}
],pages:[{page_path:'/blog/test/',human_page_sessions:'25',human_click_sessions:'0'}],sources:[{source_key:'ga4',quality:'MISSING'},{source_key:'search_console',quality:'AWAITING_PROVIDER'},{source_key:'website_interactions',quality:'OBSERVED'}]};
test('Instagram engagement deficit produces only a bounded causal hypothesis',()=>{
 const x=diagnoseDailyPerformance({evidence:feed,now});
 assert.equal(x.social_posts[0].engagement_rate,0);
 assert.ok(x.social_posts[0].signals.includes('OBSERVED_ZERO_COMMENTS'));
 assert.equal(x.social_posts[0].not_a_causal_explanation,true);
 assert.equal(x.next_day_hypotheses[0].scope,'social');
});
test('LinkedIn reactions-only does not fabricate views, comments or engagement rate',()=>{
 const x=diagnoseDailyPerformance({evidence:feed,now});const post=x.social_posts[1];
 assert.equal(post.views,null);assert.equal(post.comments,null);
 assert.equal(post.engagement_rate,null);assert.equal(post.conversion_outcome,'UNKNOWN_UNLESS_ATTRIBUTED');
});
test('site clicks are not confused with customer conversion or abandoned carts',()=>{
 const x=diagnoseDailyPerformance({evidence:feed,now});const page=x.website_pages[0];
 assert.equal(page.hypothesis,'TEST_PAGE_MESSAGE_AND_PRIMARY_CTA');
 assert.equal(page.sales_and_dropoff_not_inferred,true);
 assert.equal(page.click_session_ratio,0);
});
test('no provider or immature source cannot trigger imaginary poor-performance actions',()=>{
 const x=diagnoseDailyPerformance({evidence:{state:'AUTH_REQUIRED',social:feed.social,pages:feed.pages},now});
 assert.equal(x.next_day_hypotheses.length,0);
 assert.equal(x.social_posts[0].views,null);
 assert.equal(x.source_gaps.length,5);
});
test('tenant filter and consented human aggregate are hardcoded in bounded read-only queries',async()=>{
 assert.ok(queries.social.includes("s.tenant_id='bedrijfsgeheugen'"));
 assert.ok(queries.pages.includes('is_robot=false and toestemming=true'));
 assert.ok(queries.sources.includes("tenant_id='bedrijfsgeheugen'"));
 assert.ok(Object.values(queries).every(q=>/^(with|select)\s/i.test(q)));
 const requests=[];
 const r=await collect({token:'test',now,fetcher:async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>[]};}});
 assert.equal(r.state,'READ_ONLY_PROVIDER_OBSERVED');
 assert.equal(requests.length,3);
 assert.ok(requests.every(x=>x.url.endsWith('/database/query/read-only')&&x.options.method==='POST'));
 assert.equal((await collect({token:'',now})).state,'AUTH_REQUIRED');
});
test('transient 429/503 errors receive exactly two bounded read-only retries and preserve canonical provider evidence',async()=>{
 const attempts=[];const waits=[];
 const output=await readBoundedCanonicalSource({kind:'social',query:queries.social,token:'dummy',
  fetcher:async(url,request)=>{attempts.push({url,request});return attempts.length===3?{ok:true,status:200,json:async()=>[{post_id:'verified'}]}:{ok:false,status:attempts.length===1?429:503};},
  wait:async ms=>waits.push(ms)});
 assert.equal(output[0].post_id,'verified');
 assert.deepEqual(waits,[300,900]);
 assert.equal(attempts.length,3);
 assert.ok(attempts.every(a=>a.request.method==='POST'&&a.url.endsWith('/database/query/read-only')));
});
test('read-only retry fails closed after maximum three transient attempts',async()=>{
 let calls=0;const waits=[];
 await assert.rejects(readBoundedCanonicalSource({kind:'pages',query:queries.pages,token:'dummy',
  fetcher:async()=>{calls++;return {ok:false,status:502};},wait:async n=>waits.push(n)}),/PROVIDER_READONLY_RETRY_EXHAUSTED/);
 assert.equal(calls,3);assert.deepEqual(waits,[300,900]);
});
test('auth failures and malformed provider responses do not retry or pretend to be observed',async()=>{
 let calls=0;
 await assert.rejects(readBoundedCanonicalSource({kind:'sources',query:queries.sources,token:'dummy',
  fetcher:async()=>{calls++;return {ok:false,status:403};},wait:async()=>{throw Error('should not sleep');}}),/PROVIDER_AUTH_OR_SCOPE_DENIED/);
 assert.equal(calls,1);
 await assert.rejects(readBoundedCanonicalSource({kind:'sources',query:queries.sources,token:'dummy',
  fetcher:async()=>{calls++;return {ok:true,status:200,json:async()=>({fake:'data'})};},wait:async()=>{throw Error('should not sleep');}}),/EVIDENCE_RESPONSE_SHAPE_UNVERIFIED/);
 assert.equal(calls,2);
 await assert.rejects(readBoundedCanonicalSource({kind:'sources',query:'drop table anything',token:'dummy',fetcher:async()=>{throw Error('no network');},wait:async()=>{}}),/UNAUTHORIZED_SOURCE_QUERY/);
});

test('LinkedIn independently linked real post impressions are analyzed without inventing video views or audience reach',()=>{
 const linked={
   post_id:'urn:li:share:7519277505673986048',platform:'linkedin',
   published_at:'2026-10-23T06:04:20Z',observed_at:'2026-10-24T13:18:19Z',
   data_quality:'PROVIDER_OBSERVED_LINKED',
   metrics:{impressions:5,comments:0,likes:0,clicks:1}
 };
 const x=diagnoseDailyPerformance({evidence:{...feed,social:[linked]},now:new Date('2026-10-24T17:00:00Z')});
 const post=x.social_posts[0];
 assert.equal(post.impressions,5);
 assert.equal(post.exposure_kind,'impressions');
 assert.equal(post.views,null);
 assert.equal(post.reach,null);
 assert.equal(post.engagement_rate,0);
 assert.equal(post.suggestion,'COLLECT_COMPARABLE_PROVIDER_EVIDENCE');
 assert.equal(x.next_day_hypotheses.filter(t=>t.scope==='social').length,0);
});
