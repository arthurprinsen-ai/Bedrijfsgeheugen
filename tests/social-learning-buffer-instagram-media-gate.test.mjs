import test from 'node:test';
import assert from 'node:assert/strict';
import {CHANNELS,authorizeSocialPublication} from '../platform/social-channel-identity-gate.mjs';

const lineage={contentId:'mira-media-1',calendarDate:'2026-09-14',predictionId:'pred-media-1',sourceDecisionId:'decision-media-1'};
const frames=(identityClass='mira_daily_life',placeholderDetected=false)=>[
 {position:'start',verified:true,evidenceRefs:['vision:start'],identityClass,placeholderDetected},
 {position:'middle',verified:true,evidenceRefs:['vision:middle'],identityClass,placeholderDetected},
 {position:'end',verified:true,evidenceRefs:['vision:end'],identityClass,placeholderDetected}
];
const run=(mediaKind,extra={})=>authorizeSocialPublication({
 channelKind:'instagram_company',channelId:CHANNELS.instagram_company.channelId,text:'Mira zoekt de laatste versie.',lineage,
 miraGatePassed:true,mediaKind,assetUrl:'https://cdn.example/final.mp4',assetMimeType:'video/mp4',
 instagramVisual:{verified:true,evidenceRefs:['vision:final-media'],assetUrl:'https://cdn.example/final.mp4',placeholderDetected:false,identityClass:'mira_daily_life',formatVerified:true,frameEvidence:frames()},
 ...extra
});

test('video requires start middle and end frame evidence',()=>{
 const r=run('video',{instagramVisual:{verified:true,evidenceRefs:['vision:final-media'],assetUrl:'https://cdn.example/final.mp4',placeholderDetected:false,identityClass:'mira_daily_life',formatVerified:true,frameEvidence:frames().slice(0,2)}});
 assert.equal(r.authorized,false);
 assert.ok(r.reasons.includes('INSTAGRAM_VIDEO_FRAME_EVIDENCE_REQUIRED'));
});

test('video blocks a Mira identity mismatch in any sampled frame',()=>{
 const f=frames(); f[1]={...f[1],identityClass:'generic_person'};
 const r=run('video',{instagramVisual:{verified:true,evidenceRefs:['vision:final-media'],assetUrl:'https://cdn.example/final.mp4',placeholderDetected:false,identityClass:'mira_daily_life',formatVerified:true,frameEvidence:f}});
 assert.equal(r.authorized,false);
 assert.ok(r.reasons.includes('INSTAGRAM_MIRA_FRAME_IDENTITY_REQUIRED'));
});

test('reel blocks a placeholder in any sampled frame',()=>{
 const f=frames(); f[2]={...f[2],placeholderDetected:true};
 const r=run('reel',{instagramVisual:{verified:true,evidenceRefs:['vision:final-media'],assetUrl:'https://cdn.example/final.mp4',placeholderDetected:false,identityClass:'mira_daily_life',formatVerified:true,frameEvidence:f}});
 assert.equal(r.authorized,false);
 assert.ok(r.reasons.includes('INSTAGRAM_VIDEO_PLACEHOLDER_BLOCKED'));
});

test('video and reel require verified publish format',()=>{
 for(const kind of ['video','reel']){
  const r=run(kind,{instagramVisual:{verified:true,evidenceRefs:['vision:final-media'],assetUrl:'https://cdn.example/final.mp4',placeholderDetected:false,identityClass:'mira_daily_life',formatVerified:false,frameEvidence:frames()}});
  assert.equal(r.authorized,false);
  assert.ok(r.reasons.includes('INSTAGRAM_MEDIA_FORMAT_UNVERIFIED'));
 }
});

test('video and reel require MP4 final asset',()=>{
 for(const kind of ['video','reel']){
  const r=run(kind,{assetMimeType:'image/jpeg'});
  assert.equal(r.authorized,false);
  assert.ok(r.reasons.includes('INSTAGRAM_VIDEO_MP4_REQUIRED'));
 }
});

test('reel authorizes exact verified Mira MP4 with complete frame evidence',()=>assert.equal(run('reel').authorized,true));

test('OpenArt Veo and Placid cannot bypass the canonical media gate',()=>{
 const policy=CHANNELS.instagram_company.mediaPolicy;
 assert.deepEqual(policy.allowedKinds,['image','video','reel']);
 assert.deepEqual(policy.requiredVideoFramePositions,['start','middle','end']);
 assert.deepEqual(policy.generatorsMayNotBypassGate,['openart','veo','placid']);
});
