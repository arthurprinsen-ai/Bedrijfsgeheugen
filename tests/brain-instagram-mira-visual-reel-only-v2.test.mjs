import test from 'node:test';
import assert from 'node:assert/strict';
import { CHANNELS, authorizeSocialPublication } from '../platform/social-channel-identity-gate.mjs';

const lineage={contentId:'mira-v2-1',calendarDate:'2026-09-20',predictionId:'pred-mira-v2-1',sourceDecisionId:'decision-mira-v2-1'};
const validVisual={
  verified:true,semanticVerified:true,evidenceMethod:'vision',
  miraPresent:true,miraCentralSubject:true,dailyLifeScene:true,
  genericBrandCreative:false,textDominant:false,brandTemplateDominant:false,
  evidenceRefs:['vision:exact-final-mira-v2'],assetUrl:'https://cdn.example/mira-final.jpg',
  placeholderDetected:false,identityClass:'mira_daily_life',formatVerified:true,
  width:1080,height:1920,colorSpace:'RGB',hasAlpha:false,decodeComplete:true,
  visualComplete:true,grayOrEmptyDetected:false,
  frameEvidence:[
    {position:'start',verified:true,evidenceRefs:['vision:start'],identityClass:'mira_daily_life',placeholderDetected:false},
    {position:'middle',verified:true,evidenceRefs:['vision:middle'],identityClass:'mira_daily_life',placeholderDetected:false},
    {position:'end',verified:true,evidenceRefs:['vision:end'],identityClass:'mira_daily_life',placeholderDetected:false},
  ],
};
const authorize=(extra={})=>authorizeSocialPublication({
  channelKind:'instagram_company',channelId:CHANNELS.instagram_company.channelId,
  text:'Mira zoekt in de keuken naar dat ene bestand.',lineage,miraGatePassed:true,
  contentPersona:'mira',contentClass:'mira_daily_life',mediaKind:'reel',
  assetUrl:validVisual.assetUrl,assetMimeType:'video/mp4',instagramVisual:validVisual,...extra,
});

test('Instagram v3 permits only Mira Reels',()=>{
  assert.deepEqual(CHANNELS.instagram_company.mediaPolicy.allowedKinds,['reel']);
  assert.equal(authorize().authorized,true);
  for(const kind of ['image','video','carousel','']){
    const r=authorize({mediaKind:kind});
    assert.equal(r.authorized,false);
    assert.ok(r.reasons.includes('INSTAGRAM_REEL_REQUIRED') || r.reasons.includes('INSTAGRAM_MEDIA_KIND_BLOCKED'));
  }
});
test('text-dominant and brand-template creative fail closed',()=>{
  let r=authorize({instagramVisual:{...validVisual,textDominant:true}});
  assert.equal(r.authorized,false); assert.ok(r.reasons.includes('INSTAGRAM_TEXT_DOMINANT_CREATIVE_BLOCKED'));
  r=authorize({instagramVisual:{...validVisual,brandTemplateDominant:true}});
  assert.equal(r.authorized,false); assert.ok(r.reasons.includes('INSTAGRAM_BRAND_TEMPLATE_DOMINANT_BLOCKED'));
});
test('Mira must be central in a real daily-life scene with vision proof',()=>{
  for(const [patch,reason] of [
    [{miraCentralSubject:false},'INSTAGRAM_MIRA_CENTRAL_SUBJECT_REQUIRED'],
    [{dailyLifeScene:false},'INSTAGRAM_DAILY_LIFE_SCENE_REQUIRED'],
    [{semanticVerified:false},'INSTAGRAM_VISION_SEMANTIC_PROOF_REQUIRED'],
  ]){
    const r=authorize({instagramVisual:{...validVisual,...patch}});
    assert.equal(r.authorized,false); assert.ok(r.reasons.includes(reason));
  }
});
