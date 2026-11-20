import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {personalFounderDecisionSourceScopeViolations,personalFirstPersonCopyViolations} from '../supabase/functions/_shared/personal-first-person-story-gate.mjs';

const e={
 content_id:'user-authored-founder:2026-11-20:unified-intelligent-software-and-authentic-conversations',
 ai_native_builder_story_verified:true,
 ai_native_builder_policy:'personal-linkedin-ai-native-builder-v1',
 build_event_kind:'founder_directed_verified_product_design_decision_and_merged_delivery',
 build_event_verified:true,arthur_anchor_verified:true,source_backed:true,
 personal_truth_verified:true,first_person_claims_verified:true,
 business_topic:true,personal_life_topic:false,
 corporate_voice:false,company_page_interchangeable:false,forced_business_moral:false,
 observational_personal_theme_verified:false,public_theme_source_verified:false,
 identity_contract:'arthur-personal-linkedin-identity-v4',
 identity_gate_version:'channel-identity-hard-gate-v3',
 source_text:'Arthur zelf: Juist de combinatie software AI BI data als 1 zien gecombineerd. Niet geverifieerd dat Arthur code schreef, klantsituaties meemaakte of klantresultaten bereikte.',
 source_lineage:['current-chat:user-fact:2026-11-20:unified-choice'],
 sensitive_private_detail:false
};
const date='2026-11-20';
test('source-scope veto catches actual Nov20 personal copy false green on exact independent last-mile guard',()=>{
 const actual='Het verliezen van grip op cashflow is lastig. Dat wilde ik anders: ik besloot software, AI, BI en data samen te zien. In de praktijk botste dat idee met losse teams die dashboards maakten. Het resultaat was vertraging en dubbel werk. Wat ik veranderde: het levert veel snellere inzichten op.';
 const failures=personalFirstPersonCopyViolations(actual,e,date);
 assert.ok(failures.includes('PERSONAL_FOUNDER_UNVERIFIED_LIVED_TEAM_OR_CLIENT_CLAIM'),failures.join(','));
 assert.ok(failures.includes('PERSONAL_FOUNDER_UNVERIFIED_IMPLEMENTATION_OR_IMPACT_CLAIM'),failures.join(','));
});
test('credible founder statement and sincere professional question remain eligible',()=>{
 const safe='Ik koos voor een richting: software, AI, BI en data moeten één intelligent systeem worden, niet vier losse producten. Het is mijn ontwerpvisie; bewezen resultaten voor klanten heb ik hier nog niet. Welke beslissingen zou jij altijd door een mens laten beoordelen?';
 assert.deepEqual(personalFounderDecisionSourceScopeViolations(safe,e),[]);
 assert.deepEqual(personalFirstPersonCopyViolations(safe,e,date),[]);
});
test('narrow scope does not block genuinely independently authored lived team stories',()=>{
 const independent={...e,build_event_kind:'independently_verified_real_personal_build_event',
  source_text:'Ik sprak met mijn echte team over hun eigen Power BI rapportageproces en legde vast wat gebeurde.'};
 const actual='Ik zag in de praktijk dat losse teams hun dashboards maakten. Dat was een echte observatie.';
 assert.deepEqual(personalFounderDecisionSourceScopeViolations(actual,independent),[]);
});
test('original writer and independent reviewer share the exact source-scoped prevention',()=>{
 const orchestrator=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
 const publisher=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
 const reviewer=readFileSync('supabase/functions/bg-pre-publish-review/index.ts','utf8');
 const gate=readFileSync('supabase/functions/_shared/personal-first-person-story-gate.mjs','utf8');
 assert.ok(orchestrator.includes('SOURCE-CLAIM-SCOPE:'));
 assert.ok(orchestrator.includes('Maak NOOIT van publieke MKB-fricties een persoonlijk meegemaakt'));
 assert.ok(gate.includes('PERSONAL_FOUNDER_UNVERIFIED_LIVED_TEAM_OR_CLIENT_CLAIM'));
 assert.ok(gate.includes('PERSONAL_FOUNDER_UNVERIFIED_IMPLEMENTATION_OR_IMPACT_CLAIM'));
 assert.ok(reviewer.includes('personalFirstPersonCopyViolations'));
 assert.ok(publisher.includes('personalLastMilePublicationViolations'));
 assert.ok(publisher.includes('verifyCurrentPersonalStorySource'));
});
