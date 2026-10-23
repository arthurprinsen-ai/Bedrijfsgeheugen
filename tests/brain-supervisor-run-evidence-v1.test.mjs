import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifySupervisorRun,summarizeSupervisorRuns,observeSupervisorRuns} from '../tools/delivery/supervisor-run-evidence.mjs';
const sha=c=>c.repeat(40);
const source=(id,lines,event='workflow_dispatch')=>({
  run:{id,name:'Powerhouse Delivery Recovery Supervisor',event,status:'completed',
    conclusion:'success',head_sha:sha('a'),created_at:'2026-10-23T13:24:45Z'},
  job:{id:id+200,name:'supervise',status:'completed',conclusion:'success'},
  log:lines.join('\n'),complete:true
});
const drift='2026-10-23T13:25:17.7303132Z PR#4772 '+sha('b')+' MAIN_DRIFT_RECOVERY';
const held='2026-10-23T13:25:17.7476112Z ##[warning]PR#4772 has no exact active terminal writer lease; automatic refresh forbidden.';
test('actual manual supervisor run classifies nonterminal writer lease without falsely claiming schedule',()=>{
  const item=classifySupervisorRun(source(39960974891,[drift,held]));
  assert.equal(item.status,'EXECUTED_PROOF');assert.equal(item.trigger,'workflow_dispatch');
  assert.deepEqual(item.events,[{pr:4772,kind:'MAIN_DRIFT_RECOVERY',headSha:sha('b')},
    {pr:4772,kind:'LEASE_NOT_TERMINAL',classification:'OWNER_HANDOFF_REQUIRED'}]);
});
test('repeated within-run events do not inflate drift, two independent runs do',()=>{
  const result=summarizeSupervisorRuns([
    source(10,[drift,drift,held]),source(11,[drift]),
    source(12,['2026-10-23T13:25:20Z ##[notice]MAIN_DRIFT_SYNC_RECONCILED:PR#4772'],'schedule')
  ]);
  assert.equal(result.status,'OBSERVED_SAMPLE');
  assert.equal(result.scheduledRuns,1);assert.equal(result.manualRuns,2);
  assert.equal(result.prs[0].independentDriftRuns,2);
  assert.equal(result.prs[0].outcomes.OWNER_HANDOFF_REQUIRED,1);
  assert.equal(result.repeatedDriftPrs,1);
});
test('CAS rejection requires explicit typed run message, not a bare HTTP 422',()=>{
  const x=summarizeSupervisorRuns([
    source(10,[drift,'2026-10-23T13:25:20Z HTTP 422']),
    source(11,['2026-10-23T13:25:20Z ##[warning]MAIN_DRIFT_CAS_REJECTED_422:PR#4772']),
    source(12,['2026-10-23T13:25:20Z ##[warning]MAIN_DRIFT_CAS_REJECTED_403:PR#4772'])
  ]);
  assert.equal(x.explicitlyProvenCasRejections,2);
  assert.equal(x.prs[0].outcomes.CAS_PERMISSION,1);
});
test('partial provider run, duplicate ID and colorized echoed script do not establish truth',()=>{
  const color='2026-10-23T13:25:20Z \x1b[36;1mecho "::notice::MAIN_DRIFT_CAS_REJECTED_422:PR#4772"\x1b[0m';
  assert.deepEqual(classifySupervisorRun(source(1,[color])).events,[]);
  const partial=source(2,[drift]);partial.complete=false;
  assert.equal(classifySupervisorRun(partial).status,'INVALID_PROVIDER_PROOF');
  assert.equal(summarizeSupervisorRuns([source(1,[drift]),source(1,[drift]),partial]).status,
    'INCOMPLETE_PROVIDER_PROOF');
});
test('existing Janitor collector is bounded, remains advisory and cannot create production success',async()=>{
  const calls=[],item=source(42,[drift],'schedule');
  const out=await observeSupervisorRuns({repo:'arthurprinsen-ai/Bedrijfsgeheugen',
    now:Date.parse('2026-10-23T13:50:00Z'),
    getJson:p=>{calls.push(p);return p.includes('/jobs?')?{jobs:[item.job],total_count:1}:
      {workflow_runs:[item.run]};},
    getText:p=>{calls.push(p);return item.log;}
  });
  assert.equal(calls.length,3);
  assert.equal(out.completedRuns,1);assert.equal(out.scheduledRuns,1);
  assert.equal(out.performanceImprovementProven,false);
  assert.equal(out.automatedWritesAllowed,false);
  assert.equal(out.p50GreenToProductionMs,null);
  const workflow=readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');
  assert.match(workflow,/cron: '17 \* \* \* \*'/);
  assert.equal((workflow.match(/Observe executed Recovery Supervisor runs/g)||[]).length,1);
  assert.match(workflow,/run: node tools\/delivery\/supervisor-run-evidence\.mjs/);
  assert.doesNotMatch(readFileSync('tools/delivery/supervisor-run-evidence.mjs','utf8'),
    /gh workflow run|--method (?:POST|PUT|PATCH|DELETE)/);
});
