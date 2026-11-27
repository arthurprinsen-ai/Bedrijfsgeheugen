import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {classifyOriginalBrainFlightPages} from '../tools/delivery/brain-verification-flight-index.mjs';

// Existing historical suite remains the authority; this canonical entrypoint
// makes its actual regressions executable by the ONE BRAIN learning gate.
import './github-delivery-state-machine-terminal-closure.test.mjs';

test('original terminal extra contract never falls back to first 100 BRAIN runs',()=>{
  const closure=readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');
  const tail=closure.split('name: Verify exact-head critical delivery gates before terminal claim')[1]
    ?.split('name: Require explicit Supabase Edge Function provider readback before terminal claim')[0];
  assert.ok(tail,'same original final terminal acceptance gate exists');
  assert.match(tail,/originalBrainFlightSince/);
  assert.match(tail,/gh api --paginate --slurp "\$query"/);
  assert.match(tail,/brain-verification-flight-index\.mjs --title "\$expected_title" --since "\$since"/);
  assert.match(tail,/TERMINAL_BRAIN_WORKFLOW_SOURCE_NOT_PROTECTED_MAIN/);
  assert.match(tail,/TERMINAL_CRITICAL_GATE_FAILED/);
  assert.doesNotMatch(tail,/runs\?branch=main&event=workflow_dispatch&per_page=100/);
  const sha='a'.repeat(40);
  const title='BRAIN delivery PR #5825 '+sha;
  const rows=Array.from({length:206},(_,i)=>({
    id:1000+i,created_at:'2026-11-15T08:54:05Z',head_branch:'main',
    event:'workflow_dispatch',status:'completed',conclusion:'success',
    display_title:i===205?title:'BRAIN delivery PR #9999 '+('b'.repeat(40))
  }));
  const pages=Array.from({length:3},(_,i)=>({
    total_count:206,workflow_runs:rows.slice(i*100,(i+1)*100)
  }));
  const proof=classifyOriginalBrainFlightPages(pages,title,{since:'2026-11-15T08:45:00Z'});
  assert.equal(proof.complete,true);
  assert.equal(proof.status,'EXISTING_FLIGHT');
  assert.equal(proof.run_id,1205,'source-bound run may be in third provider page');
  assert.equal(classifyOriginalBrainFlightPages(pages.slice(0,2),title,{since:'2026-11-15T08:45:00Z'}).safe_to_dispatch,false,
    'missing provider page must fail closed');
});

test('original terminal retries interrupted or incomplete provider history within three bounded reads, never accepting cap or partial evidence',()=>{
 const closure=readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');
 const guard=closure.split('name: Ensure original exact-head read-only BRAIN verification exists')[1].split('name: Verify exact-head critical delivery gates before terminal claim')[0];
 const final=closure.split('name: Verify exact-head critical delivery gates before terminal claim')[1];
 const title='BRAIN delivery PR #6174 '+('a'.repeat(40));
 const row={id:99,created_at:'2026-11-24T19:08:00Z',head_branch:'main',event:'workflow_dispatch',display_title:title,status:'completed'};
 const complete=JSON.stringify([{total_count:1,workflow_runs:[row]}]);
 const partial=JSON.stringify([{total_count:2,workflow_runs:[row]}]);
 const cap=JSON.stringify([{total_count:1000,workflow_runs:[]}]);
 for(const [text,index] of [[guard,'selected'],[final,'indexed']]){
  const match=text.match(/history_proven=false[\s\S]*?\[ "\$history_proven" = true \] \|\| \{ echo "::error::\$history_error"; exit 78; \}/);
  assert.ok(match,'actual workflow retry block');
  const dir=mkdtempSync(join(tmpdir(),'brain-history-retry-'));
  try{
   const fake=join(dir,'gh');
   writeFileSync(fake,'#!/bin/bash\nn=$(cat "$COUNT_FILE" 2>/dev/null || echo 0); n=$((n+1)); echo "$n" > "$COUNT_FILE"; cat "$FIXTURE_DIR/$n"; exit "$(cat "$FIXTURE_DIR/$n.exit")"\n',{mode:0o755});
   const run=(fixtures,expect,count)=>{
    rmSync(join(dir,'count'),{force:true});
    fixtures.forEach(([body,code],i)=>{writeFileSync(join(dir,String(i+1)),body);writeFileSync(join(dir,String(i+1)+'.exit'),String(code));});
    const result=spawnSync('bash',['-c','set -euo pipefail\nsleep(){ :; }\n'+match[0]+'\nprintf "%s" "$'+index+'"'],{encoding:'utf8',env:{...process.env,PATH:dir+':'+process.env.PATH,COUNT_FILE:join(dir,'count'),FIXTURE_DIR:dir,query:'fixture',expected_title:title,since:'2026-11-24T19:00:00Z'}});
    assert.equal(result.status,expect,result.stderr+' '+result.stdout);
    assert.equal(Number(readFileSync(join(dir,'count'),'utf8')),count);
    if(expect===0)assert.equal(JSON.parse(result.stdout).run_id,99);
    else assert.doesNotMatch(result.stdout,/EXISTING_FLIGHT|NO_FLIGHT_PROVEN_FULL_HISTORY/);
   };
   run([['',1],[partial,0],[complete,0]],0,3);
   run([['{',0],[complete,0]],0,2);
   run([[partial,0],[partial,0],[partial,0]],78,3);
   run([[cap,0],[complete,0]],78,1);
  }finally{rmSync(dir,{recursive:true,force:true});}
 }
});
