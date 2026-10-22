import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {COMPANY_EDITORIAL_POLICY,companyEditorialViolations} from '../supabase/functions/_shared/company-linkedin-editorial-contract.mjs';

const content=fs.readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
const outreach=fs.readFileSync('supabase/functions/powerhouse-commercial-message-composer/index.ts','utf8');

test('the business-facing channels must lead with daily steering, not AI product inventory',()=>{
  assert.match(content,/const STEERING_BRAND_CONTRACT=/);
  for(const expected of ['dagelijkse ondernemingssturing','interne én externe veranderingen','strategie, doelen, geld, processen','signaal → context → gevolg → beslissing → actie → resultaat → leren','POWERHOUSE is de motor','Nooit verzonnen klantbewijs']){
    assert.ok(content.includes(expected),expected);
  }
  assert.match(content,/: system \+ ' ' \+ STEERING_BRAND_CONTRACT/);
  assert.match(content,/personalBuilder \? ' '\+PERSONAL_STEERING_STORY/);
  // The company prompt now lives in the explicit owner/director branch, not the retired literal.
  assert.match(content,/Schrijf een direct publiceerbare Nederlandstalige LinkedIn-bedrijfspost voor Bedrijfsgeheugen/);
  assert.match(content,/Begin met één herkenbare, concrete ondernemersfrictie/);
  assert.match(content,/Vertrouw alleen op aangeleverde feitelijke evidence/);
  // Do not replace the behavioral editorial gate with a prompt-only assertion.
  assert.match(content,/pending\.channel==='linkedin_company' \? system : system \+ ' ' \+ STEERING_BRAND_CONTRACT/);
  assert.match(content,/companyEditorialViolations\(bodyText,\{recentPosts:recentCompanyPosts\}\)/);
  assert.match(content,/COMPANY_EDITORIAL_CONTRACT_FAILED/);
  assert.equal(COMPANY_EDITORIAL_POLICY,'linkedin-company-entrepreneur-value-v1');
  const rejected=companyEditorialViolations('Signaal: AI is geweldig, maar dit is een intern runtime pipeline rapport.');
  for(const code of ['COMPANY_READER_LENGTH_INVALID','COMPANY_REPORT_OPENING_FORBIDDEN','COMPANY_TECHNICAL_JARGON','COMPANY_ENTREPRENEUR_PROBLEM_REQUIRED']){
    assert.ok(rejected.some(v=>v.code===code),code);
  }
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
