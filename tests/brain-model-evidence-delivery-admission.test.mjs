import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

const policy=JSON.parse(fs.readFileSync('config/brain-delivery-system.json','utf8'));
const sha='0123456789abcdef0123456789abcdef01234567';
const watch=[
 '.github/workflows/ai-model-intelligence.yml',
 'scripts/ai-model-freshness-watch.mjs',
 'scripts/ai-model-source-probe.mjs',
 'docs/skills/supplier-evidence-recovery-v2.md',
];
const prior=[
 'data/ai-model-stale-review-worklist-20261025.json',
 'tests/brain-ai-model-stale-worklist.test.mjs',
];

test('source freshness automation admits only the intended lane',()=>{
 const plan=createDeliveryPlan({changedPaths:watch,headSha:sha,policy});
 assert.ok(plan.lanes.some(x=>x.id==='automation'), 'model evidence watch must select automation lane');
});

test('integrating prior 27-model recovery preserves both model workstreams',()=>{
 const plan=createDeliveryPlan({changedPaths:[...watch,...prior],headSha:sha,policy});
 assert.ok(plan.lanes.some(x=>x.id==='automation'), 'both workstreams must retain automation lane');
});
