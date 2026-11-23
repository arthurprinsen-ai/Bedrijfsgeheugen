import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 isVerifiedPersonalFounderPerspective, personalFirstPersonSourceViolations,
 personalFirstPersonCopyViolations, personalFounderDecisionSourceScopeViolations,
 PERSONAL_FOUNDER_PERSPECTIVE_POLICY
} from '../supabase/functions/_shared/personal-first-person-story-gate.mjs';
import {personalEditorialViolations} from '../supabase/functions/_shared/personal-linkedin-editorial-contract.mjs';

const day='2026-11-24';
const ownText='Op 20 november 2026 zei Arthur zelf dat software, AI, BI en data voor hem samen één intelligent bedrijfssysteem moeten zijn; dit is zijn eigen ontwerpvoorkeur en niet een door hemzelf bewezen klantresultaat.';
const ownerPerspective={
 content_id:'user-authored-founder:2026-11-20:personal-perspective',
 source_text:ownText,
 source_kind:'verified_personal_source',
 source_lineage:['current-chat:user-fact:2026-11-20:software-ai-bi-data-as-one'],
 founder_view_event_kind:'direct_user_stated_design_preference',
 founder_view_event_verified:true,
 personal_founder_perspective_verified:true,
 personal_founder_perspective_policy:PERSONAL_FOUNDER_PERSPECTIVE_POLICY,
 personal_truth_verified:true,first_person_claims_verified:true,first_person_claims_present:true,
 arthur_anchor_verified:true,source_backed:true,business_topic:true,personal_life_topic:false,
 corporate_voice:false,company_page_interchangeable:false,forced_business_moral:false,
 ai_native_builder_story_verified:false,observational_personal_theme_verified:false,
 public_theme_source_verified:false,research_claims_present:false,
 calendar_date:day
};
const goodCopy='Een ondernemer die naar AI kijkt, krijgt al snel vier losse producten aangeboden. Ik kies juist voor één samenhangend systeem met software, BI, data en AI. Mijn ontwerpvoorkeur is om eerst de bedrijfsbeslissing helder te maken en daarna pas te kiezen welke techniek daarvoor nodig is. Dat is een eigen standpunt, geen claim dat een klant daardoor al sneller werkt.';

test('Verified founder opinion can pass original personal source and editorial gates without pretending to have built a product',()=>{
 assert.equal(isVerifiedPersonalFounderPerspective(ownerPerspective),true);
 assert.deepEqual(personalFirstPersonSourceViolations(ownerPerspective,day),[]);
 assert.deepEqual(personalFirstPersonCopyViolations(goodCopy,ownerPerspective,day),[]);
 assert.deepEqual(personalEditorialViolations(goodCopy,ownerPerspective),[]);
});

test('Public article cannot replace a user-authored own viewpoint',()=>{
 const publicOnly={...ownerPerspective,source_lineage:['https://example.org/research']};
 assert.equal(isVerifiedPersonalFounderPerspective(publicOnly),false);
 assert.ok(personalFirstPersonSourceViolations(publicOnly,day).length>0);
});

test('Unverified public research claim stays blocked',()=>{
 const unsupported={...ownerPerspective,research_claims_present:true,
   research_source_evidence:[{url:'https://example.org/study',verified:false,checked_at:'2026-11-23T14:00:00Z'}]};
 assert.equal(isVerifiedPersonalFounderPerspective(unsupported),false);
});
test('A draft must never turn founder positioning into firsthand client results',()=>{
 const fake='Ik zag bij een klant hoe teams fouten maakten. Daarna bespaarde ik tijd voor de klant en het resultaat was snellere inzichten.';
 const reasons=personalFounderDecisionSourceScopeViolations(fake,ownerPerspective);
 assert.ok(reasons.includes('PERSONAL_FOUNDER_UNVERIFIED_LIVED_TEAM_OR_CLIENT_CLAIM'));
 assert.ok(reasons.includes('PERSONAL_FOUNDER_UNVERIFIED_IMPLEMENTATION_OR_IMPACT_CLAIM'));
 assert.ok(personalFirstPersonCopyViolations(fake,ownerPerspective,day).length>0);
});
test('No new source mode on Sundays or without owner provenance',()=>{
 assert.ok(personalFirstPersonSourceViolations(ownerPerspective,'2026-11-22').includes('PERSONAL_SUNDAY_OR_INVALID_DATE'));
 assert.equal(isVerifiedPersonalFounderPerspective({...ownerPerspective,founder_view_event_verified:false}),false);
});
test('All existing producer, independent reviewer and editorial route share the new source gate',()=>{
 const base=new URL('../supabase/functions/',import.meta.url);
 const producer=readFileSync(new URL('powerhouse-content-orchestrator/index.ts',base),'utf8');
 const reviewer=readFileSync(new URL('bg-pre-publish-review/index.ts',base),'utf8');
 const editor=readFileSync(new URL('_shared/personal-linkedin-editorial-contract.mjs',base),'utf8');
 assert.match(producer,/isVerifiedPersonalFounderPerspective/);
 assert.match(producer,/personalPerspective/);
 assert.match(producer,/!personalProfessional/);
 assert.match(reviewer,/founderPerspectiveMode/);
 assert.match(reviewer,/FOUNDER_PERSPECTIVE_TRUTH_REQUIRED/);
 assert.match(editor,/isVerifiedPersonalFounderPerspective/);
});
