import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {verifyOriginalParentAncestry,verifyOriginalInnovationLearningClosure} from '../scripts/brain/innovation-original-code-delivery.mjs';
const parent='722468c45cd3646755d79188a06dfb187468a946',main='cb0ff42d90f15e5d9670eb1572ca90305e2fc703';
const pr={mergeCommit:{oid:parent}};
const comparison={status:'ahead',behind_by:0,base_commit:{sha:parent},merge_base_commit:{sha:parent}};
test('exact historical parent is independently contained in main; malformed or diverged ancestry fails closed',()=>{
  assert.equal(verifyOriginalParentAncestry({pr,mainSha:main,comparison}),true);
  for(const c of [{...comparison,status:'diverged'},{...comparison,behind_by:1},{...comparison,base_commit:{sha:main}},{...comparison,merge_base_commit:{sha:main}},{...comparison,behind_by:undefined}])
    assert.equal(verifyOriginalParentAncestry({pr,mainSha:main,comparison:c}),false);
  assert.equal(verifyOriginalParentAncestry({pr,mainSha:'bad',comparison}),false);
  assert.equal(verifyOriginalParentAncestry({pr:{},mainSha:main,comparison}),false);
});
test('actual original semantic admission failure is caught before PR generation, corrected record passes',()=>{
  const root=mkdtempSync(join(tmpdir(),'innovation-closure-'));
  try{
    const paths=['scripts/brain/publish_approved_blog_v2_core.py','brain/learning/2026-11-24-innovation-fixture.json','docs/changes/fixture.md','docs/development-ledger-events/fixture.md'];
    for(const p of paths){mkdirSync(dirname(join(root,p)),{recursive:true});writeFileSync(join(root,p),'fixture');}
    const record={fingerprint:'approved-blog|stale-queue|first-page-only|20261124-v1',compiler:{failure_class:'QUEUE_STALL'},root_cause:'Continuation discarded',evaluation:{historical_replay:['tests/brain-innovation-fixture.test.mjs']},evidence:{fixture_only:true}};
    const file=join(root,paths[1]);
    writeFileSync(file,JSON.stringify(record));
    assert.throws(()=>verifyOriginalInnovationLearningClosure({changedPaths:paths,rootDir:root}),/MATERIAL_CLOSURE_REQUIRED.*prevention/);
    writeFileSync(file,JSON.stringify({...record,prevention:{follow_cursor:true}}));
    assert.equal(verifyOriginalInnovationLearningClosure({changedPaths:paths,rootDir:root}).ok,true);
    const missingEvidence={...record,prevention:{follow_cursor:true}};delete missingEvidence.evidence;
    writeFileSync(file,JSON.stringify(missingEvidence));
    assert.throws(()=>verifyOriginalInnovationLearningClosure({changedPaths:paths,rootDir:root}),/MATERIAL_CLOSURE_REQUIRED.*evidence/);
    assert.throws(()=>verifyOriginalInnovationLearningClosure({changedPaths:paths.filter(p=>!p.includes('development-ledger')),rootDir:root}),/MATERIAL_CLOSURE_REQUIRED.*activity_ledger/);
  }finally{rmSync(root,{recursive:true,force:true});}
});
test('original live writer invokes both canonical guards before publishing the candidate',()=>{
  const src=readFileSync('scripts/brain/innovation-original-code-delivery.mjs','utf8');
  assert.match(src,/return verifyOriginalParentAncestry\(\{pr,mainSha,comparison\}\)/);
  assert.match(src,/verifyOriginalInnovationLearningClosure\(\{changedPaths:result.changed\}\);\s*for\(const path of result.learn\)/);
  const wf=readFileSync('.github/workflows/powerhouse-daily-self-evolution.yml','utf8');
  assert.ok(wf.indexOf('--validate')<wf.indexOf('Publish only the validated code candidate'));
});
