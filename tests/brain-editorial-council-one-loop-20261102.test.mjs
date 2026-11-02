import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildEditorialCouncilBrief,EDITORIAL_COUNCIL_POLICY} from '../supabase/functions/_shared/editorial-council-context.mjs';
const orchestrator=readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
const map=readFileSync(new URL('../platform/system-map/canonical-system-map.mjs',import.meta.url),'utf8');
test('original generator owns advice with unchanged hard publication gates',()=>{
 assert.match(orchestrator,/buildEditorialCouncilBrief\(/);
 assert.match(orchestrator,/editorial_council:editorialCouncil/);
 assert.match(orchestrator,/editorialSystem \+= ' '\+editorialCouncil\.instruction/);
 assert.match(orchestrator,/email_newsletter: \{ executable: false/);
 assert.match(orchestrator,/companyEditorialViolations\(bodyText/);
 assert.match(orchestrator,/personalEditorialViolations\(bodyText/);
 assert.match(map,/evidenceLedEditorialCouncilV1/);
});
test('five canonical channels have distinct reader jobs, measured business objective',()=>{
 for(const channel of ['linkedin_personal','linkedin_company','instagram_company','blog','email_newsletter']){
   const council=buildEditorialCouncilBrief({channel});
   assert.equal(council.contract,EDITORIAL_COUNCIL_POLICY);
   assert.ok(council.reader_job.length>20);
   assert.ok(council.metrics_priority.includes('independently_paid_orders'));
   assert.equal(council.next_application_status,'NOT_YET_APPLIED_OR_VERIFIED');
   assert.equal(council.evidence_state,'NO_MEASURED_CREATIVE_WINNER');
 }
});
test('unsupported lanes and unproven findings are not learning applications',()=>{
 assert.throws(()=>buildEditorialCouncilBrief({channel:'linkedin_article_company'}),/UNSUPPORTED_CHANNEL/);
 const x=buildEditorialCouncilBrief({channel:'blog',
   verifiedBrandLearnings:[
     {learning_id:'unverified',status:'VALIDATED'},
     {learning_id:'verified-one',status:'VERIFIED_TENANT_SCOPED_PATTERN_NOT_A_GUARANTEE'}
   ],
   commercialFeedback:{state:'INSUFFICIENT_VERIFIED_EVIDENCE',learning_ids:['fake']},
   measuredNextPostTest:{state:'SOURCE_UNAVAILABLE'}});
 assert.deepEqual(x.candidate_learning_ids,['verified-one']);
 assert.equal(x.next_application_status,'NOT_YET_APPLIED_OR_VERIFIED');
 assert.match(x.truth_boundary,/no second scheduler\/writer/);
});
test('creative tests remain hypotheses and marketing newsletter stays unapproved',()=>{
 const blog=buildEditorialCouncilBrief({channel:'blog',measuredNextPostTest:{state:'ELIGIBLE_BOUNDED_NEXT_POST_TEST'}});
 assert.equal(blog.evidence_state,'PROVIDER_BOUNDED_HYPOTHESIS');
 assert.match(buildEditorialCouncilBrief({channel:'email_newsletter'}).editorial,/NIET geautoriseerd/);
 assert.match(buildEditorialCouncilBrief({channel:'instagram_company'}).editorial,/identiteit/);
});
