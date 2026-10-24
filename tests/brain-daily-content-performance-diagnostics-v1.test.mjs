import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnoseDailyPerformance} from '../tools/content-growth/daily-performance-diagnostics.mjs';
import {queries,collect} from '../tools/content-growth/collect-canonical-evidence.mjs';
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