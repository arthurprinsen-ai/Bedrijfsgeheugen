import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildCreativeRecipe,buildExperimentCalendar} from '../brain/creative/revenue-content-intelligence.mjs';
import {personalEditorialViolations,personalNarrativePatternViolations} from '../supabase/functions/_shared/personal-linkedin-editorial-contract.mjs';

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

test('declutter complexity: personal story shape and ending come from the verified source, not a fixed entertainment template',()=>{
  const personal=buildCreativeRecipe({channel:'linkedin_personal',opportunity:{topic:'Commercial audit',pain:'revenue'},seed:'2026-11-16'});
  assert.equal(personal.styleContract,'declutter_complexity_source_led_non_template');
  assert.equal(personal.narrativeShape,'source_determined');
  for(const k of ['mandatoryHook','mandatoryTwist','mandatoryHumor','mandatoryQuestion','mandatoryMoral'])assert.equal(personal[k],false,k);
  for(const k of ['comedyDevice','emotion','ctaType','awarenessStage','offerType'])assert.equal(k in personal,false,k);
  assert.deepEqual(personal.compareRecentPostsFor,['opening','narrative_arc','length','humor','ending']);
  const policy=config.creativePolicy.personalLinkedIn;
  assert.equal(policy.declutterComplexity,true);
  assert.equal(policy.repeatedPatternOutcome,'REWRITE_NOT_PUBLISH');
  assert.ok(!policy.requiredDimensions.includes('natural_twist'));
  assert.equal(policy.mandatoryQuestion,false);
  assert.equal(config.creativePolicy.companyLinkedIn.objective,'qualified_demand');
});

test('source-led short personal story is allowed without mandatory 130-200 words or ending question',()=>{
  const text='Ik stond langs het veld. Het begon zachtjes te regenen en langzaam werd het kouder. Iedereen keek naar de wedstrijd. Ik bleef toch staan, want ik had geen zin om ook maar één moment van dat spel te missen.';
  const codes=personalEditorialViolations(text,{recentPersonalPosts:[]}).map(v=>v.code);
  assert.ok(!codes.includes('PERSONAL_EDITORIAL_WORD_COUNT'),codes.join(','));
  assert.ok(!codes.includes('PERSONAL_EDITORIAL_OPEN_QUESTION'),codes.join(','));
  assert.deepEqual(codes,[]);
});

test('repeated distinctive personal opener or same ending is vetoed; different story can use different shape',()=>{
  const prior='Ik dacht dat ik gewoon een auto ging kopen. Het bleek ingewikkelder dan verwacht. Uiteindelijk had ik nog niets gekocht. Herkenbaar?';
  const tooSimilar='Ik dacht dat ik gewoon een dweilrobot ging kopen. Het bleek ingewikkelder dan verwacht. Uiteindelijk had ik nog niets gekocht. Herkenbaar?';
  assert.ok(personalNarrativePatternViolations(tooSimilar,[prior]).includes('PERSONAL_EDITORIAL_REPEATED_OPENING'));
  const distinct='Drie teams op zaterdag. Ik stond langs het veld en merkte dat ik het koude weer ineens vergat. Ik wilde gewoon blijven kijken.';
  assert.deepEqual(personalNarrativePatternViolations(distinct,[prior]),[]);
});

test('the original production reviewer compares real published personal history before final PASS and fails closed on read errors',()=>{
  const reviewer=readFileSync('supabase/functions/bg-pre-publish-review/index.ts','utf8');
  assert.ok(reviewer.includes(".eq('channel','linkedin_personal')"));
  assert.ok(reviewer.includes("error:'PERSONAL_EDITORIAL_HISTORY_UNAVAILABLE'"));
  assert.ok(reviewer.includes("personalViolations(text, {...body,recentPersonalPosts:personalHistory}, finalHash)"));
  const policy=config.creativePolicy.personalLinkedIn;
  assert.equal(policy.sourceDeterminesNarrativeShape,true);
  assert.equal(policy.mandatoryQuestion,false);
  assert.equal(policy.repeatedPatternOutcome,'REWRITE_NOT_PUBLISH');
});

test('personal editorial check refuses engagement bait and never writes auto comments',()=>{
  const bait='Ik liep gisteren thuis door de gang. Reageer met JA in de reacties als jij dat ook doet.';
  assert.ok(personalEditorialViolations(bait).some(x=>x.code==='PERSONAL_EDITORIAL_ENGAGEMENT_BAIT'));
  const policy=config.creativePolicy.personalLinkedIn;
  assert.equal(policy.automatedCommentsForbidden,true);
});


test('generating original personal copy reads the same published history and automatically rewrites repeated style',()=>{
  const gen=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
  assert.ok(gen.includes(".eq('channel','linkedin_personal')"));
  assert.ok(gen.includes("if(historyError||decisionError)"));
  assert.ok(gen.includes("personalEditorialViolations(bodyText,{...(personalSource?.evidence||{}),recentPersonalPosts})"));
  assert.ok(gen.includes("personalEditorialViolations(revisedText,{...(personalSource?.evidence||{}),recentPersonalPosts})"));
  assert.ok(gen.includes("recent_personal_post_patterns:pending.channel==='linkedin_personal'"));
  const start=gen.indexOf("editorialSystem='AUTHENTIEK PERSOONLIJK LINKEDIN");
  const end=gen.indexOf("stage = 'artifact-ai'",start);
  assert.ok(start>=0&&end>start);
  const actualPersonalPrompt=gen.slice(start,end);
  assert.doesNotMatch(actualPersonalPrompt,/130[–-]200|vier tot zes|verplichte.*vraag|eindig met.*vraag/iu);
  assert.ok(actualPersonalPrompt.includes('Dwing geen wending, humor, les of vraag af'));
  const correction=gen.match(/const PERSONAL_LIFE_CORRECTION_PROMPT=([^;]+);/u)?.[1]||'';
  assert.ok(correction.includes('zonder vaste lengte'));
  assert.ok(correction.includes('zonder vaste lengte, alinea-aantal, grap'));
});


test('original published personal history requires provider-backed decision when the artifact is still content_ready',()=>{
  const gen=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
  const rev=readFileSync('supabase/functions/bg-pre-publish-review/index.ts','utf8');
  for(const src of [gen,rev]){
    assert.ok(src.includes(".in('status',['published','content_ready'])"));
    assert.ok(src.includes(".eq('state','published')"));
    assert.ok(src.includes("select('run_date,state,delivery_ref')"));
    assert.match(src,/urn:li:\(\?:share\|ugcPost\):\[0-9\]\+/);
    assert.ok(src.includes("p.status==='published'||actualPublishedDates.has(clean(p.run_date))"));
    assert.ok(src.includes('PERSONAL_EDITORIAL_HISTORY_UNAVAILABLE'));
  }
});
