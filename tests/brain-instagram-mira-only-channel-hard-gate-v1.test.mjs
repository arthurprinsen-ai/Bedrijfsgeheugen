import test from 'node:test';
import assert from 'node:assert/strict';
import { CHANNELS, authorizeSocialPublication } from '../platform/social-channel-identity-gate.mjs';

const lineage={contentId:'mira-only-1',calendarDate:'2026-09-19',predictionId:'pred-mira-only-1',sourceDecisionId:'decision-mira-only-1'};
const validVisual={
  verified:true,
  miraPresent:true,
  genericBrandCreative:false,
  semanticVerified:true,
  evidenceMethod:'vision',
  dailyLifeScene:true,
  miraCentralSubject:true,
  textDominant:false,
  brandTemplateDominant:false,
  evidenceRefs:['vision:exact-final-mira'],
  assetUrl:'https://cdn.example/mira-final.jpg',
  placeholderDetected:false,
  identityClass:'mira_daily_life',
  formatVerified:true,
  width:1080,
  height:1350,
  colorSpace:'RGB',
  hasAlpha:false,
  decodeComplete:true,
  visualComplete:true,
  grayOrEmptyDetected:false,
};

const authorize=(extra={})=>authorizeSocialPublication({
  channelKind:'instagram_company',
  channelId:CHANNELS.instagram_company.channelId,
  text:'Mira staat in de keuken en zoekt haar telefoon.',
  lineage,
  miraGatePassed:true,
  contentPersona:'mira',
  contentClass:'mira_daily_life',
  mediaKind:'image',
  assetUrl:'https://cdn.example/mira-final.jpg',
  assetMimeType:'image/jpeg',
  instagramVisual:validVisual,
  ...extra,
});

test('canonical Instagram contract is explicitly Mira-only',()=>{
  const ig=CHANNELS.instagram_company;
  assert.equal(ig.identity,'mira');
  assert.equal(ig.requiresContentPersona,'mira');
  assert.equal(ig.requiresVisibleMira,true);
  assert.equal(ig.blocksGenericBrandCreative,true);
  assert.deepEqual(ig.allowedContentClasses,['mira_daily_life']);
});

test('valid exact visible-Mira daily-life creative passes',()=>{
  assert.equal(authorize().authorized,true);
});

test('generic Bedrijfsgeheugen creative is blocked fail-closed',()=>{
  const result=authorize({instagramVisual:{...validVisual,genericBrandCreative:true}});
  assert.equal(result.authorized,false);
  assert.ok(result.reasons.includes('INSTAGRAM_GENERIC_BRAND_CREATIVE_BLOCKED'));
});

test('non-Mira persona assignment is blocked',()=>{
  const result=authorize({contentPersona:'bedrijfsgeheugen'});
  assert.equal(result.authorized,false);
  assert.ok(result.reasons.includes('INSTAGRAM_MIRA_PERSONA_REQUIRED'));
});

test('final visual must visibly contain Mira',()=>{
  const result=authorize({instagramVisual:{...validVisual,miraPresent:false}});
  assert.equal(result.authorized,false);
  assert.ok(result.reasons.includes('INSTAGRAM_VISIBLE_MIRA_REQUIRED'));
});
