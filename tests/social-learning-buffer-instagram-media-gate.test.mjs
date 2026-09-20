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
 miraGatePassed:true,contentPersona:'mira',contentClass:'mira_daily_life',mediaKind,assetUrl:'https://cdn.example/final.mp4',assetMimeType:'video/mp4',
 instagramVisual:{verified:true,miraPresent:true,genericBrandCreative:false,semanticVerified:true,evidenceMethod:'vision',dailyLifeScene:true,miraCentralSubject:true,textDominant:false,brandTemplateDominant:false,evidenceRefs:['vision:final-media'],assetUrl:'https://cdn.example/final.mp4',placeholderDetected:false,identityClass:'mira_daily_life',formatVerified:true,frameEvidence:frames()},
 ...extra
});
const imageVisual=(extra={})=>({
 verified:true,miraPresent:true,genericBrandCreative:false,semanticVerified:true,evidenceMethod:'vision',dailyLifeScene:true,miraCentralSubject:true,textDominant:false,brandTemplateDominant:false,evidenceRefs:['vision:final-image'],assetUrl:'https://cdn.example/final.jpg',placeholderDetected:false,
 identityClass:'mira_daily_life',formatVerified:true,width:1080,height:1350,colorSpace:'RGB',hasAlpha:false,
 decodeComplete:true,visualComplete:true,grayOrEmptyDetected:false,...extra
});
const runImage=(visualExtra={},extra={})=>run('image',{
 assetUrl:'https://cdn.example/final.jpg',assetMimeType:'image/jpeg',instagramVisual:imageVisual(visualExtra),...extra
});

test('video requires start middle and end frame evidence',()=>{
 const r=run('video',{instagramVisual:{verified:true,miraPresent:true,genericBrandCreative:false,semanticVerified:true,evidenceMethod:'vision',dailyLifeScene:true,miraCentralSubject:true,textDominant:false,brandTemplateDominant:false,evidenceRefs:['vision:final-media'],assetUrl:'https://cdn.example/final.mp4',placeholderDetected:false,identityClass:'mira_daily_life',formatVerified:true,frameEvidence:frames().slice(0,2)}});
 assert.equal(r.authorized,false);
 assert.ok(r.reasons.includes('INSTAGRAM_VIDEO_FRAME_EVIDENCE_REQUIRED'));
});

test('video blocks a Mira identity mismatch in any sampled frame',()=>{
 const f=frames(); f[1]={...f[1],identityClass:'generic_person'};
 const r=run('video',{instagramVisual:{verified:true,miraPresent:true,genericBrandCreative:false,semanticVerified:true,evidenceMethod:'vision',dailyLifeScene:true,miraCentralSubject:true,textDominant:false,brandTemplateDominant:false,evidenceRefs:['vision:final-media'],assetUrl:'https://cdn.example/final.mp4',placeholderDetected:false,identityClass:'mira_daily_life',formatVerified:true,frameEvidence:f}});
 assert.equal(r.authorized,false);
 assert.ok(r.reasons.includes('INSTAGRAM_MIRA_FRAME_IDENTITY_REQUIRED'));
});

test('reel blocks a placeholder in any sampled frame',()=>{
 const f=frames(); f[2]={...f[2],placeholderDetected:true};
 const r=run('reel',{instagramVisual:{verified:true,miraPresent:true,genericBrandCreative:false,semanticVerified:true,evidenceMethod:'vision',dailyLifeScene:true,miraCentralSubject:true,textDominant:false,brandTemplateDominant:false,evidenceRefs:['vision:final-media'],assetUrl:'https://cdn.example/final.mp4',placeholderDetected:false,identityClass:'mira_daily_life',formatVerified:true,frameEvidence:f}});
 assert.equal(r.authorized,false);
 assert.ok(r.reasons.includes('INSTAGRAM_VIDEO_PLACEHOLDER_BLOCKED'));
});

test('video and reel require verified publish format',()=>{
 for(const kind of ['video','reel']){
  const r=run(kind,{instagramVisual:{verified:true,miraPresent:true,genericBrandCreative:false,semanticVerified:true,evidenceMethod:'vision',dailyLifeScene:true,miraCentralSubject:true,textDominant:false,brandTemplateDominant:false,evidenceRefs:['vision:final-media'],assetUrl:'https://cdn.example/final.mp4',placeholderDetected:false,identityClass:'mira_daily_life',formatVerified:false,frameEvidence:frames()}});
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

test('image blocks low-resolution final assets such as the 320x400 incident asset',()=>{
 const r=runImage({width:320,height:400});
 assert.equal(r.authorized,false);
 assert.ok(r.reasons.includes('INSTAGRAM_IMAGE_DIMENSIONS_REQUIRED'));
});

test('image requires RGB JPEG without alpha',()=>{
 for(const [visualExtra,extra] of [
  [{}, {assetMimeType:'image/png'}],
  [{colorSpace:'CMYK'}, {}],
  [{hasAlpha:true}, {}]
 ]){
  const r=runImage(visualExtra,extra);
  assert.equal(r.authorized,false);
 }
 assert.ok(runImage({}, {assetMimeType:'image/png'}).reasons.includes('INSTAGRAM_IMAGE_JPEG_REQUIRED'));
 assert.ok(runImage({colorSpace:'CMYK'}).reasons.includes('INSTAGRAM_IMAGE_RGB_REQUIRED'));
 assert.ok(runImage({hasAlpha:true}).reasons.includes('INSTAGRAM_IMAGE_ALPHA_BLOCKED'));
});

test('image requires a fully decodable and visually complete final asset',()=>{
 const truncated=runImage({decodeComplete:false});
 assert.equal(truncated.authorized,false);
 assert.ok(truncated.reasons.includes('INSTAGRAM_IMAGE_DECODE_INCOMPLETE'));
 const incomplete=runImage({visualComplete:false});
 assert.equal(incomplete.authorized,false);
 assert.ok(incomplete.reasons.includes('INSTAGRAM_IMAGE_VISUAL_INCOMPLETE'));
 const gray=runImage({grayOrEmptyDetected:true});
 assert.equal(gray.authorized,false);
 assert.ok(gray.reasons.includes('INSTAGRAM_IMAGE_GRAY_OR_EMPTY_BLOCKED'));
});

test('image requires verified publish format and exact final asset readback',()=>{
 const unverified=runImage({formatVerified:false});
 assert.equal(unverified.authorized,false);
 assert.ok(unverified.reasons.includes('INSTAGRAM_MEDIA_FORMAT_UNVERIFIED'));
 const mismatch=runImage({assetUrl:'https://cdn.example/other.jpg'});
 assert.equal(mismatch.authorized,false);
 assert.ok(mismatch.reasons.includes('INSTAGRAM_FINAL_ASSET_MISMATCH'));
});

test('Instagram blocks content that is not explicitly assigned to Mira',()=>{
 const r=runImage({}, {contentPersona:'bedrijfsgeheugen'});
 assert.equal(r.authorized,false);
 assert.ok(r.reasons.includes('INSTAGRAM_MIRA_PERSONA_REQUIRED'));
});

test('Instagram blocks generic brand creative even when other media proof exists',()=>{
 const r=runImage({genericBrandCreative:true});
 assert.equal(r.authorized,false);
 assert.ok(r.reasons.includes('INSTAGRAM_GENERIC_BRAND_CREATIVE_BLOCKED'));
});

test('Instagram requires Mira to be visibly present in the final asset',()=>{
 const r=runImage({miraPresent:false});
 assert.equal(r.authorized,false);
 assert.ok(r.reasons.includes('INSTAGRAM_VISIBLE_MIRA_REQUIRED'));
});

test('valid 1080x1350 RGB JPEG final image authorizes',()=>assert.equal(runImage().authorized,true));
test('reel authorizes exact verified Mira MP4 with complete frame evidence',()=>assert.equal(run('reel').authorized,true));

test('OpenArt Veo and Placid cannot bypass the canonical media gate',()=>{
 const policy=CHANNELS.instagram_company.mediaPolicy;
 assert.deepEqual(policy.allowedKinds,['image','reel']);
 assert.deepEqual(policy.requiredVideoFramePositions,['start','middle','end']);
 assert.deepEqual(policy.generatorsMayNotBypassGate,['openart','veo','placid']);
 assert.equal(policy.providerLineageRequired,true);
 assert.deepEqual(policy.providerRouting.reel.allowedProviders,['openart']);
 assert.equal(policy.providerRouting.reel.requiredProvider,'openart');
 assert.deepEqual(policy.providerRouting.image.allowedProviders,['openart']);
 assert.equal(policy.providerRouting.image.requiredProvider,'openart');
});
