import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 PERSONAL_FIRST_PERSON_STORY_CONTRACT,
 isPersonalPublicationDay,
 personalFirstPersonSourceViolations,
 personalFirstPersonCopyViolations,
 personalLastMilePublicationViolations
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
 assert.ok(personalFirstPersonSourceViolations({...e,ai_native_builder_story_verified:true,business_topic:true},date).includes('PERSONAL_VERIFIED_BUILDER_SOURCE_REQUIRED'));
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

test('incident #5913: exact last-metre PASS and original user story are required for personal send',()=>{
 const hash='a'.repeat(64);
 const approved={http:200,can_publish:true,identity_gate_decision:'PASS',final_text_hash:hash};
 const opts={text,evidence:{...e,final_text_hash:hash},runDate:date,review:approved,expectedTextHash:hash,actualTextHash:hash,sourceVerified:true};
 assert.deepEqual(personalLastMilePublicationViolations(opts),[]);
 assert.ok(personalLastMilePublicationViolations({...opts,review:{...approved,http:422,can_publish:false}}).includes('PERSONAL_EXACT_REVIEW_PASS_REQUIRED'));
 assert.ok(personalLastMilePublicationViolations({...opts,review:{...approved,final_text_hash:'b'.repeat(64)}}).includes('PERSONAL_EXACT_REVIEW_PASS_REQUIRED'));
 assert.ok(personalLastMilePublicationViolations({...opts,expectedTextHash:'b'.repeat(64)}).includes('PERSONAL_FINAL_TEXT_HASH_NOT_BOUND'));
 assert.ok(personalLastMilePublicationViolations({...opts,evidence:{...e,final_text_hash:'b'.repeat(64)}}).includes('PERSONAL_FINAL_TEXT_HASH_NOT_BOUND'));
 assert.ok(personalLastMilePublicationViolations({...opts,sourceVerified:false}).includes('PERSONAL_SOURCE_REVISION_NOT_VERIFIED'));
 assert.ok(personalLastMilePublicationViolations({...opts,runDate:'2026-11-15'}).includes('PERSONAL_SUNDAY_OR_INVALID_DATE'));
});

test('incident #5913: the actual news, marketing and AI fallback failures cannot get a personal dispatch',()=>{
 const hash='a'.repeat(64),approved={http:200,can_publish:true,identity_gate_decision:'PASS',final_text_hash:hash};
 const opts={evidence:{...e,final_text_hash:hash},runDate:date,review:approved,expectedTextHash:hash,actualTextHash:hash,sourceVerified:true};
 const news='Rond 15.30 uur werd een pakketbezorger in Amsterdam getaserd na foutparkeren. Omstanders filmden de gebeurtenis.';
 assert.ok(personalLastMilePublicationViolations({...opts,text:news,evidence:{...opts.evidence,source_lineage:['powerhouse_mira_problem_signals_v1:d542a27e'],observational_personal_theme_verified:true,personal_truth_verified:false}}).includes('PERSONAL_PUBLIC_NEWS_OR_BUSINESS_FALLBACK_FORBIDDEN'));
 assert.ok(personalLastMilePublicationViolations({...opts,text:'Wachtwoorden: AI-agents loggen vandaag in zonder een wachtwoord te zien.',evidence:{...opts.evidence,observational_personal_theme_verified:true,public_theme_source_verified:true}}).includes('PERSONAL_PUBLIC_NEWS_OR_BUSINESS_FALLBACK_FORBIDDEN'));
 assert.ok(personalLastMilePublicationViolations({...opts,text:'Ik zag 211 interne acties en 20 uitkomsten bij Bedrijfsgeheugen.',evidence:{...opts.evidence,ai_native_builder_story_verified:true,business_topic:true}}).includes('PERSONAL_VERIFIED_BUILDER_SOURCE_REQUIRED'));
});

test('incident #5913: transport invocation itself revalidates the exact review before create',()=>{
 const pub=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
 const functionStart=pub.indexOf('async function publishLinkedInPersonalViaComposio');
 const createCall=pub.indexOf("'LINKEDIN_CREATE_LINKED_IN_POST'",functionStart);
 const hardVeto=pub.indexOf('PERSONAL_LAST_MILE_PUBLICATION_VETO',functionStart);
 assert.ok(functionStart>=0&&hardVeto>functionStart&&createCall>hardVeto);
 assert.ok(pub.includes('personalLastMilePublicationViolations({'));
 assert.ok(pub.includes('actualTextHash:exactFinalHash,sourceVerified:approval?.sourceVerified'));
 assert.ok(pub.includes('review:gate,expectedTextHash:textHash,sourceVerified:lastPersonalSource.ok===true'));
});

test('20 Nov owner exception: genuine first-person technology leadership may describe an independently evidenced build',()=>{
 const b={
  ...e, content_id:'builder:2026-11-20:verified-data-automation-design',
  source_text:'Ik ontwierp in mijn eigen bedrijf een keten die data, BI, software en AI koppelt. Ik zag dat automatiseren zonder controle niet genoeg is, dus ik ontwierp een meet- en herstelstap.',
  source_lineage:['powerhouse:engineering-event:verified-20261120'],
  personal_life_topic:false,business_topic:true,
  personal_truth_verified:false,personal_life_only_policy:undefined,
  ai_native_builder_story_verified:true,ai_native_builder_policy:'personal-linkedin-ai-native-builder-v1',
  build_event_verified:true,arthur_anchor_verified:true,first_person_claims_verified:true,
  source_backed:true,corporate_voice:false,company_page_interchangeable:false,forced_business_moral:false
 };
 const copy='Ik bouw software die AI, data en BI samenbrengt. Ik ontwierp een manier om een repeterend proces niet alleen automatisch te starten maar ook te controleren. De keuze is dat een systeem de uitkomst moet meten, anders weet ik niet of de verbetering echt werkt.';
 assert.deepEqual(personalFirstPersonSourceViolations(b,'2026-11-20'),[]);
 assert.deepEqual(personalFirstPersonCopyViolations(copy,b,'2026-11-20'),[]);
 assert.ok(personalFirstPersonSourceViolations({...b,build_event_verified:false},'2026-11-20').includes('PERSONAL_VERIFIED_BUILDER_SOURCE_REQUIRED'));
 assert.ok(personalFirstPersonSourceViolations({...b,source_backed:false},'2026-11-20').includes('PERSONAL_VERIFIED_BUILDER_SOURCE_REQUIRED'));
 assert.ok(personalFirstPersonSourceViolations({...b,company_page_interchangeable:true},'2026-11-20').includes('PERSONAL_VERIFIED_BUILDER_SOURCE_REQUIRED'));
 assert.ok(personalFirstPersonCopyViolations(copy+' Boek nu een afspraak.',b,'2026-11-20').includes('PERSONAL_SALES_CTA_NOT_ALLOWED'));
 assert.ok(personalFirstPersonSourceViolations({...b,source_lineage:['powerhouse_content_artifacts:unverified']},'2026-11-20').includes('PERSONAL_GENERATED_OR_PUBLIC_ARTICLE_SOURCE_FORBIDDEN'));
});

test('20 Nov builder editorial prompt cannot be overwritten by life-only assignment',()=>{
 const gen=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
 assert.match(gen,/if\(pending\.channel==='linkedin_personal' && !personalBuilder\)/);
 assert.match(gen,/P0 EXPERT-BOUWER/);
 assert.match(gen,/AI, data intelligence, BI, software engineering en slimme automatisering/);
});
