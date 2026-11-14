import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,chmodSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const workflow=readFileSync('.github/workflows/supabase-edge-production-authority.yml','utf8');
const begin=workflow.indexOf('          download_with_bounded_auth_recovery() {');
const finish=workflow.indexOf('\n          }\n          for attempt in $(seq 1 24); do',begin);
assert.ok(begin>=0 && finish>begin,'existing protected-main auth readback function not found');
const shellFunction=workflow.slice(begin,finish+'\n          }'.length);

const fakeSupabase=String.raw`#!/bin/sh
count=0
if [ -f "$COUNT_FILE" ]; then count="$(cat "$COUNT_FILE")"; fi
count=$((count+1))
printf '%s' "$count" > "$COUNT_FILE"
if [ "$MODE" = "permanent" ] || { [ "$MODE" = "transient" ] && [ "$count" -eq 1 ]; }; then
  echo 'Error status 401: {"message":"Invalid access token"}'
  exit 1
fi
if [ "$MODE" = "unavailable" ]; then
  echo 'Error status 503: retry later'
  exit 1
fi
echo 'Downloaded Function.'
`;

function run(mode){
  const tmp=mkdtempSync(join(tmpdir(),'pw-edge-401-'));
  try{
    mkdirSync(join(tmp,'bin'));
    mkdirSync(join(tmp,'root'));
    const bin=join(tmp,'bin');
    writeFileSync(join(bin,'supabase'),fakeSupabase);
    writeFileSync(join(bin,'sleep'),'#!/bin/sh\nexit 0\n');
    chmodSync(join(bin,'supabase'),0o755);
    chmodSync(join(bin,'sleep'),0o755);
    const countFile=join(tmp,'count');
    const shell='set -euo pipefail\n'+shellFunction+'\ndownload_with_bounded_auth_recovery "source-only" "$ROOT"\n';
    const result=spawnSync('bash',['-c',shell],{
      encoding:'utf8',
      env:{...process.env,PATH:bin+':'+process.env.PATH,COUNT_FILE:countFile,MODE:mode,ROOT:join(tmp,'root'),PROJECT_REF:'fake-read-only-test'}
    });
    return {status:result.status,output:(result.stdout||'')+(result.stderr||''),count:Number(readFileSync(countFile,'utf8'))};
  }finally{
    rmSync(tmp,{recursive:true,force:true});
  }
}

test('normal authenticated provider readback makes only one exact function request',()=>{
  const x=run('ok');
  assert.equal(x.status,0,x.output);
  assert.equal(x.count,1);
});

test('one isolated 401 is rechecked on the SAME function, not treated as expired token',()=>{
  const x=run('transient');
  assert.equal(x.status,0,x.output);
  assert.equal(x.count,2);
  assert.match(x.output,/SUPABASE_EDGE_TRANSIENT_401_RECHECK/);
});

test('persistent 401 fails closed after three attempts; neither release nor secret is bypassed',()=>{
  const x=run('permanent');
  assert.equal(x.status,78,x.output);
  assert.equal(x.count,3);
  assert.match(x.output,/SUPABASE_ACCESS_TOKEN_INVALID_REAUTH_REQUIRED/);
  assert.doesNotMatch(workflow,/supabase functions deploy/);
});

test('non-auth provider failures return to original bounded source convergence owner',()=>{
  const x=run('unavailable');
  assert.equal(x.status,1,x.output);
  assert.equal(x.count,1);
  assert.doesNotMatch(x.output,/INVALID_REAUTH_REQUIRED/);
});
