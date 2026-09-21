import test from 'node:test';
import assert from 'node:assert/strict';
import { CHANNELS, authorizeSocialPublication } from '../platform/social-channel-identity-gate.mjs';

const lineage={contentId:'mira-reel-v3',calendarDate:'2026-09-21',predictionId:'pred-v3',sourceDecisionId:'decision-v3'};
const frame=(position)=>({position,verified:true,evidenceRefs:['vision:'+position],identityClass:'mira_daily_life',placeholderDetected:false});
const visual={
  verified:true,semanticVerified:true,evidenceMethod:'vision',
  miraPresent:true,miraCentralSubject:true,dailyLifeScene:true,
  genericBrandCreative:false,textDominant:false,brandTemplateDominant:false,
  evidenceRefs:['vision:exact-final-mira-v3'],assetUrl:'https://cdn.example/mira-v3.mp4',
  placeholderDetected:false,identityClass:'mira_daily_life',formatVerified:true,
  width:1080,height:1920,frameEvidence:['start','middle','end'].map(frame),
};
const authorize=(extra={})=>authorizeSocialPublication({
  channelKind:'instagram_company',channelId:CHANNELS.instagram_company.channelId,
  text:'Mira probeert op maandagochtend drie agendas tegelijk te begrijpen.',
  lineage,miraGatePassed:true,contentPersona:'mira',contentClass:'mira_daily_life',
  mediaKind:'reel',assetUrl:visual.assetUrl,assetMimeType:'video/mp4',instagramVisual:visual,...extra,
});
test('Instagram company is Reel-only and Mira-only',()=>{
  const ig=CHANNELS.instagram_company;
  assert.equal(ig.identity,'mira'); assert.equal(ig.requiresContentPersona,'mira');
  assert.equal(ig.requiresVisibleMira,true); assert.deepEqual(ig.mediaPolicy.allowedKinds,['reel']);
  assert.equal(ig.mediaPolicy.imageFallbackAllowed,false); assert.equal(ig.mediaPolicy.genericFallbackAllowed,false);
  assert.equal(authorize().authorized,true);
});
test('every non-Reel format is blocked before provider mutation',()=>{
  for(const kind of ['image','video','carousel','']){
    const r=authorize({mediaKind:kind}); assert.equal(r.authorized,false,kind);
    assert.ok(r.reasons.includes('INSTAGRAM_REEL_REQUIRED') || r.reasons.includes('INSTAGRAM_MEDIA_KIND_BLOCKED'));
  }
});
test('non-Mira, invisible Mira and generic brand creative are blocked',()=>{
  let r=authorize({contentPersona:'bedrijfsgeheugen'}); assert.equal(r.authorized,false); assert.ok(r.reasons.includes('INSTAGRAM_MIRA_PERSONA_REQUIRED'));
  r=authorize({instagramVisual:{...visual,miraPresent:false}}); assert.equal(r.authorized,false); assert.ok(r.reasons.includes('INSTAGRAM_VISIBLE_MIRA_REQUIRED'));
  r=authorize({instagramVisual:{...visual,genericBrandCreative:true}}); assert.equal(r.authorized,false); assert.ok(r.reasons.includes('INSTAGRAM_GENERIC_BRAND_CREATIVE_BLOCKED'));
});
test('Reel requires exact MP4 and complete Mira frame proof',()=>{
  let r=authorize({assetMimeType:'image/jpeg'}); assert.equal(r.authorized,false); assert.ok(r.reasons.includes('INSTAGRAM_VIDEO_MP4_REQUIRED'));
  r=authorize({instagramVisual:{...visual,frameEvidence:visual.frameEvidence.slice(0,2)}}); assert.equal(r.authorized,false); assert.ok(r.reasons.includes('INSTAGRAM_VIDEO_FRAME_EVIDENCE_REQUIRED'));
});
