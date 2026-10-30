import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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

test('APPROVED personal draft with failed original LinkedIn auth is never shown as publisher ready',()=>{
 const rows=[
  row('linkedin_company','LIVE_PROVEN','', 'urn:li:share:verified','2026-10-29T09:04:29Z'),
  {...row('linkedin_personal','APPROVED'),auth_preflight:'failed',auth_error:'LINKEDIN_REAUTH_REQUIRED'},
  row('instagram','BLOCKED','VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH:start:face=0.900'),
  row('blog','GENERATED')
 ];
 const result=summarizePublicationEvidence(rows,{count:4,date,observedAt});
 const personal=result.channels.find(x=>x.channel==='linkedin_personal');
 assert.equal(personal.registryStatus,'APPROVED');
 assert.equal(personal.providerIdRecorded,false);
 assert.equal(personal.internalLiveProofRecorded,false);
 assert.equal(personal.recoveryCode,'LINKEDIN_PERSONAL_CANONICAL_OAUTH_CONSENT_REQUIRED');
 assert.doesNotMatch(JSON.stringify(result),/REVOKED_ACCESS_TOKEN|ca_omYO|LINKEDIN_REAUTH_REQUIRED/);
});

test('provider-effect readback outranks auth fault; no duplicate post to repair auth',()=>{
 const rows=[
  row('linkedin_company','LIVE_PROVEN','', 'urn:li:share:verified','2026-10-29T09:04:29Z'),
  {...row('linkedin_personal','LIVE_PROVEN','', 'urn:li:share:private-post','2026-10-29T19:00:00Z'),auth_preflight:'failed',auth_error:'LINKEDIN_REAUTH_REQUIRED'},
  row('instagram','BLOCKED','MEDIA_ASSET_REQUIRED'),row('blog','GENERATED')
 ];
 const result=summarizePublicationEvidence(rows,{count:4,date,observedAt});
 assert.equal(result.channels[1].recoveryCode,'NO_REPOST_COLLECT_OUTCOMES');
 assert.doesNotMatch(JSON.stringify(result),/urn:li|private-post/);
});

test('PUBLISHED personal LinkedIn with exact provider ID and 403 remains unproven and no-repost',()=>{
  const rows=[
    row('linkedin_company','LIVE_PROVEN','','urn:li:share:other','2026-10-29T09:04:29Z'),
    {...row('linkedin_personal','PUBLISHED','','urn:li:share:personal',null),
      provider_readback_error:'COMPOSIO_LINKEDIN_GET_POST_CONTENT_200:Forbidden. You do not have permission to access this post.',
      auth_preflight:'failed',auth_error:'LINKEDIN_REAUTH_REQUIRED'},
    row('instagram','BLOCKED','MEDIA_ASSET_REQUIRED'),row('blog','GENERATED')
  ];
  const out=summarizePublicationEvidence(rows,{count:4,date,observedAt});
  const personal=out.channels.find(c=>c.channel==='linkedin_personal');
  assert.equal(personal.registryStatus,'PUBLISHED');
  assert.equal(personal.providerIdRecorded,true);
  assert.equal(personal.internalLiveProofRecorded,false);
  assert.equal(personal.recoveryCode,'LINKEDIN_PERSONAL_PROVIDER_CREATED_READBACK_FORBIDDEN_NO_REPOST');
  assert.doesNotMatch(JSON.stringify(out),/urn:li:|Forbidden|LINKEDIN_REAUTH_REQUIRED|access this post/);
});

test('readback permission error is not conflated with absent provider side effect or live proof',()=>{
  const base=[
    row('linkedin_company','LIVE_PROVEN','','urn:li:share:other','2026-10-29T09:04:29Z'),
    {...row('linkedin_personal','PUBLISHED','','urn:li:share:existing',null),provider_readback_error:'HTTP 403'},
    row('instagram','BLOCKED','MEDIA_ASSET_REQUIRED'),row('blog','GENERATED')
  ];
  const verified=summarizePublicationEvidence(base,{count:4,date,observedAt});
  assert.equal(verified.channels[1].recoveryCode,'LINKEDIN_PERSONAL_PROVIDER_CREATED_READBACK_FORBIDDEN_NO_REPOST');
  const noEffect=structuredClone(base);
  noEffect[1].external_id=null;
  assert.notEqual(summarizePublicationEvidence(noEffect,{count:4,date,observedAt}).channels[1].recoveryCode,
    'LINKEDIN_PERSONAL_PROVIDER_CREATED_READBACK_FORBIDDEN_NO_REPOST');
  const honestLive=structuredClone(base);
  honestLive[1].status='LIVE_PROVEN';honestLive[1].live_proven_at='2026-10-29T22:00:00Z';
  assert.equal(summarizePublicationEvidence(honestLive,{count:4,date,observedAt}).channels[1].recoveryCode,'NO_REPOST_COLLECT_OUTCOMES');
});

test('original Netlify/Portal V2 remains private, read-only, and human-readable',()=>{
  const server=readFileSync('netlify/functions/powerhouse-observability.mjs','utf8');
  const source=readFileSync('brain/observability/publication-evidence-readback.mjs','utf8');
  const portal=readFileSync('portal-v2/modules/powerhouse-observability.js','utf8');
  assert.match(server,/PUBLICATION_EVIDENCE_CONTRACT='social-publication-proof-v4'/);
  assert.match(source,/provider_readback_error:evidence->>readback_error/);
  assert.match(portal,/Nooit opnieuw publiceren; alleen bestaand bericht verifiëren/);
  assert.doesNotMatch(portal,/urn:li:share:7521667096859201536/);
});


test('30 October personal source UNVERIFIED is a fact/provenance gate, not an OAuth or empty feed claim',()=>{
  const today='2026-10-30';
  const rows=[
    {...row('linkedin_company','PLANNED'),publication_date:today},
    {...row('linkedin_personal','BLOCKED','PERSONAL_SOURCE_UNVERIFIED'),publication_date:today},
    {...row('instagram','PLANNED'),publication_date:today},
    {...row('blog','GENERATED'),publication_date:today}
  ];
  const result=summarizePublicationEvidence(rows,{count:4,date:today,observedAt:'2026-10-30T06:20:00Z'});
  assert.equal(result.status,'REGISTRY_READBACK_COMPLETE');
  const personal=result.channels.find(c=>c.channel==='linkedin_personal');
  assert.equal(personal.recoveryCode,'PERSONAL_SOURCE_FACT_UNVERIFIED_VALIDATE_BEFORE_DRAFT');
  assert.equal(personal.registryStatus,'BLOCKED');
  assert.equal(personal.providerIdRecorded,false);
  assert.equal(personal.internalLiveProofRecorded,false);
  assert.doesNotMatch(JSON.stringify(result),/PERSONAL_SOURCE_UNVERIFIED|urn:li:|token|secret/i);
});
test('a later actual provider side effect outranks PERSONAL_SOURCE_UNVERIFIED: never resend',()=>{
  const rows=[
    row('linkedin_company','PLANNED'),
    row('linkedin_personal','PUBLISHED','PERSONAL_SOURCE_UNVERIFIED','urn:li:share:existing'),
    row('instagram','PLANNED'),
    row('blog','GENERATED')
  ];
  const result=summarizePublicationEvidence(rows,{count:4,date,observedAt});
  assert.equal(result.channels[1].recoveryCode,'PROVIDER_CREATE_RECORDED_VERIFY_READBACK_NO_REPOST');
  assert.equal(result.channels[1].providerIdRecorded,true);
});
test('original admin-only portal and server have a readable fact verification recovery contract',()=>{
  const server=readFileSync('netlify/functions/powerhouse-observability.mjs','utf8');
  const portal=readFileSync('portal-v2/modules/powerhouse-observability.js','utf8');
  assert.match(server,/PUBLICATION_EVIDENCE_CONTRACT='social-publication-proof-v4'/);
  assert.match(portal,/Controleer concreet feit, herkomst, datum en nieuw verhaal/);
  assert.doesNotMatch(portal,/PERSONAL_SOURCE_UNVERIFIED.*true/);
});
