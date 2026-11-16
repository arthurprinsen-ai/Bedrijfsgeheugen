import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {personalNonBuilderBusinessSignal,personalEditorialViolations,personalObservationalLifeContextSignal} from '../supabase/functions/_shared/personal-linkedin-editorial-contract.mjs';

const source=readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
const reviewer=readFileSync(new URL('../supabase/functions/bg-pre-publish-review/index.ts',import.meta.url),'utf8');
const observation={observational_personal_theme_verified:true,ai_native_builder_story_verified:false};

test('standalone commercial terms are vetoed but verified everyday klantenservice is not a false marketing bridge',()=>{
 assert.equal(personalNonBuilderBusinessSignal('De klantenservice meldde dat de onlinebestelling bleef hangen.',{observational:true}),false);
 assert.equal(personalNonBuilderBusinessSignal('Het bedrijf geeft een klant korting op een offerte.',{observational:true}),true);
 assert.equal(personalNonBuilderBusinessSignal('Bedrijfsgeheugen biedt een gratis scan.',{observational:true}),true);
 assert.equal(personalEditorialViolations('De klantenservice meldde dat de onlinebestelling bleef hangen.',observation).some(x=>x.code==='PERSONAL_EDITORIAL_PREPUBLISH_BUSINESS_SIGNAL'),false);
 assert.equal(personalEditorialViolations('Het bedrijf geeft een klant korting op een offerte.',observation).some(x=>x.code==='PERSONAL_EDITORIAL_PREPUBLISH_BUSINESS_SIGNAL'),true);
});

test('original final-truth validator uses the same exact word-boundary predicate as independent prepublish',()=>{
 assert.match(source,/personalNonBuilderBusinessSignal\(body,\{observational:evidence\?\.observational_personal_theme_verified===true\}\)/);
 assert.match(reviewer,/personalNonBuilderBusinessSignal\(text,\{observational:observationalMode\}\)/);
 const block=source.slice(source.indexOf('function personalFinalCopyValid('),source.indexOf('function hardBoundary('));
 assert.ok(block.length>200,'must inspect actual truth validator');
 assert.doesNotMatch(block,/noBusinessBridge=!\//,'cannot retain legacy unbounded-substring marketing veto');
 assert.match(block,/const dailyLife=personalObservationalLifeContextSignal\(body\);/);
 assert.equal(personalObservationalLifeContextSignal('onlinebestelling klantenservice webwinkel'),true);
 assert.match(block,/!hasFirstPerson && dailyLife && noBusinessBridge/);
});

test('same original generator makes one source-locked correction for final-truth-only failures and then rechecks both hard gates',()=>{
 assert.match(source,/const personalTruthViolation=!personalFinalCopyValid\(bodyText,personalSource\?\.evidence\|\|\{\}\)/);
 assert.match(source,/if \(\(editorialViolations\.length\|\|personalTruthViolation\) && generationProvider==='OpenAI' && apiKey\)/);
 assert.match(source,/editorial_rejection_codes:\[\.\.\.editorialViolations\.map/);
 assert.match(source,/personalTruthViolation\?\['PERSONAL_FINAL_COPY_TRUTH_INVARIANT_FAILED'\]/);
 assert.equal([...source.matchAll(/\bconst\s+revisionInput\s*=/g)].length,1,'no extra publisher/editor');
 assert.match(source,/personalEditorialViolations\(revisedText,\{\.\.\.\(personalSource\?\.evidence\|\|\{\}\),recentPersonalPosts\}\)\.length===0/);
 assert.match(source,/personalFinalCopyValid\(revisedText,personalSource\?\.evidence\|\|\{\}\)/);
 assert.match(source,/if\(editorialViolations\.length\) throw new Error\('PERSONAL_EDITORIAL_CONTRACT_FAILED:/);
 assert.match(source,/if\(!personalFinalCopyValid\(bodyText,personalSource\?\.evidence\|\|\{\}\)\) throw new Error\('PERSONAL_FINAL_COPY_TRUTH_INVARIANT_FAILED'\)/);
 assert.match(source,/Geen ik\/mijn\/mij\/me/);
 assert.match(source,/geen willekeurige dagelijkse situatie toevoegen/);
});

test('observational everyday lexicon is ONE shared gate for generation and independent final review',()=>{
 for(const word of ['onlinebestelling','klantenservice','webwinkel','pakket','bezorging','school']){
   assert.equal(personalObservationalLifeContextSignal('Het gaat over '+word+'.'),true,word);
 }
 for(const invalid of ['', 'strategy governance sales', 'alleen een zakelijke propositie']){
   assert.equal(personalObservationalLifeContextSignal(invalid),false,invalid);
 }
 assert.ok(source.includes('const dailyLife=personalObservationalLifeContextSignal(body);'));
 assert.ok(reviewer.includes("require(personalObservationalLifeContextSignal(text), 'OBSERVATIONAL_PERSONAL_LIFE_CONTEXT_REQUIRED'"));
 // The shared lexical gate NEVER replaces the independent verified-source,
 // author-identity, first-person, quality or story-uniqueness veto.
 assert.match(reviewer,/body.public_theme_source_verified === true/);
 assert.match(reviewer,/OBSERVATIONAL_MODE_FINAL_TEXT_FIRST_PERSON_FORBIDDEN/);
 assert.match(reviewer,/PERSONAL_LIFE_TOPIC_REQUIRED/);
 assert.ok(source.includes('personalNonBuilderBusinessSignal(body'));
});
