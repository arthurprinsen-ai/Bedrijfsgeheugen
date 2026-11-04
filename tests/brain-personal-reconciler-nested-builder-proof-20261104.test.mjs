import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261104052001_original_personal_reconciler_nested_builder_proof_v1.sql',import.meta.url),'utf8');
const gate=sql.slice(sql.indexOf("if r.channel='linkedin_personal'"),sql.indexOf("if public.powerhouse_jsonb_true(r.evidence,'provider_truth_verified')",sql.indexOf("if r.channel='linkedin_personal'")));
test('original source reconciler must inspect the already verified nested publisher identity evidence',()=>{
 assert.ok(gate.length>0,'original personal reconcile gate found');
 assert.match(gate,/r\.evidence->'identity_gate_evidence'/);
 for(const key of ['ai_native_builder_story_verified','ai_native_builder_policy','build_event_verified','arthur_anchor_verified','source_backed','business_topic','corporate_voice','company_page_interchangeable','forced_business_moral','identity_contract','identity_gate_version','content_id','source_lineage']) {
   assert.ok(gate.includes(key),'missing independent nested source gate '+key);
 }
 assert.match(gate,/jsonb_typeof\([^\n]+source_lineage/);
 assert.match(gate,/jsonb_array_length\([^\n]+source_lineage/);
});
test('provider publication/anti-duplicate and existing personal truth gates remain unchanged',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_reconcile_content_outcomes_v1/);
 assert.match(sql,/SECURITY DEFINER/);
 assert.match(sql,/provider_publication_ack_verified/);
 assert.match(sql,/terminal_provider_side_effect/);
 assert.match(sql,/republish_forbidden/);
 assert.match(sql,/PROVIDER_RECORD_MISSING/);
 assert.match(sql,/public\.powerhouse_jsonb_true\(r\.evidence,'personal_truth_verified'\)/);
 assert.match(sql,/public\.powerhouse_jsonb_true\(r\.evidence,'observational_personal_theme_verified'\)/);
 assert.doesNotMatch(sql,/DROP FUNCTION|GRANT ALL|DISABLE_RLS|SKIP_DUPLICATE_GATE/);
});
const clean=v=>String(v??'').trim();
function verifiedNested(e){
 return e.ai_native_builder_story_verified===true
  &&e.ai_native_builder_policy==='personal-linkedin-ai-native-builder-v1'
  &&e.build_event_verified===true&&e.arthur_anchor_verified===true
  &&e.source_backed===true&&e.business_topic===true
  &&e.corporate_voice===false&&e.company_page_interchangeable===false
  &&e.forced_business_moral===false
  &&e.identity_contract==='arthur-personal-linkedin-identity-v4'
  &&e.identity_gate_version==='channel-identity-hard-gate-v3'
  &&!!clean(e.content_id)&&Array.isArray(e.source_lineage)&&e.source_lineage.length>0;
}
test('strict nested builder proof accepts real source shape but rejects forged or absent anchors',()=>{
 const valid={ai_native_builder_story_verified:true,ai_native_builder_policy:'personal-linkedin-ai-native-builder-v1',
 build_event_verified:true,arthur_anchor_verified:true,source_backed:true,business_topic:true,
 corporate_voice:false,company_page_interchangeable:false,forced_business_moral:false,
 identity_contract:'arthur-personal-linkedin-identity-v4',identity_gate_version:'channel-identity-hard-gate-v3',
 content_id:'ai-native-builder:2026-11-04',source_lineage:['verified:original-source']};
 assert.equal(verifiedNested(valid),true);
 for(const [k,v] of [['source_backed',false],['build_event_verified',false],['corporate_voice',true],['source_lineage',[]],['identity_contract','unverified'],['content_id','']]) {
   assert.equal(verifiedNested({...valid,[k]:v}),false,k+' cannot bypass a publisher gate');
 }
});
