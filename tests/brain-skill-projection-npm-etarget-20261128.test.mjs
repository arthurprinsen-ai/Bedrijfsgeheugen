import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,chmodSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const workflow=readFileSync('.github/workflows/powerhouse-skill-projection.yml','utf8');
const step=workflow.split('      - name: Install projection-test dependencies\n')[1].split('      - name: Evaluate changed learning before canonicalization')[0];
const shell=step.split('        run: |\n')[1]?.trimEnd().split('\n').map(l=>l.startsWith('          ')?l.slice(10):l).join('\n');
for(const [scenario,status,calls] of [['ok',0,1],['stale',0,2],['missing',1,2],['network',17,1],['auth',9,1]]){
 test('projection npm exact recovery: '+scenario,()=>{
  assert.ok(shell,'projection install must expose bounded explicit shell');
  const dir=mkdtempSync(join(tmpdir(),'projection-npm-'));
  try{
   const trace=join(dir,'trace');
   const mock=join(dir,'npm');
   writeFileSync(mock, `#!/bin/bash
printf '%s\\n' "$*" >> "$TRACE"
case "$SCENARIO:$*" in
 ok:*) exit 0 ;;
 stale:*--prefer-offline*) echo 'npm error code ETARGET'; exit 1 ;;
 stale:*--prefer-online*) exit 0 ;;
 missing:*) echo 'npm error code ETARGET'; echo 'DO_NOT_PRINT_RAW_LOG_TEST'; exit 1 ;;
 network:*) echo 'npm error code EAI_AGAIN'; echo 'DO_NOT_PRINT_RAW_LOG_TEST'; exit 17 ;;
 auth:*) echo 'npm error code E401'; exit 9 ;;
esac
exit 99
`);chmodSync(mock,0o755);
   const r=spawnSync('bash',['-c',shell],{encoding:'utf8',env:{...process.env,PATH:dir+':'+process.env.PATH,TRACE:trace,SCENARIO:scenario}});
   assert.equal(r.status,status,r.stdout+r.stderr);
   const lines=readFileSync(trace,'utf8').trim().split('\n');
   assert.equal(lines.length,calls);
   assert.ok(lines.every(l=>l.includes('--ignore-scripts')&&l.includes('--no-audit')&&l.includes('--no-fund')));
   assert.ok(lines[0].includes('--prefer-offline'));
   if(calls===2)assert.ok(lines[1].includes('--prefer-online'));
   assert.doesNotMatch(r.stdout+r.stderr,/DO_NOT_PRINT_RAW_LOG_TEST/);
  } finally {rmSync(dir,{recursive:true,force:true});}
 });
}
