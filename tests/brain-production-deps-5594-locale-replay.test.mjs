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
  writeFileSync(npm,'#!/bin/sh\nprintf "%s\\n" "$*" >> "$ARGS"\ncase "$*" in *--prefer-online*) printf "%s\\n" "$RETRY_OUTPUT" >&2; exit "$RETRY_EXIT";; esac\nprintf "%s\\n" "$FAKE_OUTPUT" >&2\nexit "$FAKE_EXIT"\n');chmodSync(npm,0o700);
  const args=join(dir,'args');
  for(const [code,output,retryCode,retryOutput,finalCode,expected,attempts] of [
   [0,'secret-fixture',99,'',0,'NPM_INSTALL_SUCCEEDED',1],
   [17,'npm error code ETARGET\nsecret-fixture',0,'secret-fixture',0,'NPM_INSTALL_SUCCEEDED_AFTER_REVALIDATION',2],
   [17,'npm error code ETARGET\nsecret-fixture',19,'npm ERR! code ETARGET\nnpm ERR! code E401',19,'NPM_INSTALL_ERROR_CODES:ETARGET,E401',2],
   [1,'npm error code TOKEN_SECRET\nsecret-fixture',99,'',1,'NPM_INSTALL_ERROR_CODES:UNCLASSIFIED',1],
   [1,'npm error code E401\nsecret-fixture',99,'',1,'NPM_INSTALL_ERROR_CODES:E401',1]
  ]){
   writeFileSync(args,'');
   const r=spawnSync('bash',['-c',shell],{encoding:'utf8',env:{...process.env,PATH:dir+':'+process.env.PATH,ARGS:args,FAKE_OUTPUT:output,FAKE_EXIT:String(code),RETRY_OUTPUT:retryOutput,RETRY_EXIT:String(retryCode),TMPDIR:dir}});
   assert.equal(r.status,finalCode,r.stderr);
   assert.match(r.stdout,new RegExp(expected));
   assert.doesNotMatch(r.stdout+r.stderr,/secret-fixture|TOKEN_SECRET/);
   const calls=readFileSync(args,'utf8').trim().split('\n');
   assert.equal(calls.length,attempts);
   assert.ok(calls.every(call=>call.includes('--ignore-scripts')));
   assert.match(calls[0],/--prefer-offline/);
   if(attempts===2)assert.match(calls[1],/--prefer-online/);
  }
 }finally{rmSync(dir,{recursive:true,force:true});}
});
