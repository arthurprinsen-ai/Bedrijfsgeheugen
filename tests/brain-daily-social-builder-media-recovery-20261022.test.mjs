import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {hasVerifiedPersonalBuilderEvidence,unchangedMediaPreflightAttempts}
  from '../supabase/functions/_shared/daily-social-recovery-invariants.mjs';
import {writeMediaPreflight}
  from '../supabase/functions/powerhouse-instagram-media-router/preflight-write.mjs';

const proof={
  ai_native_builder_story_verified:true,
  ai_native_builder_policy:'personal-linkedin-ai-native-builder-v1',
  build_event_verified:true,arthur_anchor_verified:true,source_backed:true,business_topic:true,
  corporate_voice:false,company_page_interchangeable:false,forced_business_moral:false,
  identity_contract:'arthur-personal-linkedin-identity-v4',
  identity_gate_version:'channel-identity-hard-gate-v3',
  content_id:'ai-native-builder:2026-10-22',
  source_lineage:['powerhouse_runtime_events:verified-event']
};
test('only fully source-verified founder events can reopen a blocked source decision',()=>{
  assert.equal(hasVerifiedPersonalBuilderEvidence(proof),true);
  for(const key of ['ai_native_builder_story_verified','build_event_verified','arthur_anchor_verified','source_backed','business_topic']){
    assert.equal(hasVerifiedPersonalBuilderEvidence({...proof,[key]:false}),false,key);
  }
  for(const key of ['corporate_voice','company_page_interchangeable','forced_business_moral']){
    assert.equal(hasVerifiedPersonalBuilderEvidence({...proof,[key]:true}),false,key);
  }
  assert.equal(hasVerifiedPersonalBuilderEvidence({...proof,source_lineage:[]}),false);
  assert.equal(hasVerifiedPersonalBuilderEvidence({...proof,identity_contract:'wrong'}),false);
  assert.equal(hasVerifiedPersonalBuilderEvidence(null),false);
});
test('preflight polls never inflate actual media generation attempts',()=>{
  assert.equal(unchangedMediaPreflightAttempts({attempts:104}),104);
  assert.equal(unchangedMediaPreflightAttempts({attempts:310}),310);
  assert.equal(unchangedMediaPreflightAttempts({attempts:-1}),0);
  assert.equal(unchangedMediaPreflightAttempts({attempts:'invalid'}),0);
  assert.equal(unchangedMediaPreflightAttempts(null),0);
});
test('same-state media preflight does not mutate or reset worker state',async()=>{
  let mutations=0;
  const db={from(){mutations++;throw new Error('preflight must remain read-only');}};
  const job={
    id:'existing-job',updated_at:'2026-10-22T05:00:00Z',
    status:'WAITING_ASSET',post_type:'reel',required_provider:'openart',selected_provider:'openart',
    provider_connection_state:'READY',last_error:null,next_action:'Producer must submit exact asset manifest to this router.',
    republish_forbidden:false,attempts:104,
    asset_manifest:{content_id:'approved-winner'},proof_manifest:{}
  };
  const row={...job,updated_at:'2026-10-22T05:05:00Z'};
  assert.deepEqual(await writeMediaPreflight(db,job,row),{kind:'preserved',status:'WAITING_ASSET'});
  assert.equal(mutations,0);
});
test('code keeps strict publisher gates and existing scheduler identity',()=>{
  const orchestrator=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
  const loop=readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');
  const router=readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
  assert.match(orchestrator,/verifiedPersonalSource = !!personalSource && validPersonalSource\(personalSource\)/);
  assert.match(loop,/hasVerifiedPersonalBuilderEvidence\(evidence\.identity_gate_evidence\)/);
  assert.match(loop,/evidence\.provider_create_success !== true/);
  assert.match(loop,/evidence\.republish_forbidden !== true/);
  assert.match(router,/attempts:unchangedMediaPreflightAttempts\(job\)/);
  assert.match(router,/if\(action==='submit_asset'\)/);
});
