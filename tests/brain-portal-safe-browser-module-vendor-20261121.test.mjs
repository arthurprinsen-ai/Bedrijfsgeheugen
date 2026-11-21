import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,symlink,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {verifyPortalPublicRuntime} from '../tools/site-shell/verify-targeted-website-routes.mjs';
import {buildPortalPublicRuntime,PUBLIC_PORTAL_BROWSER_SOURCES} from '../tools/ci/build-portal-public-runtime.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
async function fixture(){
  const temporary=await mkdtemp(path.join(tmpdir(),'portal-safe-publish-'));
  const write=async(file,body)=>{
    const out=path.join(temporary,file);
    await mkdir(path.dirname(out),{recursive:true});
    await writeFile(out,body,'utf8');
  };
  for(const source of PUBLIC_PORTAL_BROWSER_SOURCES)
    await write(source,await readFile(path.join(root,source),'utf8'));
  await write('portal-v2/main.js',[
    "import { buildBusinessContext } from '../brain/context/business-context-engine.mjs';",
    "import { deriveOrganismEffects } from '../platform/organism/organism-graph.mjs';",
    'export const mounted=true;'
  ].join('\n'));
  await write('portal-v2/modules/sub.js',
    "import { buildValueDriverGraph } from '../../brain/economics/management-accounting-intelligence.mjs';");
  await write('portal-v2/modules/release-observability.js',
    "import { deriveReleaseStatus } from '../../tools/netlify/release-status.mjs'; export { deriveReleaseStatus };");
  return {temporary,write,clean:()=>rm(temporary,{recursive:true,force:true})};
}
test('single canonical source emits exact allowed public module graph and rewrites only browser imports',async()=>{
  const f=await fixture();
  try{
    const before=await readFile(path.join(f.temporary,'brain/context/business-context-engine.mjs'),'utf8');
    const receipt=await buildPortalPublicRuntime({root:f.temporary});
    assert.equal(receipt.contract,'PUBLIC_PORTAL_READ_ONLY_MODULE_V1');
    assert.equal(receipt.sources.length,8);
    assert.equal(receipt.imports_rewritten,4);
    const rewritten=await readFile(path.join(f.temporary,'portal-v2/main.js'),'utf8');
    assert.match(rewritten,/\.\/browser-runtime\/brain\/context\/business-context-engine\.mjs/);
    assert.match(rewritten,/\.\/browser-runtime\/platform\/organism\/organism-graph\.mjs/);
    const nested=await readFile(path.join(f.temporary,'portal-v2/modules/sub.js'),'utf8');
    assert.match(nested,/\.\.\/browser-runtime\/brain\/economics\/management-accounting-intelligence\.mjs/);
    const classifier=await readFile(path.join(f.temporary,'portal-v2/modules/release-observability.js'),'utf8');
    assert.equal(classifier.includes('../browser-runtime/tools/netlify/release-status.mjs'),true);
    assert.equal(classifier.includes('../../tools/netlify/release-status.mjs'),false);
    const canonicalClassifier=await readFile(path.join(root,'tools/netlify/release-status.mjs'),'utf8');
    const publicClassifier=await readFile(path.join(f.temporary,'portal-v2/browser-runtime/tools/netlify/release-status.mjs'),'utf8');
    assert.equal(publicClassifier,canonicalClassifier,'exact canonical pure classifier, no source fork');
    assert.equal(PUBLIC_PORTAL_BROWSER_SOURCES.includes('tools/netlify/release-status.mjs'),true);
    const publicCode=await readFile(path.join(f.temporary,'portal-v2/browser-runtime/brain/context/business-context-engine.mjs'),'utf8');
    assert.equal(publicCode,before,'no forks or modified canonical Brain calculation logic');
    assert.match(publicCode,/from '\.\/goal-forecast-engine\.mjs'/);
    assert.equal((await stat(path.join(f.temporary,'portal-v2/browser-runtime/brain/context/goal-outcome-learning.mjs'))).isFile(),true);
    const manifest=JSON.parse(await readFile(path.join(f.temporary,'portal-v2/browser-runtime/manifest.json'),'utf8'));
    assert.deepEqual(manifest.blocked_roots,['/brain/*','/platform/*']);
    assert.equal(manifest.original_source_unchanged,true);
  }finally{await f.clean();}
});
test('new private platform/server import fails closed before editing public pages',async()=>{
  const f=await fixture();
  try{
    const source="import {secret} from '../platform/api/portal-authenticated-production-proof-core.mjs';";
    await f.write('portal-v2/unsafe.js',source);
    await assert.rejects(()=>buildPortalPublicRuntime({root:f.temporary}),/PORTAL_BROWSER_PRIVATE_IMPORT_NOT_APPROVED/);
    assert.equal(await readFile(path.join(f.temporary,'portal-v2/unsafe.js'),'utf8'),source);
    await assert.rejects(()=>stat(path.join(f.temporary,'portal-v2/browser-runtime/manifest.json')),{code:'ENOENT'});
  }finally{await f.clean();}
});
test('unreviewed tools module is fail-closed and never copied into public asset output',async()=>{
  const f=await fixture();
  try{
    const unsafe="import {serverToken} from '../../tools/netlify/private-credentials.mjs';";
    await f.write('portal-v2/modules/unreviewed-tools.js',unsafe);
    await assert.rejects(()=>buildPortalPublicRuntime({root:f.temporary}),/PORTAL_BROWSER_PRIVATE_IMPORT_NOT_APPROVED:tools\/netlify\/private-credentials\.mjs/);
    assert.equal(await readFile(path.join(f.temporary,'portal-v2/modules/unreviewed-tools.js'),'utf8'),unsafe);
    await assert.rejects(()=>stat(path.join(f.temporary,'portal-v2/browser-runtime/manifest.json')),{code:'ENOENT'});
  }finally{await f.clean();}
});
test('real original observable portal imports canonical release classifier; private /tools remain denied',async()=>{
  const original=await readFile(path.join(root,'portal-v2/modules/powerhouse-observability.js'),'utf8');
  assert.equal(original.includes("from '../../tools/netlify/release-status.mjs'"),true);
  assert.equal(PUBLIC_PORTAL_BROWSER_SOURCES.filter(x=>x.startsWith('tools/')).length,1);
  const redirects=await readFile(path.join(root,'_redirects'),'utf8');
  assert.equal(redirects.includes('/tools/*'),true);
});
test('symlinked public browser source is rejected without following out-of-tree content',async()=>{
  const f=await fixture();
  try{
    await f.write('portal-v2/private-secret.txt','must never publish');
    await symlink('private-secret.txt',path.join(f.temporary,'portal-v2/injected.js'));
    await assert.rejects(()=>buildPortalPublicRuntime({root:f.temporary}),/PORTAL_BROWSER_PUBLIC_SYMLINK_BLOCKED/);
  }finally{await f.clean();}
});
test('original Netlify build invokes this guard and never opens private route catchalls',async()=>{
  const build=await readFile(path.join(root,'tools/ci/netlify-build-entry.mjs'),'utf8');
  const redirects=await readFile(path.join(root,'_redirects'),'utf8');
  assert.match(build,/\['portal-safe-runtime','tools\/ci\/build-portal-public-runtime\.mjs'\]/);
  assert.match(redirects,/^\/brain\/\*\s+\/404\.html\s+404!/m);
  assert.match(redirects,/^\/platform\/\*\s+\/404\.html\s+404!/m);
  assert.equal(PUBLIC_PORTAL_BROWSER_SOURCES.length,8);
});

test('first-party release readback hashes exact public module bytes and rejects one missing script',async()=>{
  const sources=await Promise.all(PUBLIC_PORTAL_BROWSER_SOURCES.map(async source=>{
    const bytes=await readFile(path.join(root,source));
    return {source,url:'/portal-v2/browser-runtime/'+source,sha256:createHash('sha256').update(bytes).digest('hex'),bytes};
  }));
  const manifest={contract:'PUBLIC_PORTAL_READ_ONLY_MODULE_V1',sources:sources.map(({source,url,sha256})=>({source,url,sha256})),imports_rewritten:4};
  const responses=[];
  const page={request:{get:async url=>{
    const route=new URL(url).pathname;
    responses.push(route);
    if(route.endsWith('/manifest.json'))return {ok:()=>true,json:async()=>manifest,status:()=>200};
    const item=sources.find(x=>x.url===route);
    return item?{ok:()=>true,body:async()=>item.bytes,status:()=>200}:{ok:()=>false,status:()=>404};
  }}};
  assert.deepEqual(await verifyPortalPublicRuntime(page,{baseUrl:'https://www.bedrijfsgeheugen.nl',sourceRoot:root}),{
    contract:'PORTAL_PUBLIC_RUNTIME_PROVEN',count:8
  });
  assert.equal(responses.length,9);
  manifest.sources[0].sha256='f'.repeat(64);
  await assert.rejects(()=>verifyPortalPublicRuntime(page,{baseUrl:'https://www.bedrijfsgeheugen.nl',sourceRoot:root}),/PORTAL_PUBLIC_RUNTIME_SOURCE_IDENTITY_MISMATCH/);
  manifest.sources[0].sha256=sources[0].sha256;
  const missing={request:{get:async url=>{
    if(new URL(url).pathname.endsWith('/manifest.json'))return {ok:()=>false,status:()=>404};
    return {ok:()=>true,status:()=>200};
  }}};
  await assert.rejects(()=>verifyPortalPublicRuntime(missing,{baseUrl:'https://www.bedrijfsgeheugen.nl',sourceRoot:root}),/PORTAL_PUBLIC_RUNTIME_MANIFEST_NOT_LIVE:404/);
});
