import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdtempSync,mkdirSync,writeFileSync,unlinkSync,existsSync,readFileSync as readFixture,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {classifyGitHubAdmissionReadError} from '../tools/delivery/github-admission-rate-limit.mjs';

test('actual installation rate limit 403 is deferred, never blindly retried or mislabeled as permission error',()=>{
 const error={message:'Command failed: gh api pulls',stderr:'gh: API rate limit exceeded for installation (HTTP 403)'};
 const r=classifyGitHubAdmissionReadError(error);
 assert.equal(r.state,'CONTROL_PLANE_RATE_LIMITED');
 assert.equal(r.fingerprint,'github-installation-api-rate-limited-v1');
 assert.equal(r.retry_immediately,false);
 assert.equal(r.next_action,'DEFER_TO_EXISTING_BOUNDED_WATCHDOG_AFTER_RATE_RESET');
 assert.equal(r.category,'PROVIDER_READ_CAPACITY');
});

test('secondary rate limits and 429 also stop immediate API loops',()=>{
 for(const msg of [
  'You have exceeded a secondary rate limit. (HTTP 403)',
  'gh: API rate limit exceeded (HTTP 403)',
  'HTTPError: 429 Too Many Requests',
  'gh: You have triggered an abuse detection mechanism.'
 ]){
  const p=classifyGitHubAdmissionReadError({message:msg});
  assert.equal(p.state,'CONTROL_PLANE_RATE_LIMITED',msg);
  assert.equal(p.retry_immediately,false);
 }
});

test('ordinary 403, branch conflicts, security and malformed scope remain genuine control-plane errors',()=>{
 for(const msg of [
  'HTTP 403: Resource not accessible by integration',
  'HTTP 403 forbidden',
  'PR_HEAD_SHA_DRIFT',
  'SECURITY_STATIC_FAILED',
  'WRITER_LEASE_CONFLICT',
  'gh: Not Found (HTTP 404)'
 ]){
  const x=classifyGitHubAdmissionReadError({message:msg});
  assert.equal(x.state,'CONTROL_PLANE_ADMISSION_ERROR',msg);
  assert.equal(x.fingerprint,'delivery-hygiene-admission-error-v1');
  assert.equal(x.retry_immediately,false);
 }
});

test('bounded transport failures keep existing short read retries, not automatic write authority',()=>{
 for(const msg of ['HTTP 503 Service Unavailable','ETIMEDOUT','socket hang up','upstream connect error']){
  const r=classifyGitHubAdmissionReadError({message:msg});
  assert.equal(r.state,'CONTROL_PLANE_API_UNAVAILABLE');
  assert.equal(r.retry_immediately,true);
  assert.equal(r.next_action,'EXISTING_BOUNDED_READ_RETRY');
 }
});

test('the original protected workflow consumes the helper and keeps the two required gates',()=>{
 const file=readFileSync('.github/workflows/powerhouse-delivery-hygiene.yml','utf8');
 assert.match(file,/classifyGitHubAdmissionReadError/);
 assert.match(file,/const transientApiFailure = error => classifyGitHubAdmissionReadError\(error\)\.retry_immediately/);
 assert.match(file,/failure_fingerprint: classifyGitHubAdmissionReadError\(error\)\.fingerprint/);
 assert.match(file,/provider_recovery: classifyGitHubAdmissionReadError\(error\)\.next_action/);
 assert.match(file,/const state = classifyGitHubAdmissionReadError\(error\)\.state/);
 assert.match(file,/Require canonical learning evidence at protected admission/);
 assert.match(file,/Enforce canonical integration closure at protected admission/);
 assert.doesNotMatch(file,/retry_immediately=true|sleep\(10000\)|sleep\(60000\)/);
});


test('immutable workflow classifier remains available for older PR heads; invalid pins stay red',async()=>{
 const workflow=readFileSync('.github/workflows/powerhouse-delivery-hygiene.yml','utf8');
 assert.match(workflow,/TRUSTED_WORKFLOW_SHA:\s*\$\{\{ github\.workflow_sha \}\}/);
 assert.match(workflow,/pathToFileURL\(process\.env\.TRUSTED_ADMISSION_CLASSIFIER\)/);
 assert.doesNotMatch(workflow,/import \{ classifyGitHubAdmissionReadError \} from '\.\/tools\/delivery\/github-admission-rate-limit\.mjs'/);
 const match=workflow.match(/          # BEGIN TRUSTED_ADMISSION_POLICY_SOURCE\n([\s\S]*?)          # END TRUSTED_ADMISSION_POLICY_SOURCE/);
 assert.ok(match,'immutable pin script is present');
 const sourceScript=match[1].split('\n').map(line=>line.startsWith('          ')?line.slice(10):line).join('\n');
 const tmp=mkdtempSync(join(tmpdir(),'admission-immutable-pin-'));
 const cwd=join(tmp,'candidate');
 mkdirSync(cwd);
 const git=(...args)=>execFileSync('git',args,{cwd,encoding:'utf8',env:{...process.env,GIT_AUTHOR_NAME:'CI Fixture',GIT_AUTHOR_EMAIL:'ci@example.invalid',GIT_COMMITTER_NAME:'CI Fixture',GIT_COMMITTER_EMAIL:'ci@example.invalid'}}).trim();
 try {
   git('init','-q');
   const helper=join(cwd,'tools','delivery','github-admission-rate-limit.mjs');
   mkdirSync(dirname(helper),{recursive:true});
   writeFileSync(helper,readFileSync('tools/delivery/github-admission-rate-limit.mjs','utf8'));
   git('add','.');
   git('commit','-qm','trusted workflow classifier');
   const pinnedSha=git('rev-parse','HEAD');
   // Reproduce an older checkout without the newly introduced classifier.
   git('rm','-q','tools/delivery/github-admission-rate-limit.mjs');
   git('commit','-qm','older candidate head');
   assert.equal(existsSync(helper),false);
   const outputs=join(tmp,'github-output');
   const env={...process.env,TRUSTED_WORKFLOW_SHA:pinnedSha,RUNNER_TEMP:tmp,GITHUB_OUTPUT:outputs,EXPECTED_HEAD_SHA:git('rev-parse','HEAD')};
   const result=spawnSync('bash',['-e','-c',sourceScript],{cwd,env,encoding:'utf8'});
   assert.equal(result.status,0,result.stderr);
   const trusted=join(tmp,'powerhouse-trusted-admission-'+pinnedSha+'.mjs');
   assert.equal(readFixture(trusted,'utf8'),readFileSync('tools/delivery/github-admission-rate-limit.mjs','utf8'));
   const {classifyGitHubAdmissionReadError:classify}=await import(pathToFileURL(trusted).href);
   assert.equal(classify({message:'gh: API rate limit exceeded for installation (HTTP 403)'}).state,'CONTROL_PLANE_RATE_LIMITED');
   assert.equal(classify({message:'HTTP 403 Resource not accessible by integration'}).state,'CONTROL_PLANE_ADMISSION_ERROR');
   const bad=spawnSync('bash',['-e','-c',sourceScript],{cwd,env:{...env,TRUSTED_WORKFLOW_SHA:'untrusted-ref'},encoding:'utf8'});
   assert.equal(bad.status,78);
   assert.match(readFixture(join(cwd,'.artifacts','powerhouse-delivery-hygiene.json'),'utf8'),/CONTROL_PLANE_POLICY_SOURCE_UNAVAILABLE/);
   assert.match(readFixture(outputs,'utf8'),/admitted=false/);
 }finally{
   rmSync(tmp,{recursive:true,force:true});
 }
});
