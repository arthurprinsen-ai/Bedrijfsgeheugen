import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveMiraFrozenWinner} from '../supabase/functions/_shared/mira-frozen-winner-contract.mjs';
import {MIRA_CASES,selectMiraProblem} from '../supabase/functions/_shared/mira-entrepreneur-caption.mjs';

const runDate='2026-10-23';
const id='7880c326-72b8-4ac8-a712-971a9a24de12';
const source='https://example.org/privacy-complaint';
const winner={run_date:runDate,recommendation_id:id};
const lineage={run_date:runDate,winner_recommendation_id:id,state:'WINNER_FROZEN',source_evidence:{source_hash:'a'.repeat(64),source_url:source}};
const recommendation={
 recommendation_id:id,status:'accepted',
 evidence:{source_backed:true,source_url:source,source_title:'Verwijdering van persoonlijke gegevens uit klachten',
   forced_business_bridge_forbidden:true,office_problem_attribution_forbidden:true}
};
const job={asset_manifest:{daily_winner_recommendation_id:id}};
const resolve=(options={})=>resolveMiraFrozenWinner(runDate,{
 winner,lineage,recommendation,job,...options
});

test('existing unreserved library problem stays deterministic only before daily freeze',()=>{
 const current=resolveMiraFrozenWinner(runDate,{});
 assert.equal(current.ok,true);
 assert.equal(current.kind,'pre_freeze_legacy');
 assert.equal(current.problem.id,selectMiraProblem(runDate).id);
});
test('a frozen complaint winner cannot be coerced into PH-P030 via date rotation',()=>{
 const actual=resolve();
 assert.equal(actual.ok,false);
 assert.equal(actual.code,'SOURCE_BACKED_MIRA_SCENE_ROUTE_REQUIRED');
 assert.notEqual(actual.winner_recommendation_id,selectMiraProblem(runDate).id);
});
test('mismatched frozen winner or mutated daily job is denied',()=>{
 assert.equal(resolve({lineage:{...lineage,winner_recommendation_id:'different'}}).code,'INSTAGRAM_FROZEN_WINNER_LINEAGE_CONFLICT');
 assert.equal(resolve({job:{asset_manifest:{daily_winner_recommendation_id:'other'}}}).code,'INSTAGRAM_FROZEN_WINNER_LINEAGE_CONFLICT');
});
test('frozen source provenance must be real, same URL, accepted and hashed',()=>{
 assert.equal(resolve({recommendation:{...recommendation,status:'suggested'}}).code,'INSTAGRAM_FROZEN_SOURCE_PROVENANCE_UNVERIFIED');
 assert.equal(resolve({lineage:{...lineage,source_evidence:{...lineage.source_evidence,source_hash:''}}}).code,'INSTAGRAM_FROZEN_SOURCE_PROVENANCE_UNVERIFIED');
 assert.equal(resolve({recommendation:{...recommendation,evidence:{...recommendation.evidence,source_url:'https://other.test'}}}).code,'INSTAGRAM_FROZEN_SOURCE_PROVENANCE_UNVERIFIED');
});
test('approved library mapping requires an existing exact canonical scene',()=>{
 const c=MIRA_CASES[1];
 const ev={...recommendation.evidence,forced_business_bridge_forbidden:false,office_problem_attribution_forbidden:false};
 assert.equal(resolve({recommendation:{...recommendation,evidence:ev}}).code,'CANONICAL_WINNER_NOT_LIBRARY_MAPPED');
 assert.equal(resolve({recommendation:{...recommendation,evidence:{...ev,approved_canonical_problem_id:c.id,approved_mira_scene:'other'}}}).code,'WINNER_SCENE_UNVERIFIED');
 const valid=resolve({recommendation:{...recommendation,evidence:{...ev,approved_canonical_problem_id:c.id,approved_mira_scene:c.scene}}});
 assert.equal(valid.ok,true);
 assert.equal(valid.problem.id,c.id);
 assert.equal(valid.winner_recommendation_id,id);
 assert.equal(valid.source_hash,'a'.repeat(64));
});
test('the production router calls the strict resolver before it can verify media',()=>{
 const src=fs.readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
 assert.match(src,/resolveMiraFrozenWinner\(runDate,/);
 assert.match(src,/if\(!winnerContract\.ok\)/);
 assert.match(src,/action==='submit_asset'\)return json\(\{ok:false,error:winnerContract\.code/);
 assert.match(src,/winnerContract\.winner_recommendation_id\|\|clean\(manifest\.recommendation_id\)/);
 assert.match(src,/powerhouse-instagram-media-verifier/);
 assert.match(src,/MIRA_FACE_DRIFT_ACROSS_REEL_FRAMES/);
 assert.match(src,/MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED/);
});

test('router, orchestrator and publisher share the frozen source-led authority',()=>{
 const router=fs.readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
 const orchestrator=fs.readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
 const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
 assert.match(router,/resolveMiraFrozenWinner/);
 assert.match(router,/manifest\.openart_history_id/);
 assert.match(router,/winnerContract\.asset_url/);
 assert.match(router,/MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED/);
 assert.match(orchestrator,/resolveMiraFrozenWinner/);
 assert.match(orchestrator,/miraResolvedCaption\(resolvedMira\)/);
 assert.match(orchestrator,/validateResolvedMiraCaptionForDelivery/);
 assert.match(orchestrator,/MIRA_FROZEN_SOURCE_MEDIA_PROOF_REQUIRED/);
 assert.doesNotMatch(orchestrator,/bodyText=miraCaption\(miraBusinessProblem\)/);
 assert.match(publisher,/validateResolvedMiraCaptionForDelivery/);
 assert.match(publisher,/proof\.mira_source_hash/);
 assert.match(publisher,/proof\.mira_generation_source\?\.openart_history_id/);
 assert.match(publisher,/miraFaceProofValid/);
 assert.doesNotMatch(publisher,/validateMiraCaptionForDelivery\(runDate,art\.body/);
});
