import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {personalFounderDecisionSourceScopeViolations,personalFirstPersonCopyViolations} from '../supabase/functions/_shared/personal-first-person-story-gate.mjs';

const policy=JSON.parse(readFileSync('config/powerhouse-source-backed-channel-contract-v1.json','utf8'));
const personal=policy.channels.linkedin_personal;
const lens=personal.trusted_advisor_positioning_20261120;
const company=policy.channels.linkedin_company.advisory_and_services_20261120;
const generator=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
const skill=readFileSync('.agents/skills/personal-linkedin-life-only/SKILL.md','utf8');

test('latest 20-Nov trusted advisor lens in original personal source-backed author only',()=>{
 assert.equal(lens.editorial_rules.claim_status.includes('proposed future service'),true);
 assert.match(lens.statement_nl,/software, AI, BI en data als één/);
 assert.equal(lens.themes.length,12);
 assert.equal(new Set(lens.themes.map(x=>x.id)).size,12);
 assert.ok(lens.principles.some(s=>s.includes('least-privilege')));
 assert.ok(lens.principles.some(s=>s.includes('EU hosting by itself is NOT sovereign')));
 assert.ok(lens.principles.some(s=>s.includes('backup process owners')));
 assert.ok(lens.principles.some(s=>s.includes('independent')));
 assert.ok(lens.editorial_rules.rotation.includes('per post'));
 assert.match(lens.editorial_rules.guard,/no fake customer/i);
 assert.match(lens.editorial_rules.content_vs_offer,/Personal profile/);
 assert.equal(personal.conversation_quality_20261120.mandatory_question_at_end,false);
 assert.equal(personal.conversation_quality_20261120.independent_first_person_proof_unchanged,true);
 assert.equal(personal.personal_builder_context_intake.no_parallel_producer_publisher_or_problem_catalog,true);
 assert.equal(personal.personal_builder_context_intake.require_one_integrated_software_ai_bi_data_architecture,true);
 assert.ok(generator.includes('const PERSONAL_TRUSTED_ADVISOR_DIRECTION_20261120'));
 assert.ok(generator.includes("if(pending.channel==='linkedin_personal' && personalBuilder)"));
 assert.ok(generator.includes("editorialSystem += ' ' + PERSONAL_TRUSTED_ADVISOR_DIRECTION_20261120"));
 assert.ok(generator.includes('zonder vast woordquotum. '+"'+PERSONAL_TRUSTED_ADVISOR_DIRECTION_20261120"));
 assert.ok(!generator.includes("if(pending.channel==='linkedin_personal' && !personalBuilder) {\n      editorialSystem += ' ' + PERSONAL_TRUSTED_ADVISOR_DIRECTION_20261120"));
 assert.match(skill,/Trusted Advisor \+ simpel intelligent bedrijf/);
 assert.match(skill,/geen bewijs.*elke service/iu);
});

test('commercial offers share existing routes but are never made up as live sales or certified service',()=>{
 assert.equal(company.status,'OFFER_DESIGN_CANDIDATE_NOT_ALL_LIVE');
 assert.deepEqual(company.proposed_tracks.map(x=>x.id),[
  'trusted-advisor','ai-basics','ai-workflow','ai-advanced-agentic','ai-transformation','ai-governance'
 ]);
 assert.match(company.price_policy,/No invented prices/);
 assert.match(company.claim_policy,/certified/);
 assert.match(company.connection,/existing AI & Governance/);
 assert.match(company.conversion_path,/Frisse Blik/);
 assert.equal(policy.cross_channel_rule.includes('never copy-paste'),true);
});

test('legal and safety references are dated, sourced and prohibit fake sovereignty',()=>{
 const refs=lens.references;
 assert.ok(refs.includes('https://ai-act-service-desk.ec.europa.eu/en/ai-act/eu-ai-act-implementation-timeline'));
 assert.ok(refs.includes('https://digital-strategy.ec.europa.eu/en/factpages/data-act-explained'));
 assert.ok(refs.includes('https://genai.owasp.org/llm-top-10/'));
 assert.ok(skill.includes('2 December 2027'));
 assert.ok(skill.includes('2 August 2028'));
 assert.ok(skill.includes('no universal prescribed employee proficiency level'));
 assert.ok(skill.includes('EU-hosted = sovereign'));
 assert.ok(skill.includes('human'));
 const brief=readFileSync('docs/changes/2026-11-20-trusted-advisor-agentic-ai-training-sovereignty-positioning.md','utf8');
 assert.ok(brief.includes('2 dec 2027') && brief.includes('2 aug 2028'));
 assert.ok(brief.includes('Diensten, resultaten, certificeringen'));
 assert.ok(brief.includes('Wat speelt er?'));
 assert.ok(brief.includes('Wat werkt aantoonbaar?'));
 assert.ok(brief.includes('PH-P025'));
});

test('new positioning DOES NOT transform founder vision into first-hand customer outcome',()=>{
 const e={
  content_id:'user-authored-founder:2026-11-20:unified-intelligent-software-and-authentic-conversations',
  ai_native_builder_story_verified:true,ai_native_builder_policy:'personal-linkedin-ai-native-builder-v1',
  build_event_kind:'founder_directed_verified_product_design_decision_and_merged_delivery',
  build_event_verified:true,arthur_anchor_verified:true,source_backed:true,personal_truth_verified:true,
  first_person_claims_verified:true,first_person_claims_present:true,business_topic:true,
  personal_life_topic:false,corporate_voice:false,company_page_interchangeable:false,
  forced_business_moral:false,observational_personal_theme_verified:false,
  public_theme_source_verified:false,
  identity_contract:'arthur-personal-linkedin-identity-v4',
  identity_gate_version:'channel-identity-hard-gate-v3',
  source_text:'Ik wil software, AI, BI en data als één samenhangend softwaresysteem zien; geen geverifieerd eigen klantresultaat.',
  source_lineage:['current-chat:user-fact:2026-11-20:source-backed-architecture'],
  sensitive_private_detail:false
 };
 const safe='Ik kies ervoor om AI, BI, data en software als één systeem te ontwerpen. Ik wil dat het simpel blijft en dat een ondernemer beslissingen kan controleren; die klantresultaten zijn nog niet bewezen.';
 assert.deepEqual(personalFounderDecisionSourceScopeViolations(safe,e),[]);
 assert.deepEqual(personalFirstPersonCopyViolations(safe,e,'2026-11-20'),[]);
 const invented='Ik zag bij een klant dat losse teams dashboards bouwden. Het resultaat was veel snellere inzichten dankzij mijn transformatie.';
 const failures=personalFirstPersonCopyViolations(invented,e,'2026-11-20');
 assert.ok(failures.includes('PERSONAL_FOUNDER_UNVERIFIED_IMPLEMENTATION_OR_IMPACT_CLAIM'));
});
