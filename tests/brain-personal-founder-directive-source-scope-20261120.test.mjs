import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {personalFounderDecisionSourceScopeViolations,personalFirstPersonCopyViolations} from '../supabase/functions/_shared/personal-first-person-story-gate.mjs';
import {verifyAlreadyAppliedProvider888SourceLockRecovery,EXACT_PROVIDER_888_BASE,ORIGINAL_SECURITY_SQL_PATH} from '../tools/ci/verified-provider-888-personal-security-history-reconciliation.mjs';

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
 // The production publisher must deploy the new shared guard too, rather
 // than relying on a reviewer bundle with a different deployment revision.
 const direct='personalFounderDecisionSourceScopeViolations(commentary,approval?.evidence||{})';
 assert.ok(publisher.includes(direct));
 assert.ok(publisher.indexOf(direct) < publisher.indexOf("LINKEDIN_CREATE_LINKED_IN_POST"));
 assert.match(publisher,/PERSONAL_FOUNDER_SOURCE_SCOPE_LAST_MILE_VETO/);
});


test('one-time, strict native-provider 888 reconciliation verifies historical prefix and exact SQL attestation',()=>{
 const headLock=JSON.parse(readFileSync('supabase/migration-history.lock.json','utf8'));
 const baseLock={...headLock,applied:headLock.applied.slice(0,-2),captured_at:'2026-11-19T09:35:00.000Z'};
 assert.equal(baseLock.applied.length,886);
 assert.equal(headLock.applied.length,888);
 const securitySQL=readFileSync('supabase/migrations/20261120134537_security_pw_mo14_private_player_data_20261120.sql','utf8');
 const founderSQL=readFileSync('supabase/migrations/20261120143500_personal_verified_founder_source_v2_policy_alignment.sql','utf8');
 const args={
  baseSha:EXACT_PROVIDER_888_BASE,baseLock,headLock,
  changedMigrations:[{status:'A',file:ORIGINAL_SECURITY_SQL_PATH}],
  securitySQL,founderSQL
 };
 const accepted=verifyAlreadyAppliedProvider888SourceLockRecovery(args);
 assert.equal(accepted.ok,true,JSON.stringify(accepted));
 assert.equal(accepted.hosted_preview_required,true);
 assert.equal(accepted.provider_history_attested_by_candidate,false);
 for(const wrong of [
  {...args,baseSha:'1'.repeat(40)},
  {...args,securitySQL:securitySQL+' '},
  {...args,founderSQL:founderSQL.replace('TO service_role','TO authenticated')},
  {...args,changedMigrations:[{status:'A',file:'supabase/migrations/unrelated.sql'}]},
  {...args,headLock:{...headLock,applied:headLock.applied.slice(0,-2).concat(headLock.applied.at(-1))}},
  {...args,headLock:{...headLock,applied:headLock.applied.map((x,i)=>i===0?{...x,name:'tampered'}:x)}},
  {...args,headLock:{...headLock,project_ref:'wrong-project'}}
 ])assert.equal(verifyAlreadyAppliedProvider888SourceLockRecovery(wrong).ok,false);
});
