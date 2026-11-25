import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessTrustedAdvisorCopy,TRUSTED_ADVISOR_CONTRACT} from '../assets/trusted-advisor-quality.mjs';
import {cmsQuality} from '../assets/cms-quality-gate.mjs';
import {buildEditorialCouncilBrief} from '../supabase/functions/_shared/editorial-council-context.mjs';
const read=path=>readFileSync(path,'utf8');
const item=(text,contentExtras={})=>({
 surface:'website',locale:'nl-NL',route:'/',element_key:'home.hero',area:'hero',element_type:'text',
 content:{text,...contentExtras},status:'draft'
});
test('trusted advisor contract rejects internal release reports, leaking drafts and unsupported outcome claims',()=>{
 for(const channel of ['website','portal','linkedin_company','linkedin_personal','instagram_company','blog','email_outreach','email_newsletter']){
  const bad=assessTrustedAdvisorCopy('Onze PR #5234 is geslaagd',{channel});
  assert.equal(bad.contract,TRUSTED_ADVISOR_CONTRACT);
  assert.equal(bad.publishEligible,false);
  assert.ok(bad.errors.includes('PUBLIC_INTERNAL_RELEASE_LEAK'));
  assert.equal(bad.customerTrustUpliftVerified,false);
 }
 assert.ok(assessTrustedAdvisorCopy('Voordat u publiceert: controleer alles.').errors.includes('PUBLIC_DRAFT_INSTRUCTION_LEAK'));
 assert.ok(assessTrustedAdvisorCopy('Wij leveren 35% meer omzet.').errors.includes('OUTCOME_CLAIM_SOURCE_MISSING'));
 assert.ok(assessTrustedAdvisorCopy('100% gegarandeerd meer winst.').errors.includes('UNPROFESSIONAL_HYPE_OR_GUARANTEE'));
});
test('genuine business advice stays eligible for independent human review; sources are not proof',()=>{
 const story='Een offerte blijft soms dagen liggen. Spreek één eigenaar en een terugbelmoment af, zodat het team sneller kan beslissen.';
 const good=assessTrustedAdvisorCopy(story,{channel:'website'});
 assert.equal(good.publishEligible,true);assert.equal(good.humanApprovalRequired,true);
 assert.equal(good.providerReadbackVerified,false);
 const sourced=assessTrustedAdvisorCopy('Een pilot toonde 12% meer conversie.',{sourceRefs:['https://example.org/report']});
 assert.equal(sourced.publishEligible,true);
 assert.ok(sourced.warnings.includes('OUTCOME_CLAIM_INDEPENDENT_PROOF_DUE'));
 assert.notEqual(sourced.claimEvidence,'VERIFIED');
});
test('original CMS server gate blocks high-confidence violations and never self-approves',()=>{
 const bad=cmsQuality(item('Onze PR #5234 is geslaagd.'));
 assert.equal(bad.publishEligible,false);
 assert.ok(bad.errors.includes('PUBLIC_INTERNAL_RELEASE_LEAK'));
 assert.equal(cmsQuality(item('We garanderen 60% meer omzet.')).publishEligible,false);
 const good=cmsQuality(item('Uw offertes raken niet meer uit beeld als u per stap een eigenaar aanwijst.'));
 assert.equal(good.publishEligible,true);
 assert.equal(good.humanApprovalRequired,true);
 assert.equal(good.revenueVerified,false);
});
test('original editorial council carries the advisory invariant without a second publisher',()=>{
 for(const channel of ['linkedin_personal','linkedin_company','instagram_company','blog','email_outreach','email_newsletter']){
  const brief=buildEditorialCouncilBrief({channel});
  assert.equal(brief.trust_policy,TRUSTED_ADVISOR_CONTRACT);
  assert.match(brief.instruction,/TRUSTED ADVISOR/);
 }
 const publisher=read('supabase/functions/powerhouse-social-publisher/index.ts');
 const cms=read('netlify/functions/cms-admin.mjs');
 assert.match(publisher,/pre.?publish/i);
 assert.match(cms,/CMS_QUALITY_GATE_BLOCKED/);
 const portal=read('portal-v2/operating-system/executive-cockpit.js');
 assert.match(portal,/Vertrouwen en kwaliteit/);
 assert.match(portal,/niet automatisch bewezen/);
});
