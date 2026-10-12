import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const content=fs.readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
const outreach=fs.readFileSync('supabase/functions/powerhouse-commercial-message-composer/index.ts','utf8');

test('the business-facing channels must lead with daily steering, not AI product inventory',()=>{
  assert.match(content,/const STEERING_BRAND_CONTRACT=/);
  for(const expected of ['dagelijkse ondernemingssturing','interne én externe veranderingen','strategie, doelen, geld, processen','signaal → context → gevolg → beslissing → actie → resultaat → leren','POWERHOUSE is de motor','Nooit verzonnen klantbewijs']){
    assert.ok(content.includes(expected),expected);
  }
  assert.match(content,/: system \+ ' ' \+ STEERING_BRAND_CONTRACT/);
  assert.match(content,/personalBuilder \? ' '\+PERSONAL_STEERING_STORY/);
  assert.match(content,/Schrijf uitsluitend voor de Bedrijfsgeheugen-bedrijfspagina/);
  assert.match(content,/Mira verbeeldt één canoniek/);
});

test('direct outreach knows what makes Bedrijfsgeheugen different only when it fits evidence',()=>{
  for(const expected of ['Productwaarheid: Bedrijfsgeheugen is geen extra AI-tool','interne en externe veranderingen','acties met eigenaar en meetbare resultaten','Benoem dit onderscheid alleen wanneer het duidelijk aansluit op het bewezen probleem','geen standaardpitch']){
    assert.ok(outreach.includes(expected),expected);
  }
  for(const guard of ['sourceSpecificEvidenceOk','semanticNoveltyOk','newFollowupEvidenceOk','source_specific_evidence_ok']){
    assert.ok(outreach.includes(guard),'preserve existing prospect send guard: '+guard);
  }
});

test('customer brand positioning must never change first-party provider scheduling or CRM',()=>{
  assert.doesNotMatch(content,/const STEERING_BRAND_CONTRACT=[^\n]*guaranteed|const STEERING_BRAND_CONTRACT=[^\n]*always autonomously/i);
  assert.doesNotMatch(outreach,/\bpromise guaranteed results\b/i);
});
