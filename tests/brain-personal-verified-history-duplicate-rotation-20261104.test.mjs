import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {personalSourceEventTypes,isStalePersonalSource} from '../supabase/functions/_shared/personal-founder-source-reserve.mjs';

const original=readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
const originalNested={identity_gate_evidence:{
 ai_native_builder_story_verified:true,
 result_event:{event_type:'commercial_heartbeat',event_id:'historically-proven'},
 friction_event:{event_type:'source_health_evaluated',event_id:'source-ref'},
 source_focus_context:{event_type:'observed_change'}
}};
test('27 October published source history nested within identity gate is not invisible to today source chooser',()=>{
 const previous={evidence:originalNested};
 const eventTypes=personalSourceEventTypes(previous);
 assert.deepEqual(eventTypes,['commercial_heartbeat','source_health_evaluated','observed_change']);
 assert.equal(isStalePersonalSource({evidence:{
   result_event:{event_type:'commercial_heartbeat'},
   friction_event:{event_type:'source_health_evaluated'}
 }},new Set(eventTypes)),true);
});
test('JSONB string evidence and legacy top-level event sources retain same exact typing',()=>{
 assert.deepEqual(personalSourceEventTypes({evidence:JSON.stringify(originalNested)}),['commercial_heartbeat','source_health_evaluated','observed_change']);
 assert.deepEqual(personalSourceEventTypes({evidence:{result_event:{event_type:'new_actual_source'}}}),['new_actual_source']);
 assert.deepEqual(personalSourceEventTypes({evidence:{result_event:{event_type:'commercial_heartbeat'},identity_gate_evidence:originalNested.identity_gate_evidence}}),['commercial_heartbeat','source_health_evaluated','observed_change']);
 assert.deepEqual(personalSourceEventTypes({evidence:'not-json'}),[]);
});
test('original owner checks at least the October 27 8-day gap without changing provider uniqueness',()=>{
 assert.equal((original.match(/const recentDates=Array\.from\(\{length:30\}/g)||[]).length,2);
 assert.equal((original.match(/personalSourceEventTypes\(r\)/g)||[]).length,2);
 assert.match(original,/recoverableObligationUniquenessDenial/);
 assert.match(original,/global_uniqueness_gate|GLOBAL_POST_DUPLICATE_BLOCKED|personalFinalCopyValid/);
 assert.doesNotMatch(original,/DISABLE_DUPLICATE_GATE|FORCE_PROVIDER_PUBLISHED|RETRY_ALREADY_CREATED_PROVIDER/);
});
test('different independently proven event-family remains eligible; repeat does not',()=>{
 const published=new Set(personalSourceEventTypes({evidence:originalNested}));
 assert.equal(isStalePersonalSource({evidence:{result_event:{event_type:'new_verified_product_event'}}},published),false);
 assert.equal(isStalePersonalSource({evidence:{friction_event:{event_type:'source_health_evaluated'}}},published),true);
});
