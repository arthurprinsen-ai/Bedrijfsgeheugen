import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {recoveryBudget} from '../tools/delivery/adaptive-recovery-capacity.mjs';
test('runtime calls canonical capacity and checks reserved pressure before next recovery',()=>{
 const y=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
 assert.ok(y.includes("adaptive-recovery-capacity.mjs init \"$capacity_state\""));
 assert.ok(y.includes("adaptive-recovery-capacity.mjs reserve \"$capacity_state\""));
 assert.ok(y.includes("reserve_recovery_capacity || return 1"));
 assert.ok(y.includes("reserved_actions=\"$(jq -r '.used' \"$capacity_state\")\""));
 assert.ok(y.includes("[ \"$reserved_actions\" -ge \"$cycle_budget\" ]"));
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


import {collectRecoveryQueueEvidence,remainingProvenRecoveryCapacity} from '../tools/delivery/adaptive-recovery-capacity.mjs';
test('read-only native census excludes only independently verified incident ghosts',async()=>{
 const now=Date.parse('2026-11-27T16:00:00Z'),old='2026-11-25T15:00:00Z';
 const main='b'.repeat(40),sha='a'.repeat(40);
 const ghosts=Array.from({length:5},(_,i)=>({id:100+i,status:'queued',conclusion:null,head_sha:sha,head_branch:'old',created_at:old,updated_at:old}));
 const active=Array.from({length:4},(_,i)=>({...ghosts[0],id:200+i,status:'in_progress',head_sha:main,head_branch:'main'}));
 const read=async path=>{
  if(path==='/git/ref/heads/main')return {object:{sha:main}};
  if(path.startsWith('/pulls?'))return [];
  if(path==='/issues/4655')return {number:4655,state:'open',body:ghosts.map(x=>'GHOST_RUN_PROVIDER_BLOCKED:'+x.id).join('\n')};
  if(path.startsWith('/issues/4655/comments?'))return [];
  if(path.startsWith('/actions/runs?')){const status=new URL('https://example.invalid'+path).searchParams.get('status');const rows=status==='queued'?ghosts:status==='in_progress'?active:[];return {total_count:rows.length,workflow_runs:rows};}
  if(path.includes('/jobs?'))return {total_count:0,jobs:[]};
  const run=ghosts.find(x=>path==='/actions/runs/'+x.id);if(run)return run;
  throw Error('unexpected read: '+path);
 };
 const collect=reader=>collectRecoveryQueueEvidence({read:reader,repo:'owner/repo',now:()=>now});
 const snapshot=await collect(read);
 assert.equal(snapshot.queued,5);assert.equal(snapshot.inProgress,4);
 assert.equal(snapshot.queueEvidence.runProofs.length,5);
 const bound=remainingProvenRecoveryCapacity({initial:snapshot,observed:snapshot});
 assert.equal(bound.remaining,2);assert.equal(bound.active,4);assert.equal(bound.mutationAuthority,false);
 const withJob=await collect(async path=>path.includes('/100/jobs?')?{total_count:1,jobs:[{id:1}]}:read(path));
 assert.equal(withJob.queueEvidence.runProofs.length,4);
 assert.equal(remainingProvenRecoveryCapacity({initial:withJob,observed:withJob}).remaining,1);
 await assert.rejects(collect(async path=>path==='/actions/runs/100'?{}:read(path)),/RECOVERY_EXACT_RUN_UNPROVEN/);
 await assert.rejects(collect(async path=>path.includes('status=queued')?{total_count:6,workflow_runs:ghosts}:read(path)),/RECOVERY_QUEUE_INCOMPLETE/);
 await assert.rejects(collect(async path=>path.includes('status=queued')?{total_count:5,workflow_runs:[...ghosts.slice(0,4),ghosts[0]]}:read(path)),/RECOVERY_QUEUE_INCOMPLETE/);
 let mainReads=0;
 await assert.rejects(collect(async path=>path==='/git/ref/heads/main'&&++mainReads>1?{object:{sha:'c'.repeat(40)}}:read(path)),/RECOVERY_AUTHORITY_EPOCH_CHANGED/);
 const stale={...snapshot,queueEvidence:{...snapshot.queueEvidence,now:now+600001}};
 assert.equal(remainingProvenRecoveryCapacity({initial:stale,observed:stale}).remaining,0);
});


import {reserveRecoveryAction} from '../tools/delivery/adaptive-recovery-capacity.mjs';
test('reservation journal charges attempted dispatches before provider result and never replenishes mid-cycle',()=>{
 const now=Date.parse('2026-11-27T16:00:00Z'),sha='a'.repeat(40);
 const s={queued:0,inProgress:4,pending:0,waiting:0,requested:0,queueEvidence:{queuedRuns:[],runProofs:[],snapshotComplete:true,rawTotalCount:0,currentMainSha:sha,now}};
 let state={initial:s,limit:2,used:0};
 const a=reserveRecoveryAction(state,s);assert.equal(a.allowed,true);assert.equal(a.state.used,1);
 const b=reserveRecoveryAction(a.state,s);assert.equal(b.allowed,true);assert.equal(b.state.used,2);
 const c=reserveRecoveryAction(b.state,s);assert.equal(c.allowed,false);
 const drift={...s,queueEvidence:{...s.queueEvidence,currentMainSha:'b'.repeat(40)}};
 assert.equal(reserveRecoveryAction(state,drift).allowed,false);
 const full={...s,inProgress:12};const denied=reserveRecoveryAction(state,full);
 assert.equal(denied.allowed,false);assert.equal(denied.state.limit,0);
 assert.equal(reserveRecoveryAction(denied.state,s).allowed,false);
 const y=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
 assert.ok(y.indexOf('reserve_recovery_capacity || return 1')<y.indexOf('gh workflow run required-test.yml'));
 assert.ok(y.indexOf('if ! reserve_recovery_capacity; then')<y.indexOf('emit_metric "$number" CAS_REQUEST'));
 assert.ok(y.indexOf('ADAPTIVE_TERMINAL_RESERVATION')<y.indexOf('gh workflow run obligation-terminal-closure.yml'));
});
