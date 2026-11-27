// Canonical learning replay: run the original locale source-contract tests, without filtering or skips.
import './site-shell-static-locales.test.mjs';

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync,chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

test('canonical npm diagnostics retain failure and lifecycle guard without exposing raw log',()=>{
 const workflow=readFileSync('.github/workflows/required-test.yml','utf8');
 const step=workflow.split('      - name: Install runtime dependencies for the unwired contracts\n')[1].split('\n      - name: ')[0];
 const shell=step.split('        run: |\n')[1].split('\n').map(line=>line.slice(10)).join('\n');
 assert.match(shell,/npm install --ignore-scripts --prefer-offline --no-audit --no-fund --loglevel=error/);
 const dir=mkdtempSync(join(tmpdir(),'bg-npm-diagnostic-'));
 try{
  const npm=join(dir,'npm');
  writeFileSync(npm,'#!/bin/sh\nprintf "%s\\n" "$*" > "$ARGS"\nprintf "%s\\n" "$FAKE_OUTPUT" >&2\nexit "$FAKE_EXIT"\n');chmodSync(npm,0o700);
  const args=join(dir,'args');
  for(const [code,output,expected] of [[0,'secret-fixture','NPM_INSTALL_SUCCEEDED'],[17,'npm error code ETARGET\nsecret-fixture\nnpm ERR! code E401','NPM_INSTALL_ERROR_CODES:ETARGET,E401'],[1,'npm error code TOKEN_SECRET\nsecret-fixture','NPM_INSTALL_ERROR_CODES:UNCLASSIFIED']]){
   const r=spawnSync('bash',['-c',shell],{encoding:'utf8',env:{...process.env,PATH:dir+':'+process.env.PATH,ARGS:args,FAKE_OUTPUT:output,FAKE_EXIT:String(code),TMPDIR:dir}});
   assert.equal(r.status,code,r.stderr);
   assert.match(r.stdout,new RegExp(expected));
   assert.doesNotMatch(r.stdout+r.stderr,/secret-fixture|TOKEN_SECRET/);
   assert.match(readFileSync(args,'utf8'),/--ignore-scripts/);
  }
 }finally{rmSync(dir,{recursive:true,force:true});}
});
