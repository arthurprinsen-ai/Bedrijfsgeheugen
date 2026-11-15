import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 PERSONAL_FIRST_PERSON_STORY_CONTRACT,
 isPersonalPublicationDay,
 personalFirstPersonSourceViolations,
 personalFirstPersonCopyViolations
} from '../supabase/functions/_shared/personal-first-person-story-gate.mjs';

const e={
 content_id:'user-fact:2026-11-16:original-hockey-moment',
 personal_truth_verified:true,arthur_anchor_verified:true,first_person_claims_verified:true,
 personal_life_topic:true,business_topic:false,corporate_voice:false,
 company_page_interchangeable:false,forced_business_moral:false,
 personal_life_only_policy:'personal-linkedin-personal-life-only-v1',
 first_person_claims_present:true,sensitive_private_detail:false,
 observational_personal_theme_verified:false,ai_native_builder_story_verified:false,
 source_text:'Ik stond langs het veld en zag dat de wedstrijd anders liep dan ik had gehoopt. Ik vertelde daarna wat ik echt gezien had, zonder scores of namen te verzinnen.',
 source_lineage:['chat-history:user-fact:2026-11-16:personally-confirmed-hockey']
};
const date='2026-11-16';
const text='Ik stond langs de lijn bij een wedstrijd. Ik zag iets dat me verraste en vertelde achteraf wat er feitelijk was gebeurd. Het was niet het resultaat waarop ik hoopte, maar ik bleef kijken tot het einde.';

test('only a verified user-authored first-person lived story, not a public news observation, is eligible',()=>{
 assert.equal(PERSONAL_FIRST_PERSON_STORY_CONTRACT,'arthur-verified-personal-story-v1');
 assert.deepEqual(personalFirstPersonSourceViolations(e,date),[]);
 assert.deepEqual(personalFirstPersonCopyViolations(text,e,date),[]);
 assert.ok(personalFirstPersonSourceViolations({...e,personal_truth_verified:false},date).includes('PERSONAL_USER_EXPERIENCE_NOT_VERIFIED'));
 assert.ok(personalFirstPersonSourceViolations({...e,observational_personal_theme_verified:true},date).includes('PERSONAL_PUBLIC_NEWS_OR_BUSINESS_FALLBACK_FORBIDDEN'));
 assert.ok(personalFirstPersonSourceViolations({...e,ai_native_builder_story_verified:true,business_topic:true},date).includes('PERSONAL_PUBLIC_NEWS_OR_BUSINESS_FALLBACK_FORBIDDEN'));
 assert.ok(personalFirstPersonSourceViolations({...e,source_lineage:['powerhouse_mira_problem_signals_v1:uuid']},date).includes('PERSONAL_GENERATED_OR_PUBLIC_ARTICLE_SOURCE_FORBIDDEN'));
 assert.ok(personalFirstPersonSourceViolations({...e,source_lineage:['powerhouse_content_artifacts:2026-09-20:linkedin_personal']},date).includes('PERSONAL_USER_AUTHORED_PROVENANCE_REQUIRED'));
 assert.ok(personalFirstPersonSourceViolations({...e,sensitive_private_detail:true},date).includes('PERSONAL_PRIVATE_DETAIL_NOT_APPROVED'));
 assert.ok(personalFirstPersonSourceViolations({...e,source_text:'a short excerpt'},date).includes('PERSONAL_USER_FACT_SOURCE_TOO_SHORT'));
});
test('no Sunday personal delivery; company schedule is not affected',()=>{
 assert.equal(isPersonalPublicationDay('2026-11-15'),false);
 assert.equal(isPersonalPublicationDay('2026-11-16'),true);
 assert.equal(isPersonalPublicationDay('2026-11-21'),true);
 assert.equal(isPersonalPublicationDay('2026-11-22'),false);
 assert.equal(isPersonalPublicationDay('2026-11-99'),false);
 assert.ok(personalFirstPersonSourceViolations(e,'2026-11-15').includes('PERSONAL_SUNDAY_OR_INVALID_DATE'));
});
test('personal prose remains first person, distinct from company and free of hashtags, links and promo',()=>{
 assert.ok(personalFirstPersonCopyViolations('Een pakketbezorger reed langs de straat.',e,date).includes('PERSONAL_FIRST_PERSON_OPENING_REQUIRED'));
 assert.ok(personalFirstPersonCopyViolations(text+' Het was een les voor bedrijven en klanten.',e,date).includes('PERSONAL_COMPANY_COPY_NOT_ALLOWED'));
 assert.ok(personalFirstPersonCopyViolations(text+' #persoonlijk',e,date).includes('PERSONAL_HASHTAGS_NOT_ALLOWED'));
 assert.ok(personalFirstPersonCopyViolations(text+' Boek nu een afspraak.',e,date).includes('PERSONAL_SALES_CTA_NOT_ALLOWED'));
 assert.ok(personalFirstPersonCopyViolations(text+' https://bedrijfsgeheugen.nl',e,date).includes('PERSONAL_PROMOTIONAL_URL_NOT_ALLOWED'));
});
test('the original generator, independent reviewer and final publisher enforce this identical source gate',()=>{
 const gen=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
 const pub=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
 const reviewer=readFileSync('supabase/functions/bg-pre-publish-review/index.ts','utf8');
 assert.ok(gen.includes('personalFirstPersonSourceViolations(e,clean(row?.run_date||e.calendar_date))'));
 assert.ok(gen.includes('personalFirstPersonCopyViolations(bodyText,personalSource?.evidence||{},runDate)'));
 assert.ok(gen.includes('AUTHENTIEK PERSOONLIJK LINKEDIN'));
 assert.ok(pub.includes('personalFirstPersonCopyViolations(art.body,editorialEvidence,runDate)'));
 assert.ok(pub.includes("verifyCurrentPersonalStorySource(db,row,art,runDate)"));
 assert.ok(pub.includes("!['suggested','accepted'].includes(clean(data.status))"));
 assert.ok(pub.indexOf('const lastPersonalSource=await verifyCurrentPersonalStorySource')<pub.indexOf('const direct=await publishLinkedInPersonalViaComposio'));
 assert.ok(reviewer.includes('personalFirstPersonCopyViolations(text,body,body.calendar_date)'));
 assert.doesNotMatch(pub,/MAKE_FALLBACK_SCHEDULER|new ParallelPublisher/);
});
