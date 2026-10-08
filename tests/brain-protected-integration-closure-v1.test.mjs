import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileClosurePlan} from '../tools/delivery/integration-bundle-compiler.mjs';
const policy=JSON.parse(readFileSync('config/powerhouse-integration-bundle-v1.json','utf8'));

test('protected required hygiene denies material changes lacking any closure artifact',()=>{
 const workflow=readFileSync('.github/workflows/powerhouse-delivery-hygiene.yml','utf8');
 assert.match(workflow,/name: Enforce canonical integration closure at protected admission/);
 assert.match(workflow,/if: steps\.admit\.outputs\.admitted == 'true'/);
 assert.match(workflow,/compileClosurePlan/);
 assert.match(workflow,/evaluateMaterialWritebackClosure/,'required gate must validate semantic learning, not only file names');
 assert.match(workflow,/INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE/);
 assert.match(workflow,/obligationId:evidence\.obligationId\|\|evidence\.obligation_id/,'preserve runtime-only content publication authority');
});

test('integration closure requires Brain learning, human documentation and append-only ledger for material change',()=>{
 const required=['tools/delivery/integration-bundle-compiler.mjs'];
 const bad=compileClosurePlan({changedPaths:required,policy});
 assert.equal(bad.ready,false);
 assert.deepEqual(bad.missing,['activity_ledger','brain_learning','human_documentation']);
 const complete=compileClosurePlan({changedPaths:[...required,'brain/learning/one-brain.json','docs/changes/one-brain.md','docs/development-ledger-events/one-brain.md'],policy});
 assert.equal(complete.ready,true);
});

test('protected hygiene emits actionable GitHub error annotations and passes configuration watch',async()=>{
 const {spawnSync}=await import('node:child_process');
 const watcher=spawnSync('python3',['tools/config-wacht.py'],{encoding:'utf8'});
 assert.equal(watcher.status,0,watcher.stdout+'\n'+watcher.stderr);
 const workflow=readFileSync('.github/workflows/powerhouse-delivery-hygiene.yml','utf8');
 assert.match(workflow,/::error::LEARNING_CANONICALIZATION_BLOCKED/);
 assert.match(workflow,/::error::INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE/);
});
