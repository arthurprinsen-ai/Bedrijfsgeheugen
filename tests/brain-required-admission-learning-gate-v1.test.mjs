import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileLearningEvaluationPlan,validateEvaluationContract} from '../scripts/brain/learning-canonicalization-gate.mjs';

test('protected admission checks learning canonicalization before it reports hygiene success',()=>{
 const yaml=readFileSync('.github/workflows/powerhouse-delivery-hygiene.yml','utf8');
 assert.match(yaml,/name: Require canonical learning evidence at protected admission/);
 assert.match(yaml,/if: steps\.admit\.outputs\.admitted == 'true'/);
 assert.match(yaml,/POWERHOUSE_BASE_SHA=.*POWERHOUSE_HEAD_SHA=.*node scripts\/brain\/learning-canonicalization-gate\.mjs/);
 const gate=yaml.indexOf('Require canonical learning evidence at protected admission');
 const upload=yaml.indexOf('Upload admission evidence');
 assert.ok(gate>0&&gate<upload,'learning must gate the required hygiene job');
});

test('one-brain impact learning is compiler-compatible, historically replayable and not falsely declared live',()=>{
 const r=JSON.parse(readFileSync('brain/learning/2026-10-08-one-brain-portal-change-impact-enforcement-v1.json','utf8'));
 const plan=compileLearningEvaluationPlan(r);
 const out=validateEvaluationContract(r,plan);
 assert.deepEqual(out.required_modes,['historical_replay']);
 assert.equal(r.status,'CANDIDATE_NOT_PRODUCTION_VERIFIED');
 assert.ok(out.tests_by_mode.historical_replay.length>0);
});
