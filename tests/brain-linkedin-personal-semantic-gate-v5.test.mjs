import test from 'node:test';
import assert from 'node:assert/strict';
import {CHANNELS,authorizeSocialPublication} from '../platform/social-channel-identity-gate.mjs';

const lineage={contentId:'brain-personal-v5',calendarDate:'2026-09-19',predictionId:'pred-v5',sourceDecisionId:'decision-v5'};
const personalTruth={class:'author_observation',verified:true,evidenceRefs:['brain:linkedin-personal-semantic-gate-v5']};
const run=(text)=>authorizeSocialPublication({
  channelKind:'linkedin_personal',
  channelId:CHANNELS.linkedin_personal.channelId,
  text,
  lineage,
  personalTruth,
  companyPageInterchangeable:false
});

test('business advice with first-person wrapper cannot masquerade as personal content',()=>{
  const result=run('Ik denk vandaag na over hoe je processen slimmer maakt.');
  assert.equal(result.authorized,false);
  assert.ok(result.reasons.includes('CONCRETE_PERSONAL_LIFE_EVENT_REQUIRED')||result.reasons.includes('CONSULTANT_VOICE_ON_PERSONAL'));
});

test('weekend wrapper cannot turn leadership thought-leadership into personal content',()=>{
  const result=run('Mijn weekendgedachte: leiderschap gaat over strategie concreet maken.');
  assert.equal(result.authorized,false);
  assert.ok(result.reasons.includes('CONSULTANT_VOICE_ON_PERSONAL')||result.reasons.includes('BUSINESS_CONTENT_ON_PERSONAL'));
});

test('concrete harmless lived personal event remains allowed',()=>{
  const result=run('Ik stond thuis vanochtend ruzie te maken met mijn printer. Volgens mij wint hij.');
  assert.equal(result.authorized,true);
});
