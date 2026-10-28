import test from 'node:test';
import assert from 'node:assert/strict';
import {selectMeasuredNextPostTest} from '../supabase/functions/_shared/measured-next-post-challenger.mjs';
const now=new Date('2026-10-28T16:00:00Z');
const posts=['p1','p2'].map(post_id=>({post_id,tenant_id:'bedrijfsgeheugen',platform:'linkedin',channel_kind:'linkedin_company',published_at:'2026-10-26T10:00:00Z'}));
const snapshots=posts.map(p=>({post_id:p.post_id,tenant_id:'bedrijfsgeheugen',observed_at:'2026-10-28T12:00:00Z',data_quality:'PROVIDER_OBSERVED_LINKED',metrics:{impressions:150,clicks:0,comments:0,likes:0}}));
test('verified exposure with zero actual clicks triggers one next-step test instead of only a comment test',()=>{
 const r=selectMeasuredNextPostTest({posts,snapshots,now});
 assert.equal(r.state,'ELIGIBLE_BOUNDED_NEXT_POST_TEST');assert.equal(r.proposed_test.hypothesis_id,'TEST_USEFUL_NEXT_STEP_FOR_ZERO_CLICKS');assert.equal(r.proposed_test.primary_metric,'provider_observed_clicks_per_eligible_exposure');assert.equal(r.cumulative_verified_clicks,0);assert.equal(r.hypothesis_not_caused_or_proven,true);
});
test('missing click metrics never become zero clicks and sparse exposure cannot establish failure',()=>{
 const missing=snapshots.map(s=>({...s,metrics:{impressions:150,comments:0,likes:0}}));
 assert.notEqual(selectMeasuredNextPostTest({posts,snapshots:missing,now}).proposed_test.hypothesis_id,'TEST_USEFUL_NEXT_STEP_FOR_ZERO_CLICKS');
 const sparse=snapshots.map(s=>({...s,metrics:{...s.metrics,impressions:6}}));assert.equal(selectMeasuredNextPostTest({posts,snapshots:sparse,now}).state,'WAIT_FOR_COMPARABLE_PROVIDER_METRICS');
});
