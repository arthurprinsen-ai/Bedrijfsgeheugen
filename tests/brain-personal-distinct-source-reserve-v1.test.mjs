import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildVerifiedFounderReserve} from '../supabase/functions/_shared/personal-founder-source-reserve.mjs';
const e={ai_native_builder_story_verified:true,ai_native_builder_policy:'personal-linkedin-ai-native-builder-v1',
build_event_verified:true,arthur_anchor_verified:true,source_backed:true,business_topic:true,
corporate_voice:false,company_page_interchangeable:false,forced_business_moral:false,
identity_contract:'arthur-personal-linkedin-identity-v4',identity_gate_version:'channel-identity-hard-gate-v3',
content_id:'builder:real',source_lineage:['verified:evidence'],
result_event:{event_id:'id-progress',event_type:'commercial_heartbeat',source:'powerhouse-heartbeat',occurred_at:'2026-10-22T07:00:00Z'},
friction_event:{event_id:'id-error',event_type:'loop_assurance_refresh',source:'powerhouse-assurance',occurred_at:'2026-10-22T07:02:00Z'},
entrepreneur_problem_sources:[{url:'https://example.org/real',titel:'Ondernemersprobleem'}]};
const source={target_channel:'linkedin_personal',status:'suggested',evidence:e};
test('three idempotently identifiable, independent, proven stories',()=>{
 const x=buildVerifiedFounderReserve(source,'2026-10-22');
 assert.equal(x.length,3);assert.equal(new Set(x.map(y=>y.dedupe_key)).size,3);
 for(const v of x){assert.equal(v.evidence.provider_outcome_unproven,true);
 assert.equal(v.evidence.source_lineage.length,2);assert.equal(v.target_channel,'linkedin_personal');}
});
test('no qualified source means no story, never a fabricated send',()=>{
 assert.deepEqual(buildVerifiedFounderReserve(null,'2026-10-22'),[]);
 assert.deepEqual(buildVerifiedFounderReserve({...source,evidence:{...e,arthur_anchor_verified:false}},'2026-10-22'),[]);
 assert.deepEqual(buildVerifiedFounderReserve({...source,evidence:{...e,result_event:null,friction_event:null,entrepreneur_problem_sources:[]}},'2026-10-22'),[]);
});
test('existing One Brain owners and publication truth gates preserved',()=>{
 const s=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
 assert.match(s,/buildVerifiedFounderReserve\(verified,runDate\)/);
 assert.match(s,/ignoreDuplicates:true/);
 assert.match(s,/validPersonalSource\(personalSource\)/);
 assert.match(s,/recoverableObligationUniquenessDenial/);
 assert.doesNotMatch(s,/powerhouse_seed_verified_personal_reserve_v1/);
});
