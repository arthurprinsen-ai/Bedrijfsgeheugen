import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {verifyPortalCanonicalBrowserRelease} from '../tools/ci/portal-canonical-browser-release-fence.mjs';

const expectedSha='481c2903ceba2f4e9163f62a4ec8925468b21a3b';
const expectedDeployId='6ae3435d4b10026685b95242';
const immutableUrl='https://'+expectedDeployId+'--bedrijfsgeheugen.netlify.app';
const canonicalUrl='https://www.bedrijfsgeheugen.nl';
const good={commit_ref:expectedSha,deploy_id:expectedDeployId,contract:'BRAIN-DELIVERY-v2',context:'production'};
const response=(body=good,status=200)=>({ok:status===200,status,json:async()=>body});

test('real canonical main browser target is permitted only after both independent exact manifest identities match',async()=>{
 const visited=[];
 const result=await verifyPortalCanonicalBrowserRelease({immutableUrl,expectedSha,expectedDeployId,
  fetchImpl:async(url,options)=>{visited.push([url,options]);return response();}});
 assert.deepEqual({...result},{browserUrl:canonicalUrl,sha:expectedSha,deployId:expectedDeployId,independentManifests:2});
 assert.equal(visited.length,2);
 assert.ok(visited[0][0].startsWith(immutableUrl+'/release.json?'));
 assert.ok(visited[1][0].startsWith(canonicalUrl+'/release.json?'));
 assert.ok(visited.every(([,options])=>options.cache==='no-store'&&options.headers['cache-control']==='no-cache'));
});
test('a hostile lookalike hostname is not the canonical exact origin',()=>{
  assert.notEqual(new URL('https://www.bedrijfsgeheugen.nl.evil.example/release.json').origin,canonicalUrl);
});
test('a drifting public main SHA is a hard failure (no screenshot or auth gate bypass)',async()=>{
 await assert.rejects(()=>verifyPortalCanonicalBrowserRelease({immutableUrl,expectedSha,expectedDeployId,
  fetchImpl:async url=>response(new URL(url).origin===canonicalUrl?{...good,commit_ref:'f'.repeat(40)}:good)}),
  /PORTAL_BROWSER_RELEASE_SHA_OR_DEPLOY_MISMATCH/);
});
test('wrong immutable deploy ID, unauthorized access, or incomplete provider identity fails closed',async()=>{
 await assert.rejects(()=>verifyPortalCanonicalBrowserRelease({immutableUrl:canonicalUrl,expectedSha,expectedDeployId,
  fetchImpl:async()=>response()}),/IDENTITY_INPUT_INVALID/);
 await assert.rejects(()=>verifyPortalCanonicalBrowserRelease({immutableUrl,expectedSha,expectedDeployId,
  fetchImpl:async()=>response(null,403)}),/NOT_HTTP_200/);
 await assert.rejects(()=>verifyPortalCanonicalBrowserRelease({immutableUrl,expectedSha,expectedDeployId,
  fetchImpl:async()=>response({...good,deploy_id:'other'})}),/SHA_OR_DEPLOY_MISMATCH/);
});
test('actual workflow keeps immutable manifest check, strict browser checks, and before/after identity fences',()=>{
 const workflow=fs.readFileSync('.github/workflows/portal-v2-production-dom-readback.yml','utf8');
 assert.match(workflow,/Wait for exact deployed SHA and pin immutable deploy/);
 assert.match(workflow,/Pin canonical production browser host to exact immutable release identity/);
 assert.match(workflow,/Reverify canonical browser release after browser\/visual readbacks/);
 assert.match(workflow,/node tools\/ci\/portal-canonical-browser-release-fence\.mjs --verify/g);
 assert.match(workflow,/PRODUCTION_URL: \$\{\{ env\.PORTAL_BROWSER_READBACK_URL \}\}/);
 assert.match(workflow,/PREVIEW_URL: \$\{\{ env\.PORTAL_BROWSER_READBACK_URL \}\}/);
 assert.match(workflow,/npx playwright test tests\/integration\/portal-v2-production-\*\.spec\.js --workers=1/);
 assert.doesNotMatch(workflow,/continue-on-error:\s*true/);
});
