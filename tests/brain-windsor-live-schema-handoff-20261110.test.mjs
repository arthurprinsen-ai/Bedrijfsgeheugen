import test from 'node:test';
import assert from 'node:assert/strict';
import {buildVerifiedCompanyMetricSnapshots} from '../supabase/functions/_shared/linked-company-analytics.mjs';

// Observed from the ORIGINAL Windsor staging row, Nov 10; not an invented provider status.
const org='18234216', urn='urn:li:share:7525090976026230784';
const now=new Date('2026-11-10T09:40:00Z');
const post={tenant_id:'bedrijfsgeheugen',post_id:'linkedin-company:'+urn,
  external_post_id:urn,platform:'linkedin',channel_kind:'linkedin_company',
  published_at:'2026-11-08T07:04:59.552Z'};
const proof={tenant_id:'canonical',channel:'linkedin_company',status:'LIVE_PROVEN',
  external_id:urn,live_proven_at:post.published_at,
  evidence:{provider_truth_verified:true,author_urn:'urn:li:organization:'+org,
    linkedin_readback:{id:urn,author:'urn:li:organization:'+org}}};
const stage={tenant_id:'bedrijfsgeheugen',metric_date:'2026-11-08',
  source_key:'linkedin_company_post:'+urn,quality:'PROVIDER_OBSERVED',
  source_observed_at:'2026-11-10T09:30:55Z',
  evidence:{identity:'PROVIDER_OBSERVED_UNLINKED_UNTIL_JOIN_VERIFIED',
    provider:'windsor.ai',connector:'linkedin_organic',account_id:org,
    provider_date:'2026-11-08'},
  metrics:{date:'2026-11-08',post_id:urn,share_id:urn.split(':').at(-1),
    share_url:'https://www.linkedin.com/feed/update/'+urn,
    share_impression_count:3,share_like_count:0,share_comment_count:0,
    share_clicks_count:0}};
const run=(source=stage,verified=proof,owned=post)=>buildVerifiedCompanyMetricSnapshots({
  observations:[source],publicationProofs:[verified],ownedPosts:[owned],now,max:5});

test('native Windsor account_id and identity format is accepted ONLY after original independent post and organization proof',()=>{
  const rows=run();
  assert.equal(rows.length,1);
  const [s]=rows;
  assert.equal(s.post_id,post.post_id);
  assert.equal(s.metrics.impressions,3);
  assert.equal(s.metrics.likes,0);
  assert.equal(s.metrics.provider_post_urn,urn);
  assert.equal(s.metrics.provider_organization_urn,'urn:li:organization:'+org);
  assert.equal(s.data_quality,'PROVIDER_OBSERVED_LINKED');
  assert.equal(s.source_event_id,'windsor:linkedin-company:'+urn+':2026-11-08');
  assert.equal(s.metrics.independent_proof,'EXACT_CANONICAL_LIVE_PROVEN_AUTHOR_AND_PROVIDER_ACCOUNT');
  assert.equal(Object.hasOwn(s.metrics,'revenue'),false);
});

test('native provider bridge cannot accept fake source, author, account, post or missing original publication proof',()=>{
  const bad=[
    {...stage,quality:'ESTIMATED'},
    {...stage,evidence:{...stage.evidence,identity:'UNVERIFIED'}},
    {...stage,evidence:{...stage.evidence,account_id:'10000001'}},
    {...stage,evidence:{...stage.evidence,account:'10000001'}},
    {...stage,evidence:{...stage.evidence,connector:'unknown'}},
    {...stage,evidence:{...stage.evidence,provider_date:'2026-11-05'}},
    {...stage,metrics:{...stage.metrics,share_id:'bad'}},
    {...stage,metrics:{...stage.metrics,share_url:'https://example.org/fake'}},
    {...stage,metrics:{...stage.metrics,share_impression_count:null}},
    {...stage,source_key:'linkedin_company_post:other'}
  ];
  for(const invalid of bad)assert.deepEqual(run(invalid),[]);
  assert.deepEqual(run(stage,{...proof,status:'PUBLISHED'}),[]);
  assert.deepEqual(run(stage,{...proof,evidence:{...proof.evidence,author_urn:'urn:li:organization:10000001'}}),[]);
  assert.deepEqual(run(stage,proof,{...post,channel_kind:'linkedin_personal'}),[]);
});

test('prior staged legacy account + post_identity format remains compatible, and same post never becomes a causal experiment winner',()=>{
  const old={...stage,evidence:{provider:'windsor.ai',connector:'linkedin_organic',
    account:org,post_identity:'PROVIDER_OBSERVED_UNLINKED',provider_date:'2026-11-08'}};
  const [s]=run(old);assert.ok(s);
  assert.equal(s.metrics.impressions,3);
  assert.equal(Object.hasOwn(s.metrics,'causal_improvement_verified'),false);
});
