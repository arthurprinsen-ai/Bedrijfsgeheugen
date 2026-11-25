import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {arbitrateOriginalEditorialExperiment} from '../supabase/functions/_shared/measured-next-post-challenger.mjs';

const measured={state:'ELIGIBLE_BOUNDED_NEXT_POST_TEST',
 proposed_test:{hypothesis_id:'TEST_USEFUL_NEXT_STEP_FOR_ZERO_CLICKS',single_change:'CTA only'}};
const creative={state:'ONE_REVERSIBLE_DAILY_COPY_HYPOTHESIS',
 hypothesis_id:'linkedin_company:FIRST_SENTENCE:2026-11-05',single_change:'Opening only'};
const original={state:'EXPERIMENT_LOOPT',experiment_id:'li-lus-co-20261030',
 instructie:'Apply exactly hook_type=concrete_number; keep all other parts unchanged.'};
const arbitrate=(override={})=>arbitrateOriginalEditorialExperiment({
 channel:'linkedin_company',linkedinLoop:original,measured,creative,...override});

test('registered original company single-variable experiment outranks measured challenger and daily exploration',()=>{
 const x=arbitrate();
 assert.equal(x.owner,'ORIGINAL_LINKEDIN_LOOP');
 assert.equal(x.experiment_id,original.experiment_id);
 assert.equal(x.max_distinct_experimental_copy_changes,1);
 assert.equal(x.measured.proposed_test,null);
 assert.equal(x.measured.state,'SUPPRESSED_BY_SINGLE_EXPERIMENT_OWNER');
 assert.equal(x.creative.state,'NO_EXPLORATION');
 assert.equal(x.creative.single_change,null);
 assert.equal(x.causal_effect_proven,false);
});

test('new personal LinkedIn source-backed one-variable experiment is also exclusive',()=>{
 const x=arbitrate({channel:'linkedin_personal',linkedinLoop:{...original,state:'NIEUW_EXPERIMENT'}});
 assert.equal(x.owner,'ORIGINAL_LINKEDIN_LOOP');
 assert.equal(x.measured.proposed_test,null);
 assert.equal(x.creative.state,'NO_EXPLORATION');
});

test('when original source is unavailable, one evidence-backed measured challenger owns; creative is suppressed',()=>{
 const x=arbitrate({linkedinLoop:{state:'SOURCE_UNAVAILABLE'}});
 assert.equal(x.owner,'EXISTING_MEASURED_CHALLENGER');
 assert.equal(x.measured.proposed_test.hypothesis_id,'TEST_USEFUL_NEXT_STEP_FOR_ZERO_CLICKS');
 assert.equal(x.creative.single_change,null);
 assert.equal(x.creative.state,'NO_EXPLORATION');
});

test('when no original experiment or measured challenger exists, one bounded exploration may operate',()=>{
 const x=arbitrate({linkedinLoop:{state:'NOT_APPLICABLE'},measured:{state:'WAIT_FOR_COMPARABLE_PROVIDER_METRICS',proposed_test:null}});
 assert.equal(x.owner,'EXISTING_DAILY_EXPLORATION');
 assert.equal(x.creative.single_change,'Opening only');
 assert.equal(x.measured.proposed_test,null);
});

test('no valid candidates means no extra experiment, and editorial truth is unaffected',()=>{
 const x=arbitrate({channel:'blog',linkedinLoop:original,
 measured:{state:'WAIT_FOR_COMPARABLE_PROVIDER_METRICS',proposed_test:null},
 creative:{state:'NO_EXPLORATION',reason:'SOURCE_NOT_CURRENT_OR_VERIFIED'}});
 assert.equal(x.owner,'NO_NEW_EXPERIMENT');
 assert.equal(x.max_distinct_experimental_copy_changes,0);
 assert.equal(x.creative.reason,'SOURCE_NOT_CURRENT_OR_VERIFIED');
});

test('actual original orchestrator arbitrates after SQL experiment owner read and before prompt, council and production evidence',async()=>{
 const source=await readFile(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
 const posSql=source.indexOf("db.rpc('bg_social_lus_cyclus'");
 const posArb=source.indexOf('const editorialExperiment=arbitrateOriginalEditorialExperiment(');
 const posCouncil=source.indexOf('const editorialCouncil=buildEditorialCouncilBrief(');
 const posPrompt=source.indexOf('let editorialSystem =');
 const posGen=source.indexOf('editorial_experiment_owner:editorialExperiment.owner');
 assert.ok(posSql>0&&posSql<posArb&&posArb<posCouncil&&posCouncil<posPrompt&&posPrompt<posGen,
  'the original owner must be chosen after DB truth and before any editorial input');
 assert.match(source,/measuredNextPostTest=editorialExperiment\.measured/);
 assert.match(source,/creativeExploration=editorialExperiment\.creative/);
 assert.match(source,/editorial_experiment_owner:editorialExperiment\.owner/g);
 assert.doesNotMatch(source,/new cron\(|setInterval\(|POST_NEW_SOCIAL_MEDIA/i);
});
