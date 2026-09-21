import test from 'node:test';
import assert from 'node:assert/strict';
import {CHANNELS,authorizeSocialPublication} from '../platform/social-channel-identity-gate.mjs';

const lineage={contentId:'mira-media-1',calendarDate:'2026-09-21',predictionId:'pred-media-1',sourceDecisionId:'decision-media-1'};
const frames=(identityClass='mira_daily_life',placeholderDetected=false)=>[
 {position:'start',verified:true,evidenceRefs:['vision:start'],identityClass,placeholderDetected},
 {position:'middle',verified:true,evidenceRefs:['vision:middle'],identityClass,placeholderDetected},
 {position:'end',verified:true,evidenceRefs:['vision:end'],identityClass,placeholderDetected}
];
const reelVisual=(extra={})=>({
 verified:true,miraPresent:true,genericBrandCreative:false,semanticVerified:true,evidenceMethod:'vision',
 dailyLifeScene:true,miraCentralSubject:true,textDominant:false,brandTemplateDominant:false,
 evidenceRefs:['vision:final-media'],assetUrl:'https://cdn.example/final.mp4',placeholderDetected:false,
 identityClass:'mira_daily_life',formatVerified:true,width:1080,height:1920,frameEvidence:frames(),...extra
});
const run=(extra={})=>authorizeSocialPublication({
 channelKind:'instagram_company',channelId:CHANNELS.instagram_company.channelId,text:'Mira zoekt de laatste versie.',lineage,
 miraGatePassed:true,contentPersona:'mira',contentClass:'mira_daily_life',mediaKind:'reel',
 assetUrl:'https://cdn.example/final.mp4',assetMimeType:'video/mp4',instagramVisual:reelVisual(),...extra
});

test('reel requires start middle and end frame evidence',()=>{
 const r=run({instagramVisual:reelVisual({frameEvidence:frames().slice(0,2)})});
 assert.equal(r.authorized,false); assert.ok(r.reasons.includes('INSTAGRAM_VIDEO_FRAME_EVIDENCE_REQUIRED'));
});
test('reel blocks a Mira identity mismatch in any sampled frame',()=>{
 const f=frames(); f[1]={...f[1],identityClass:'generic_person'};
 const r=run({instagramVisual:reelVisual({frameEvidence:f})});
 assert.equal(r.authorized,false); assert.ok(r.reasons.includes('INSTAGRAM_MIRA_FRAME_IDENTITY_REQUIRED'));
});
test('reel blocks a placeholder in any sampled frame',()=>{
 const f=frames(); f[2]={...f[2],placeholderDetected:true};
 const r=run({instagramVisual:reelVisual({frameEvidence:f})});
 assert.equal(r.authorized,false); assert.ok(r.reasons.includes('INSTAGRAM_VIDEO_PLACEHOLDER_BLOCKED'));
});
test('reel requires verified publish format',()=>{
 const r=run({instagramVisual:reelVisual({formatVerified:false})});
 assert.equal(r.authorized,false); assert.ok(r.reasons.includes('INSTAGRAM_MEDIA_FORMAT_UNVERIFIED'));
});
test('reel requires MP4 final asset',()=>{
 const r=run({assetMimeType:'image/jpeg'});
 assert.equal(r.authorized,false); assert.ok(r.reasons.includes('INSTAGRAM_VIDEO_MP4_REQUIRED'));
});
test('every non-Reel format is blocked before provider mutation',()=>{
 for(const kind of ['image','video','carousel','story','']){
  const r=run({mediaKind:kind});
  assert.equal(r.authorized,false,kind);
  assert.ok(r.reasons.includes('INSTAGRAM_REEL_REQUIRED') || r.reasons.includes('INSTAGRAM_MEDIA_KIND_BLOCKED'));
 }
});
test('Instagram blocks content not explicitly assigned to Mira',()=>{
 const r=run({contentPersona:'bedrijfsgeheugen'});
 assert.equal(r.authorized,false); assert.ok(r.reasons.includes('INSTAGRAM_MIRA_PERSONA_REQUIRED'));
});
test('Instagram blocks generic brand creative',()=>{
 const r=run({instagramVisual:reelVisual({genericBrandCreative:true})});
 assert.equal(r.authorized,false); assert.ok(r.reasons.includes('INSTAGRAM_GENERIC_BRAND_CREATIVE_BLOCKED'));
});
test('Instagram requires Mira visibly present and central',()=>{
 let r=run({instagramVisual:reelVisual({miraPresent:false})});
 assert.equal(r.authorized,false); assert.ok(r.reasons.includes('INSTAGRAM_VISIBLE_MIRA_REQUIRED'));
 r=run({instagramVisual:reelVisual({miraCentralSubject:false})});
 assert.equal(r.authorized,false); assert.ok(r.reasons.includes('INSTAGRAM_MIRA_CENTRAL_SUBJECT_REQUIRED'));
});
test('Instagram requires a Mira daily-life scene',()=>{
 const r=run({instagramVisual:reelVisual({dailyLifeScene:false})});
 assert.equal(r.authorized,false); assert.ok(r.reasons.includes('INSTAGRAM_DAILY_LIFE_SCENE_REQUIRED'));
});
test('Instagram blocks text-dominant and brand-template-dominant Reel creative',()=>{
 let r=run({instagramVisual:reelVisual({textDominant:true})});
 assert.equal(r.authorized,false); assert.ok(r.reasons.includes('INSTAGRAM_TEXT_DOMINANT_BLOCKED'));
 r=run({instagramVisual:reelVisual({brandTemplateDominant:true})});
 assert.equal(r.authorized,false); assert.ok(r.reasons.includes('INSTAGRAM_BRAND_TEMPLATE_BLOCKED'));
});
test('reel requires exact final asset readback',()=>{
 const r=run({instagramVisual:reelVisual({assetUrl:'https://cdn.example/other.mp4'})});
 assert.equal(r.authorized,false); assert.ok(r.reasons.includes('INSTAGRAM_FINAL_ASSET_MISMATCH'));
});
test('valid Mira Reel authorizes',()=>assert.equal(run().authorized,true));
test('provider policy is OpenArt Reel-only with no image fallback',()=>{
 const policy=CHANNELS.instagram_company.mediaPolicy;
 assert.deepEqual(policy.allowedKinds,['reel']);
 assert.equal(policy.imageFallbackAllowed,false);
 assert.equal(policy.genericFallbackAllowed,false);
 assert.equal(policy.requiresDailyReel,true);
 assert.deepEqual(policy.requiredVideoFramePositions,['start','middle','end']);
 assert.deepEqual(policy.generatorsMayNotBypassGate,['openart','veo','placid']);
 assert.equal(policy.providerLineageRequired,true);
 assert.deepEqual(policy.providerRouting.reel.allowedProviders,['openart']);
 assert.equal(policy.providerRouting.reel.requiredProvider,'openart');
 assert.equal(policy.providerRouting.image,undefined);
});
