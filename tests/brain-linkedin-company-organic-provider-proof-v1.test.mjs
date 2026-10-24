import test from 'node:test';
import assert from 'node:assert/strict';
import {verifiedLinkedinCompanySourceSnapshot,verifiedLinkedinCompanySourceBatch}
  from '../supabase/functions/_shared/verified-linkedin-organic-snapshot.mjs';
import {diagnoseDailyPerformance} from '../tools/content-growth/daily-performance-diagnostics.mjs';
const now=new Date('2026-10-24T15:40:00Z');
const urn='urn:li:share:7518915119540576256';
const source={tenant_id:'bedrijfsgeheugen',source_key:'linkedin_company_post:'+urn,
  quality:'PROVIDER_OBSERVED_UNLINKED',source_observed_at:'2026-10-24T13:18:19.800Z',
  metrics:{post_id:urn,share_impression_count:13,share_like_count:0,share_comment_count:0,share_clicks_count:0,share_video_views:0},
  evidence:{source:'windsor.ai',scope:'post-snapshot',connector:'linkedin_organic',
    provider:'linkedin',account_id:'18234216',provider_post_urn:urn,provider_date:'2026-10-22'}};
const post={tenant_id:'bedrijfsgeheugen',post_id:'linkedin-company:'+urn,platform:'linkedin',channel_kind:'linkedin_company',
  external_post_id:urn,published_at:'2026-10-22T06:04:20Z'};
const obligation={tenant_id:'canonical',channel:'linkedin_company',status:'LIVE_PROVEN',external_id:urn,
  live_proven_at:'2026-10-22T06:04:22Z',
  evidence:{author_urn:'urn:li:organization:18234216',provider_truth_verified:true,
  linkedin_readback:{author:'urn:li:organization:18234216',id:urn}}};
test('a 3-way independent URN, author/account and provider source match produces only daily scoped metrics',()=>{
 const x=verifiedLinkedinCompanySourceSnapshot({source,post,obligation,now});
 assert.equal(x.tenant_id,'bedrijfsgeheugen');assert.equal(x.post_id,post.post_id);
 assert.equal(x.metrics.impressions,13);assert.equal(x.metrics.likes,0);
 assert.equal(x.data_quality,'OBSERVED_PARTIAL_SCOPE');
 assert.equal(x.metrics.metric_scope,'LINKEDIN_ORGANIC_POST_PROVIDER_DATE_NOT_LIFETIME');
 assert.equal(x.metrics.customer_conversion_observed,false);
 assert.equal(Object.hasOwn(x.metrics,'orders'),false);
 assert.equal(Object.hasOwn(x.metrics,'views'),false);
});
test('misbound source, author mismatch, absent live proof and forged post do not get indexed as verified',()=>{
 const samples=[
  {source:{...source,evidence:{...source.evidence,account_id:'99999999'}}},
  {source:{...source,quality:'STALE_PROVIDER'}},
  {source:{...source,metrics:{post_id:urn,share_impression_count:-1}}},
  {source:{...source,evidence:{...source.evidence,provider_post_urn:'urn:li:share:999999999999999'}}},
  {post:{...post,tenant_id:'other-client'}},
  {post:{...post,channel_kind:'linkedin_personal'}},
  {obligation:{...obligation,status:'PUBLISHED'}},
  {obligation:{...obligation,evidence:{...obligation.evidence,provider_truth_verified:false}}},
  {obligation:{...obligation,evidence:{...obligation.evidence,linkedin_readback:{id:urn,author:'urn:li:person:12345678'}}}}
 ];
 for(const patch of samples){
   assert.equal(verifiedLinkedinCompanySourceSnapshot({source,post,obligation,...patch,now}),null);
 }
});
test('idempotent per actual observation and no duplicate snapshot rows',()=>{
 const x=verifiedLinkedinCompanySourceBatch({sources:[source,source],posts:[post],obligations:[obligation],now});
 assert.equal(x.length,1);assert.equal(x[0].source_event_id,x[0].snapshot_id);
 assert.ok(x[0].source_event_id.includes('2026-10-24T13:18:19.800Z'));
});
test('linked daily scoped LinkedIn impressions can inform diagnostic ratio without pretending to be views or customer sales',()=>{
 const snap=verifiedLinkedinCompanySourceSnapshot({source,post,obligation,now});
 const x=diagnoseDailyPerformance({now,evidence:{state:'READ_ONLY_PROVIDER_OBSERVED',
   social:[{post_id:post.post_id,platform:'linkedin',published_at:post.published_at,observed_at:snap.observed_at,
     data_quality:snap.data_quality,source:snap.source,metrics:snap.metrics}],sources:[],pages:[]}});
 assert.equal(x.social_posts[0].impressions,13);
 assert.equal(x.social_posts[0].views,null);
 assert.equal(x.social_posts[0].engagement_rate,0);
 assert.equal(x.social_posts[0].conversion_outcome,'UNKNOWN_UNLESS_ATTRIBUTED');
 assert.equal(x.next_day_hypotheses.length,0); // do not overfit 13 impressions
});
