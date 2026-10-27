import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { verifyHandoffManifest, publishThroughExistingWriter, contentSha256 } from '../tools/delivery/writer-patch-handoff.mjs';
const SHA='a'.repeat(40), BASE='b'.repeat(40);
const pr={number:4967,headSha:SHA,baseSha:BASE,branch:'fix/4942-backend-continuation-20261026-448bccff'};
const file={path:'tests/approved-test-fixture.mjs',content:'fixed',contentSha256:contentSha256('fixed'),expectedOldSha256:contentSha256('old')};
const manifest={contract:'brain-writer-patch-handoff-v1',prNumber:4967,expectedHead:SHA,expectedBase:BASE,branch:pr.branch,obligation:'system-map-merge-integrity-20261025',files:[file]};
test('deny all until independently authorized path policy is populated',()=>{
 assert.throws(()=>verifyHandoffManifest(manifest,{pr,allowedPaths:[]}),/PATH_NOT_IN_APPROVED_SCOPE/);
 const policy=JSON.parse(readFileSync(new URL('../config/brain-writer-approved-paths.json',import.meta.url),'utf8'));
 assert.deepEqual(policy.paths,[]);
});
test('explicit scope and exact source digests are mandatory',()=>{
 assert.equal(verifyHandoffManifest(manifest,{pr,allowedPaths:[file.path]}).files,1);
 assert.throws(()=>verifyHandoffManifest({...manifest,expectedHead:BASE},{pr,allowedPaths:[file.path]}),/STALE_CANDIDATE/);
 assert.throws(()=>verifyHandoffManifest({...manifest,files:[{...file,path:'.github/workflows/main.yml'}]},{pr,allowedPaths:['.github/workflows/main.yml']}),/PROTECTED_PATH/);
});
test('publisher must not write without a verified lease',async()=>{
 let writes=0;
 await assert.rejects(publishThroughExistingWriter({manifest,pr,allowedPaths:[file.path],readFile:async()=> 'old',verifyLease:async()=>null,applyCas:async()=>{writes++;}}),/EXCLUSIVE_LEASE_NOT_VERIFIED/);
 assert.equal(writes,0);
});
test('publisher rejects stale source and leaves GitHub untouched',async()=>{
 let writes=0;
 await assert.rejects(publishThroughExistingWriter({manifest,pr,allowedPaths:[file.path],readFile:async()=> 'different',verifyLease:async()=>({verified:true,headSha:SHA,generation:10}),applyCas:async()=>{writes++;}}),/SOURCE_DRIFT/);
 assert.equal(writes,0);
});
test('existing workflow is manual only for publication and bound to protected environment',()=>{
 const y=readFileSync(new URL('../.github/workflows/powerhouse-delivery-recovery-supervisor.yml',import.meta.url),'utf8');
 assert.match(y,/authorized-patch-handoff:/);
 assert.match(y,/github\.event_name == 'workflow_dispatch'/);
 assert.match(y,/environment: writer-patch-approval/);
 assert.match(y,/github\.ref == 'refs\/heads\/main'/);
});

test('approved manifest and policy are statically imported from the protected checkout',()=>{
 const entry=readFileSync(new URL('../scripts/ci/authorized-writer-handoff.mjs',import.meta.url),'utf8');
 assert.match(entry,/import manifest from '\.\.\/\.\.\/config\/brain-writer-approved-handoff\.json' with \{ type: 'json' \}/);
 assert.match(entry,/import policy from '\.\.\/\.\.\/config\/brain-writer-approved-paths\.json' with \{ type: 'json' \}/);
 assert.doesNotMatch(entry,/readFileSync|fs\.readFile/);
});
