import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const workflow=readFileSync('.github/workflows/unified-brain-delivery.yml','utf8');
const marker='PR_JSON="$pr" LANDING_MAIN_SHA="$landing_main_sha" HEAD_SHA="$HEAD_SHA" PR_NUMBER="$PR_NUMBER" node --input-type=module - <<\'NODE\'';
const tail=workflow.split(marker)[1];
assert.ok(tail,'original terminal provider payload consumer must exist');
const script=tail.split('\n          NODE')[0].replace(/^\n/,'');
const A='a'.repeat(40),B='b'.repeat(40);
const good={behind_by:0,status:'ahead',base_commit:{sha:A},merge_base_commit:{sha:A}};
function execute(compare){
 const dir=mkdtempSync(join(tmpdir(),'bg169-ancestry-'));
 try{
  const names={'compare':compare,'check-runs':{check_runs:[]},status:{statuses:[]},'open-prs':[],'main-branch':{}};
  for(const [name,value] of Object.entries(names))writeFileSync(join(dir,'bg169-'+name+'.json'),JSON.stringify(value));
  const code=script.replaceAll('/tmp/bg169-',dir+'/bg169-');
  const r=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8',env:{...process.env,PR_JSON:'{}',LANDING_MAIN_SHA:A,HEAD_SHA:B,PR_NUMBER:'123'}});
  return {status:r.status,stderr:r.stderr,payload:r.status===0?JSON.parse(readFileSync(join(dir,'bg169-terminal-guard.json'),'utf8')):null};
 }finally{rmSync(dir,{recursive:true,force:true});}
}
test('BG169 forwards exact native numeric ancestry and rejects null, strings and malformed provider facts',()=>{
 assert.equal(execute(good).payload?.behindBy,0);
 for(const value of [null,undefined,'0',false,-1,0.5,{},[]]){
  const r=execute({...good,behind_by:value});
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/BG169_MAIN_ANCESTRY_UNVERIFIED/);
 }
 assert.equal(execute({...good,behind_by:2,status:'diverged'}).payload?.behindBy,2);
});
test('BG169 rejects mismatched or contradictory exact provider compare identity before terminal guard',()=>{
 for(const fixture of [{...good,base_commit:{sha:B}},{...good,base_commit:null}]){
  assert.match(execute(fixture).stderr,/BG169_COMPARE_BASE_SHA_MISMATCH/);
 }
 for(const fixture of [{...good,merge_base_commit:{sha:B}},{...good,status:'diverged'},{...good,status:'behind'}]){
  assert.match(execute(fixture).stderr,/BG169_COMPARE_ANCESTRY_CONTRADICTION/);
 }
});
