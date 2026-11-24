import test from 'node:test';
import assert from 'node:assert/strict';
import {selectLinkedInEditorialStrategy as brain} from '../brain/creative/revenue-content-intelligence.mjs';
import {selectLinkedInEditorialStrategy as edge,verifiedLinkedInEditorialHistory,prepareOriginalLinkedInEditorialDecision} from '../supabase/functions/_shared/linkedin-editorial-strategy.mjs';
const at='2026-11-24T16:00:00Z',channel='linkedin_company';
const post=(id,extra={})=>({tenant_id:'bedrijfsgeheugen',platform:'linkedin',channel_kind:channel,external_post_id:'urn:li:share:'+id,published_at:'2026-11-23T09:00:00Z',content_pillar:'educatie',format:'text',...extra});
const proof=(id,extra={})=>({tenant_id:'canonical',channel,external_id:'urn:li:share:'+id,live_proven_at:'2026-11-23T09:01:00Z',...extra});
test('BRAIN and Edge have exactly one selector, no second implementation',()=>assert.equal(brain,edge));
test('history requires exact canonical provider obligation, channel identity, valid dates and unique post',()=>{
 const posts=[post(1),post(2),post(3),post(4,{tenant_id:'canonical'}),post(5),post(6),post(6)];
 const obligations=[proof(1),proof(2,{channel:'linkedin_personal'}),proof(3,{live_proven_at:null}),proof(4),proof(5,{live_proven_at:'2026-11-25T00:00:00Z'}),proof(6)];
 assert.deepEqual(verifiedLinkedInEditorialHistory({channel,posts,obligations,at}),[{providerPostId:'urn:li:share:1',pillar:'educatie',format:'tekstpost'}]);
});
test('editor decision rotates only explicit eligible options and never starts a competing experiment',()=>{
 const input={channel,runDate:'2026-11-24',at,posts:[post(1)],obligations:[proof(1)],source:{verified:true,channel,sourceId:'source-a',sourceRevision:'r1',eligiblePillars:['educatie','product'],eligibleFormats:['tekstpost']},experimentOwner:'NO_NEW_EXPERIMENT'};
 const x=prepareOriginalLinkedInEditorialDecision(input);
 assert.equal(x.state,'EDITORIAL_CANDIDATE');assert.equal(x.selection.pillar,'product');assert.equal(x.selection.format,'tekstpost');assert.equal(x.authorizesPublication,false);assert.equal(x.learningApplied,false);
 assert.equal(prepareOriginalLinkedInEditorialDecision({...input,experimentOwner:'ORIGINAL_LINKEDIN_LOOP'}).selection.pillar,null);
 assert.equal(prepareOriginalLinkedInEditorialDecision({...input,source:{...input.source,verified:false}}).state,'SOURCE_ELIGIBILITY_REQUIRED');
 assert.equal(prepareOriginalLinkedInEditorialDecision({...input,source:{...input.source,channel:'linkedin_personal'}}).selection.pillar,null);
});
