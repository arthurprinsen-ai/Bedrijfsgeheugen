import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizePublicationEvidence } from '../brain/observability/publication-evidence-readback.mjs';

const date='2026-10-29',observedAt='2026-10-29T17:16:00Z';
function row(channel,status,last_error='',external_id=null,live_proven_at=null){
 return {tenant_id:'canonical',publication_date:date,channel,status,last_error,external_id,live_proven_at};
}
test('portal keeps Mira real quality rejection and LinkedIn duplicate source blockage red',()=>{
 const rows=[
  row('linkedin_company','LIVE_PROVEN','', 'urn:li:share:verified','2026-10-29T09:04:29Z'),
  row('linkedin_personal','BLOCKED','GLOBAL_POST_DUPLICATE_BLOCKED:STORY_FAMILY_DUPLICATE'),
  row('instagram','BLOCKED','VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH:start:face=0.900'),
  row('blog','GENERATED')
 ];
 const result=summarizePublicationEvidence(rows,{count:4,date,observedAt});
 assert.equal(result.status,'REGISTRY_READBACK_COMPLETE');
 const by=Object.fromEntries(result.channels.map(x=>[x.channel,x]));
 assert.equal(by.linkedin_personal.providerIdRecorded,false);
 assert.equal(by.linkedin_personal.recoveryCode,'NEW_FACT_VERIFIED_DISTINCT_STORY_REQUIRED');
 assert.equal(by.instagram.recoveryCode,'MIRA_REJECTED_REQUIRES_NEW_APPROVED_MEDIA');
 assert.equal(by.instagram.internalLiveProofRecorded,false);
 assert.equal(by.linkedin_company.recoveryCode,'NO_REPOST_COLLECT_OUTCOMES');
 assert.match(result.caveat,/not independent direct provider readback/);
});
test('explicit personal source-supply shortage cannot be mistaken for a post',()=>{
 const rows=[row('linkedin_company','LIVE_PROVEN','', 'urn:li:share:verified','2026-10-29T09:04:29Z'),row('linkedin_personal','BLOCKED','NO_UNIQUE_VERIFIED_PERSONAL_SOURCE'),row('instagram','BLOCKED','MEDIA_ASSET_REQUIRED'),row('blog','GENERATED')];
 const result=summarizePublicationEvidence(rows,{count:4,date,observedAt});
 const personal=result.channels.find(x=>x.channel==='linkedin_personal');
 assert.equal(personal.recoveryCode,'FRESH_INDEPENDENT_PERSONAL_SOURCE_REQUIRED');
 assert.equal(personal.providerIdRecorded,false);
});
