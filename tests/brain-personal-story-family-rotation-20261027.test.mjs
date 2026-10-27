import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildVerifiedFounderReserve,isStalePersonalSource,personalSourceEventTypes} from '../supabase/functions/_shared/personal-founder-source-reserve.mjs';
const ev=(id,type)=>({event_id:id,event_type:type,source:'x',occurred_at:'2026-10-27T01:00:00Z'});
const base=(extra={})=>({target_channel:'linkedin_personal',status:'suggested',evidence:{
 ai_native_builder_story_verified:true,ai_native_builder_policy:'personal-linkedin-ai-native-builder-v1',build_event_verified:true,
 arthur_anchor_verified:true,source_backed:true,business_topic:true,corporate_voice:false,company_page_interchangeable:false,
 forced_business_moral:false,identity_contract:'arthur-personal-linkedin-identity-v4',identity_gate_version:'channel-identity-hard-gate-v3',
 content_id:'c',source_lineage:['a'],result_event:ev('1','loop_assurance_refresh'),friction_event:ev('2','source_health_evaluated'),
 entrepreneur_problem_sources:[{url:'https://example.test/p',titel:'Probleem'}],...extra}});
test('event types of recently used story families are not offered again',()=>{
 const r=buildVerifiedFounderReserve(base(),'2026-10-27',new Set(['loop_assurance_refresh','source_health_evaluated']));
 assert.deepEqual(r.map(x=>x.evidence.source_focus_kind),['external_business_problem']);
});
test('external business problem comes first, others follow when fresh',()=>{
 const r=buildVerifiedFounderReserve(base(),'2026-10-27');
 assert.equal(r[0].evidence.source_focus_kind,'external_business_problem');
 assert.equal(r.length,3);
});
test('staleness is by event type, not by event id',()=>{
 assert.ok(isStalePersonalSource(base(),new Set(['loop_assurance_refresh'])));
 assert.ok(!isStalePersonalSource(base(),new Set(['other'])));
 assert.deepEqual(personalSourceEventTypes(base()),['loop_assurance_refresh','source_health_evaluated']);
});
test('orchestrator prefers a fresh source, falls back to previous choice, guard untouched',()=>{
 const src=readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
 assert.match(src,/isStalePersonalSource\(s,recentPersonalTypes\)/);
 assert.match(src,/\|\| eligiblePersonal\[0\] \|\| null/);
 assert.match(src,/\.in\('status',\['PUBLISHED','LIVE_PROVEN'\]\)/);
});
