import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SUPPORTED_APP_TARGETS } from '../brain/adapters/app-delivery.mjs';
import { summarizeContinuousDeliveryMetrics } from '../brain/production/continuous-delivery-metrics.mjs';

const readJson=path=>readFile(path,'utf8').then(JSON.parse);

test('v2.1 explicitly prohibits unrelated batching and waiting',async()=>{
  const policy=await readJson('config/brain-continuous-promotion-v2-1.json');
  assert.equal(policy.extends,'BRAIN-DELIVERY-v2');
  assert.equal(policy.releaseUnit,'smallest-independently-safe-change');
  assert.equal(policy.batchUnrelatedChanges,false);
  assert.equal(policy.waitForUnrelatedChanges,false);
  assert.equal(policy.activateImmediatelyWhenGreen,true);
  assert.equal(policy.rebuildOnUnrelatedMainDrift,false);
  assert.equal(policy.allRegisteredPlatformsInherit,true);
  assert.equal(policy.targets.unrelatedWaitMs,0);
  assert.equal(policy.targets.branchRebuildsForUnrelatedDrift,0);
});

test('canonical v2 keeps independent promotion and moving-main conflict-aware isolation',async()=>{
  const delivery=await readJson('config/brain-delivery-system.json');
  assert.equal(delivery.version,'BRAIN-DELIVERY-v2');
  assert.equal(delivery.integration.singleCandidate,false);
  assert.equal(delivery.integration.independentPromotion,true);
  assert.equal(delivery.branchPolicy.rebuildOnMainDrift,false);
  assert.equal(delivery.branchPolicy.maxRebuildsForNonOverlappingDrift,0);
  assert.ok(delivery.branchPolicy.syncRequiredWhen.includes('declared-contract-overlap'));
  assert.ok(delivery.branchPolicy.syncRequiredWhen.includes('declared-dependency-conflict'));
});

test('all registered current platforms are direct-promotion BG169 members and future apps inherit',async()=>{
  const registry=await readJson('config/brain-platform-adapters.json');
  const platforms=new Map(registry.platforms.map(row=>[row.platform,row]));
  for(const name of ['github','netlify','make','notion','supabase','dataforseo']){
    assert.equal(platforms.get(name)?.direct_promotion,true,name);
    assert.equal(platforms.get(name)?.authority,'BG169',name);
  }
  assert.equal(registry.future_components.inherit_automatically,true);
  assert.equal(registry.future_components.no_production_without_contract,true);
  assert.deepEqual([...SUPPORTED_APP_TARGETS].sort(),['dataforseo','make','notion','supabase']);
});

test('healthy parallel delivery measures zero unrelated waiting and zero drift rebuilds',()=>{
  const summary=summarizeContinuousDeliveryMetrics([
    {startedAt:1000,liveAt:5000,unrelatedWaitMs:0,branchRebuildsForUnrelatedDrift:0,serialWrites:0,duplicateWork:0,ciDurationMs:1500,platformCost:1,unaffectedGatesSkipped:3},
    {startedAt:2000,liveAt:5500,unrelatedWaitMs:0,branchRebuildsForUnrelatedDrift:0,serialWrites:0,duplicateWork:0,ciDurationMs:1200,platformCost:2,unaffectedGatesSkipped:2}
  ]);
  assert.equal(summary.unrelatedWaitMs,0);
  assert.equal(summary.branchRebuildsForUnrelatedDrift,0);
  assert.equal(summary.changeCount,2);
  assert.equal(summary.platformCost,3);
});
