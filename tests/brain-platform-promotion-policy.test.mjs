import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {evaluatePlatformPromotion} from '../brain/production/platform-promotion-policy.mjs';
import {evaluateDeliveryLane} from '../brain/production/continuous-delivery-v2.mjs';

const registry=JSON.parse(await readFile('config/brain-platform-adapters.json','utf8'));
const manifest=(platform,extra={})=>({contract:'BRAIN-DELIVERY-v2',change_id:'chg-1',component_id:'cmp-1',lane_id:'automation',component_type:'app',candidate_identity:'abc',tested_identity:'abc',registered:true,brain_context_loaded:true,learning_writeback_configured:true,rollback_identity:'lkg',scopes:['app/x'],dependencies:[],gates:{contract:true,quality:true,security:true,cost_performance:true,preview:true},production:{status:'PENDING',deployed_identity:''},platform,platform_registry:registry,...extra});

test('known direct-promotion adapter is eligible only through BG169 with global boundaries',()=>{
 const r=evaluatePlatformPromotion({platform:'notion',registry});
 assert.deepEqual(r,{ok:true,decision:'PLATFORM_PROMOTION_ALLOWED',platform:'notion',authority:'BG169'});
});

test('unknown or non-direct adapters fail closed',()=>{
 assert.equal(evaluatePlatformPromotion({platform:'unknown-new-app',registry}).decision,'BLOCK_HARD_BOUNDARY');
 const copy=structuredClone(registry);copy.platforms.find(x=>x.platform==='notion').direct_promotion=false;
 assert.equal(evaluatePlatformPromotion({platform:'notion',registry:copy}).reason,'direct_promotion_disabled');
});

test('authority and global hard-boundary policy cannot be overridden',()=>{
 const wrongAuthority=structuredClone(registry);wrongAuthority.platforms.find(x=>x.platform==='supabase').authority='OTHER';
 assert.equal(evaluatePlatformPromotion({platform:'supabase',registry:wrongAuthority}).reason,'production_authority_must_be_BG169');
 const wrongBoundary=structuredClone(registry);wrongBoundary.platforms.find(x=>x.platform==='dataforseo').hard_boundary_policy='ignore';
 assert.equal(evaluatePlatformPromotion({platform:'dataforseo',registry:wrongBoundary}).reason,'global_hard_boundary_policy_required');
});

test('Make promotion requires available capacity and execution proof',()=>{
 assert.equal(evaluatePlatformPromotion({platform:'make',registry,capacity:'paused',executionProof:true}).reason,'platform_capacity_unavailable');
 assert.equal(evaluatePlatformPromotion({platform:'make',registry,capacity:'available',executionProof:false}).reason,'execution_proof_missing');
 assert.equal(evaluatePlatformPromotion({platform:'make',registry,capacity:'available',executionProof:true}).ok,true);
});

test('delivery controller consumes platform policy before declaring promotion ready',()=>{
 const bad=structuredClone(registry);bad.platforms.find(x=>x.platform==='notion').direct_promotion=false;
 assert.equal(evaluateDeliveryLane(manifest('notion',{platform_registry:bad})).reason,'direct_promotion_disabled');
 assert.equal(evaluateDeliveryLane(manifest('notion')).decision,'PROMOTION_READY');
});
