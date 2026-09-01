import test from 'node:test';
import assert from 'node:assert/strict';
import registry from '../config/brain-platform-adapters.json' with {type:'json'};
import {deriveTouchedPlatforms,evaluatePromotionActivation} from '../tools/platform-promotion-activation-gate.mjs';

test('derives only platforms actually touched by a candidate',()=>{
 const touched=deriveTouchedPlatforms(['supabase/migrations/x.sql','netlify/functions/x.mjs','portal/runtime-telemetry.mjs','README.md'],registry);
 assert.deepEqual(touched,['netlify','portal','supabase']);
});

test('unknown integration path fails closed',()=>{
 const result=evaluatePromotionActivation({changedPaths:['integrations/new-vendor/adapter.mjs'],registry});
 assert.equal(result.productionCandidateReady,false);
 assert.equal(result.unknown.length,1);
 assert.match(result.unknown[0],/new-vendor/);
});

test('registered changed adapters inherit mandatory candidate contract',()=>{
 const result=evaluatePromotionActivation({changedPaths:['supabase/migrations/x.sql','netlify/functions/x.mjs'],registry});
 assert.equal(result.productionCandidateReady,true);
 assert.deepEqual(result.platforms.map(x=>x.platform),['netlify','supabase']);
 for(const item of result.platforms){
   assert.equal(item.registered,true);
   assert.equal(item.compatibilityMapping,true);
   assert.equal(item.regressionContract,true);
   assert.equal(item.authority,'BG169');
   assert.equal(item.directPromotion,true);
 }
});
