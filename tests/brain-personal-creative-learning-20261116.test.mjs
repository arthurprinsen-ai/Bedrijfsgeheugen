import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildCreativeRecipe,buildExperimentCalendar} from '../brain/creative/revenue-content-intelligence.mjs';

const config=JSON.parse(readFileSync(new URL('../config/social-learning-engine.json',import.meta.url),'utf8'));

test('business opportunities can never become personal identity or an offer recipe',()=>{
  const personal=buildCreativeRecipe({channel:'linkedin_personal',opportunity:{topic:'Excel dependency',pain:'lost revenue',expectedRevenue:2000},mode:'EXPLORE'});
  assert.equal(personal.topic,null);
  assert.equal(personal.textType,'verified_first_person_personal_life_story');
  assert.equal(personal.requiresVerifiedUserFact,true);
  assert.equal(personal.objective,'authentic_personal_conversation');
  assert.ok(personal.guardrails.includes('no_business_bridge'));
  assert.ok(personal.guardrails.includes('no_private_chat_as_public_permission'));
  for(const field of ['offerType','fomoTrigger','discoveryQuestion','behavioralLever'])assert.equal(field in personal,false,field);
  const company=buildCreativeRecipe({channel:'linkedin_company',opportunity:{topic:'Excel dependency',pain:'lost revenue'}});
  assert.equal(company.objective,'qualified_demand');
  assert.ok(company.offerType);
});

test('personal editorial learning is not allowed to optimize for company leads or with absent metrics',()=>{
  const personal=config.creativePolicy.personalLinkedIn;
  assert.equal(personal.verifiedUnusedUserFactRequired,true);
  assert.equal(personal.sourceContract,'personal-linkedin-personal-life-only-v1');
  assert.equal(personal.commercialConversionOptimizationForbidden,true);
  assert.equal(personal.promoteWinnerOnlyWithIndependentPersonalMetrics,true);
  assert.equal(personal.insufficientMetricsOutcome,'NOT_MEASURED');
  assert.equal(config.creativePolicy.companyLinkedIn.objective,'qualified_demand');
});

test('experiment calendar never invents personal story from business experiments',()=>{
  const cal=buildExperimentCalendar({start:'2026-11-16',end:'2026-11-22'});
  assert.equal(cal.length,7);
  assert.ok(cal.every(day=>day.personal.requiresVerifiedUserFact&&day.personal.topic===null));
  assert.ok(cal.every(day=>!('offerType' in day.personal)));
});
