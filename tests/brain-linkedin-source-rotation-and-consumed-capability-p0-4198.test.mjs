import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = path => fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const orchestrator=read('supabase/functions/powerhouse-content-orchestrator/index.ts');
const publisher=read('supabase/functions/powerhouse-social-publisher/index.ts');

test('prior consumed daily capability suppresses further orchestration and duplicate LinkedIn attempts',()=>{
  assert.match(orchestrator,/consumedCapabilityChannels\.has\(channel\) && !clean\(row\.delivery_ref\)/);
  assert.match(orchestrator,/\.select\('channel,consumed_at,revoked_at'\)/);
  assert.match(orchestrator,/!!c\.consumed_at&&!c\.revoked_at/);
  assert.match(orchestrator,/SOCIAL_PUBLICATION_AUTHORITY_RECONCILIATION_READ_FAILED/);
  assert.match(publisher,/PUBLICATION_AUTHORITY_DENIED/);
});
test('company duplicate recovery rotates to another evidence-bound recommendation, never the rejected one',()=>{
  assert.match(orchestrator,/function pickRecommendation\(recs:any\[\], channel:string, excludedRecommendationIds:string\[\]=\[\]\)/);
  assert.match(orchestrator,/!excluded\.has\(clean\(r\?\.recommendation_id\)\)/);
  assert.match(orchestrator,/const rejectedRecommendationIds=recoverableDuplicate/);
  assert.match(orchestrator,/NO_UNIQUE_EVIDENCE_BOUND_RECOMMENDATION/);
  assert.match(orchestrator,/rejected_recommendation_ids:channel==='linkedin_company'/);
  assert.match(publisher,/const refusedSource=clean\(gatePassedEvidence\.fallback_recommendation_id/);
  assert.match(publisher,/rejected_recommendation_ids:rejectedRecommendationIds/);
});
test('rotation never weakens global story family uniqueness or bypasses provider authority',()=>{
  for(const invariant of ['reserveGlobalUniquePublication(db,runDate,row.channel','consumePublishCapability(db,capability','uniqueness_denied_pre_provider:true','republish_forbidden:false','provider_publication_ack_verified:false','possible_provider_side_effect:false']){
    assert.ok(publisher.includes(invariant),invariant);
  }
  for(const invariant of ['recoverableUniquenessDenial','authority.consumed===false','evidence.provider_create_success!==true','evidence.provider_publication_ack_verified!==true','evidence.possible_provider_side_effect!==true']){
    assert.ok(orchestrator.includes(invariant),invariant);
  }
});
test('personal LinkedIn generated post length still bounded before quality gates and hash',()=>{
  const cap=orchestrator.indexOf('bodyText = compactLinkedInCommentary(bodyText)');
  const truth=orchestrator.indexOf('personalFinalCopyValid(bodyText');
  const finalHash=orchestrator.indexOf('const finalTextHash = await digest(bodyText)');
  assert.ok(cap>0 && cap<truth && truth<finalHash);
  assert.match(publisher,/LINKEDIN_COMMENTARY_LIMIT_EXCEEDED/);
});
