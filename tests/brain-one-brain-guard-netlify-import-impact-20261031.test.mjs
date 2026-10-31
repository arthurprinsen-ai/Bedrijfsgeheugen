import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 deriveNetlifyDeploymentApplicability,
 requiresBrainRuntimeAuthenticatedProof,
 NETLIFY_RUNTIME_EXACT,
 classifyNetlifyDeploymentEvidence,
} from '../tools/delivery/netlify-deployment-applicability.mjs';

const SHA='a'.repeat(40);
const sources=[
 'brain/observability/one-loop-guard-diagnostics.mjs',
 'brain/observability/one-loop-assurance-readback.mjs',
];
const policy=JSON.parse(await readFile(new URL('../config/brain-delivery-system.json',import.meta.url),'utf8'));

test('actual Netlify-imported ONE BRAIN guard source requires Netlify and authenticated readback',()=>{
 for(const path of sources){
  assert.equal(NETLIFY_RUNTIME_EXACT.has(path),true,path);
  const x=deriveNetlifyDeploymentApplicability({changedPaths:[path],headSha:SHA,policy});
  assert.equal(x.netlifyRuntimeRequired,true,path);
  assert.equal(x.deploymentRequired,true,path);
  assert.equal(x.reason,'netlify-impact',path);
  assert.equal(requiresBrainRuntimeAuthenticatedProof([path]),true,path);
 }
});

test('guard source release cannot be marked SHA_MATCHED using previous Netlify deploy',()=>{
 const applicability=deriveNetlifyDeploymentApplicability({
  changedPaths:['brain/observability/one-loop-guard-diagnostics.mjs'],
  headSha:SHA,policy
 });
 assert.equal(classifyNetlifyDeploymentEvidence({
  applicability,headSha:SHA,providerCommitSha:'b'.repeat(40),providerState:'ready'
 }).status,'PENDING');
 assert.equal(classifyNetlifyDeploymentEvidence({
  applicability,headSha:SHA,providerCommitSha:SHA,providerState:'ready'
 }).status,'SHA_MATCHED'); // still requires authenticated runtime source/readback
});

test('original route really bundles guard diagnostics; protected portal auth preserved',async()=>{
 const source=await readFile(new URL('../netlify/functions/powerhouse-one-loop-assurance.mjs',import.meta.url),'utf8');
 assert.match(source,/from '\.\.\/\.\.\/brain\/observability\/one-loop-guard-diagnostics\.mjs'/);
 assert.match(source,/isPowerhouseAdmin\(/);
 assert.match(source,/getUser\(/);
 assert.match(source,/UNAUTHENTICATED/);
 assert.match(source,/POWERHOUSE_ADMIN_REQUIRED/);
 assert.match(source,/cache-control':'private, no-store/);
 assert.match(source,/loadOneLoopAssuranceWithDiagnostics/);
 assert.doesNotMatch(source,/fetch\(.*linkedin|publishPost\(|sendEmail\(/);
});

test('backend Supabase-only and documentation-only commits do not force an unrelated Netlify build',()=>{
 for(const path of [
  'supabase/functions/_shared/daily-publication-recovery.mjs',
  'brain/learning/2026-10-31-sample.json',
  'docs/development-ledger-events/2026-10-31-sample.md'
 ]){
  const x=deriveNetlifyDeploymentApplicability({changedPaths:[path],headSha:SHA,policy});
  assert.equal(x.deploymentRequired,false,path);
 }
});
