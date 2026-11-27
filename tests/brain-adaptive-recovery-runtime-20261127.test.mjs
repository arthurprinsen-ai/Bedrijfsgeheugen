import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {recoveryBudget} from '../tools/delivery/adaptive-recovery-capacity.mjs';
test('runtime calls canonical capacity and checks reserved pressure before next recovery',()=>{
 const y=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
 assert.ok(y.includes('cycle_budget="$(recovery_budget "$initial_active_runs")"'));
 assert.ok(y.includes('reserved_pressure=$((initial_active_runs + 3 * recovered_prs))'));
 assert.ok(y.includes('remaining="$(recovery_budget "$reserved_pressure")"'));
 assert.ok(y.includes('[ "$candidate_budget" -ge "$cycle_budget" ] || cycle_budget="$candidate_budget"'));
 assert.ok(y.includes('[ "$recovered_prs" -ge "$cycle_budget" ]'));
 assert.ok(y.includes("ACTIVE_RUN_CIRCUIT_BREAKER: '12'"));
});
test('conservative reserve survives delayed provider visibility and rising pressure',()=>{
 for(let initial=0;initial<=15;initial++)for(let used=0;used<=recoveryBudget({activeRuns:initial});used++)for(let observed=0;observed<=15;observed++){
  const pressure=Math.max(observed,initial+3*used);
  const remaining=Math.min(recoveryBudget({activeRuns:initial})-used,recoveryBudget({activeRuns:pressure}));
  assert.ok(remaining>=0);
  if(remaining>0)assert.ok(pressure+3*remaining<=10);
 }
});

import {evaluateLearningSemantics} from '../scripts/brain/material-writeback-closure-guard.mjs';
test('runtime learning satisfies existing semantic closure contract',()=>{
 const result=evaluateLearningSemantics({learningFiles:['brain/learning/2026-11-27-adaptive-recovery-runtime.json']});
 assert.equal(result.ok,true,JSON.stringify(result.missing));
});


import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('native unknown ref/status read never proves obsolete or permits deletion',()=>{
 const y=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
 const start=y.indexOf('          is_run_obsolete() {');
 const end=y.indexOf('          cancel_stale_runs() {',start);
 assert.ok(start>=0&&end>start);
 const defs=y.slice(start,end);
 const sha='a'.repeat(40),current='b'.repeat(40);
 const expected=JSON.stringify({id:42,head_sha:sha,head_branch:'feature',status:'queued'});
 const dir=fs.mkdtempSync(join(tmpdir(),'bg-provider-negative-'));
 try{
 for(const mode of ['REF_ERROR','REF_EMPTY','REF_MALFORMED','FRESH_ERROR','STATUS_ERROR','STATUS_UNKNOWN']){
  const calls=join(dir,mode);
  const script=[
   'set -euo pipefail','repo=example/repo; now_epoch=0; current_main_sha="$MAIN"',
   'gh(){',
   '  if [[ "$*" == *"--method DELETE"* ]]; then echo DELETE >> "$CALLS"; return 1; fi',
   '  if [[ "$*" == *"--method POST"* ]]; then echo POST >> "$CALLS"; return 1; fi',
   '  if [[ "$*" == *"git/ref/heads/"* ]]; then case "$MODE" in REF_ERROR) return 1;; REF_EMPTY) return 0;; REF_MALFORMED) echo null;; *) echo "$MAIN";; esac; return 0; fi',
   '  if [[ "$*" == *"--jq .status"* ]]; then case "$MODE" in STATUS_ERROR) return 1;; *) echo unknown;; esac; return 0; fi',
   '  if [[ "$MODE" == FRESH_ERROR ]]; then return 1; fi',
   '  printf "%s" "$EXPECTED"',
   '}',defs,
   'case "$MODE" in REF_*) if is_run_obsolete "$EXPECTED"; then exit 9; fi;; *) if cancel_obsolete_run 42 "$EXPECTED"; then exit 9; fi;; esac'
  ].join('\n');
  const result=spawnSync('bash',['-c',script],{encoding:'utf8',env:{...process.env,MAIN:current,EXPECTED:expected,MODE:mode,CALLS:calls}});
  assert.equal(result.status,0,mode+': '+result.stderr);
  const actions=fs.existsSync(calls)?fs.readFileSync(calls,'utf8'):'';
  assert.doesNotMatch(actions,/DELETE/,mode);
  if(mode.startsWith('REF_')||mode==='FRESH_ERROR')assert.equal(actions,'',mode);
 }
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
