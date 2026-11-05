import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const driver=fileURLToPath(new URL('../tools/ci/protected-supabase-pr-migration-tests.mjs',import.meta.url));
const historical='20261105132000_original_data_spine_same_tick_stage_receipts_v1.sql';
const proposed='20261105134200_original_data_spine_decision_receipt_same_tick_v1.sql';
const tests=Array.from({length:5},(_,i)=>'tests/source-parity-'+i+'.test.mjs');
const g=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();

function fixture(){
  const root=mkdtempSync(path.join(tmpdir(),'protected-migration-gate-'));
  mkdirSync(path.join(root,'supabase','migrations'),{recursive:true});
  mkdirSync(path.join(root,'tests'),{recursive:true});
  g(root,'init','-q');
  g(root,'config','user.email','ci@example.test');
  g(root,'config','user.name','CI');
  writeFileSync(path.join(root,'supabase','migrations',historical),'select 1;\n');
  writeFileSync(path.join(root,'supabase','migration-history.lock.json'),JSON.stringify({
    source:'supabase_migration_history',
    project_ref:'adhjwmvyoixzjtmiroln',
    applied:[{version:historical.slice(0,14),name:historical.slice(15,-4)}]
  })+'\n');
  for(const t of tests)writeFileSync(path.join(root,t),
    "import test from 'node:test'; import assert from 'node:assert/strict'; import {readdirSync} from 'node:fs'; "+
    "test('only applied provider SQL in strict baseline',()=>assert.equal(readdirSync('supabase/migrations').filter(x=>x.endsWith('.sql')).length,1));\n");
  g(root,'add','.');g(root,'commit','-qm','baseline');
  const base=g(root,'rev-parse','HEAD');
  return {root,base};
}
function check(root,base){
  return spawnSync(process.execPath,[driver,...tests],{
    cwd:root,encoding:'utf8',env:{...process.env,CANDIDATE_BASE_SHA:base,CANDIDATE_EVENT_NAME:'pull_request',CANDIDATE_PR_NUMBER:'1'}
  });
}

test('exact provider baseline passes, and one genuine PR-only migration is admitted without a false applied claim',()=>{
  const {root,base}=fixture();
  try{
    let out=check(root,base);
    assert.equal(out.status,0,out.stderr);
    assert.match(out.stdout,/EXACT_PROVIDER_BASELINE_PARITY/);
    writeFileSync(path.join(root,'supabase','migrations',proposed),'create table if not exists private_test(id integer);\n');
    g(root,'add','.');g(root,'commit','-qm','new unapplied migration candidate');
    out=check(root,base);
    assert.equal(out.status,0,out.stdout+'\n'+out.stderr);
    assert.match(out.stdout,/PROPOSED_SOURCE_ONLY_PREVIEW_REQUIRED/);
    assert.match(out.stdout,/"hosted_preview_pass_claim":false/);
    assert.ok(readFileSync(path.join(root,'supabase','migrations',proposed),'utf8').includes('create table'));
  } finally {rmSync(root,{recursive:true,force:true});}
});

test('comment-only shim and tampering with already-applied SQL remain fail-closed',()=>{
  const {root,base}=fixture();
  try{
    writeFileSync(path.join(root,'supabase','migrations',proposed),'-- empty placeholder\n');
    g(root,'add','.');g(root,'commit','-qm','unsafe placeholder');
    assert.notEqual(check(root,base).status,0,'comment-only migration must fail');
    writeFileSync(path.join(root,'supabase','migrations',proposed),'create table private_test(id integer);\n');
    writeFileSync(path.join(root,'supabase','migrations',historical),'select 2;\n');
    g(root,'add','.');g(root,'commit','-qm','unsafe rewrite of applied source');
    assert.notEqual(check(root,base).status,0,'historically applied SQL must remain immutable');
  } finally {rmSync(root,{recursive:true,force:true});}
});

test('required premerge step runs the source-admission driver, retains existing historical tests and hosted preview lane',()=>{
  const workflow=readFileSync(new URL('../.github/workflows/required-test.yml',import.meta.url),'utf8');
  assert.match(workflow,/Enforce Supabase migration lock parity before merge/);
  assert.match(workflow,/node tools\/ci\/protected-supabase-pr-migration-tests\.mjs/);
  assert.match(workflow,/supabase_preview:|supabase_preview_required:/);
  assert.match(workflow,/tests\/brain-migration-lock-pr-gate-20261105\.test\.mjs/);
});
