import test from 'node:test';
import assert from 'node:assert/strict';
import {projectObservedCicdTaskRuns} from '../tools/delivery/ci-cicd-semconv-projection.mjs';
import {collectObservedCiThroughput} from '../tools/delivery/ci-throughput-telemetry.mjs';
import {readFileSync} from 'node:fs';

const NOW=Date.parse('2026-10-23T10:00:00Z');
const SHA='a'.repeat(40);
const iso=n=>new Date(NOW+n).toISOString();
function row(runId,jobId,{name='backend / backend',conclusion='success'}={}){
 return {run:{
  id:runId,run_attempt:1,head_sha:SHA,status:'completed',
  name:'Required test',created_at:iso(0),workflow_id:77
 },job:{
  id:jobId,name,status:'completed',conclusion,
  created_at:iso(0),started_at:iso(1000),completed_at:iso(3000)
 }};
}
const samples=()=>Array.from({length:20},(_,i)=>row(500+Math.floor(i/4),10000+i));

test('OpenTelemetry CI/CD-compatible task fields are source-only, linked to exact GitHub provider job',()=>{
 const output=projectObservedCicdTaskRuns({repo:'example/repo',
  observations:samples(),status:'SAMPLED_METRICS_NOT_SLO',readErrors:[]});
 assert.equal(output.status,'SOURCE_ONLY_FIELD_COMPATIBLE');
 assert.equal(output.exported,false);
 assert.equal(output.release_authorized,false);
 assert.equal(output.critical_path_proven,false);
 assert.equal(output.provider_snapshot_complete,true);
 assert.equal(output.sampled_tasks,20);
 assert.equal(output.distinct_run_attempts,5);
 const record=output.records[0];
 assert.equal(record.attributes['cicd.pipeline.task.name'],'backend / backend');
 assert.equal(record.attributes['cicd.pipeline.task.run.id'],'10000');
 assert.equal(record.attributes['cicd.pipeline.task.run.result'],'success');
 assert.equal(record.attributes['vcs.repository.ref.revision'],SHA);
 assert.equal(record.attributes['cicd.pipeline.task.run.url.full'],
  'https://github.com/example/repo/actions/runs/500/job/10000');
 assert.equal(record.observed_execution_ms,2000);
});

test('provider partial response, invalid repository, insufficient runs and fake SHA never emit proof',()=>{
 const cases=[
  {repo:'example/repo',observations:samples(),status:'PARTIAL_PROVIDER_OBSERVATION',readErrors:[{reason:'503'}]},
  {repo:'example/repo',observations:samples().slice(0,4),status:'SAMPLED_METRICS_NOT_SLO',readErrors:[]},
  {repo:'https://evil.test/example/repo',observations:samples(),status:'SAMPLED_METRICS_NOT_SLO',readErrors:[]},
  {repo:'example/repo',observations:samples().map(x=>({...x,run:{...x.run,head_sha:'unknown'}})),status:'SAMPLED_METRICS_NOT_SLO',readErrors:[]},
  {repo:'example/repo',observations:samples().map(x=>({...x,run:{...x.run,id:500}})),status:'SAMPLED_METRICS_NOT_SLO',readErrors:[]}
 ];
 for(const sample of cases){
  const x=projectObservedCicdTaskRuns(sample);
  assert.equal(x.records.length,0);
  assert.equal(x.provider_snapshot_complete,false);
  assert.equal(x.exported,false);
  assert.equal(x.release_authorized,false);
 }
});

test('duplicate provider rows, skipped placeholders and job name injection cannot inflate evidence',()=>{
 const a=samples();
 const duplicate=Array.from({length:20},()=>a[0]);
 const x=projectObservedCicdTaskRuns({repo:'example/repo',
  observations:duplicate,status:'SAMPLED_METRICS_NOT_SLO',readErrors:[]});
 assert.equal(x.status,'INCOMPLETE_OR_INSUFFICIENT_SOURCE');
 const tainted=samples().map((x,i)=>({
  ...x,job:{...x.job,
   ...(i===0?{name:'bad\njob'}:{}),
   ...(i===1?{conclusion:'skipped'}:{})
  }
 }));
 const y=projectObservedCicdTaskRuns({repo:'example/repo',
  observations:tainted,status:'SAMPLED_METRICS_NOT_SLO',readErrors:[]});
 assert.equal(y.records.length,0);
 assert.equal(y.status,'INCOMPLETE_OR_INSUFFICIENT_SOURCE');
});

test('real failed execution maps to failure and cancelled task maps to cancellation without PASS claim',()=>{
 const a=samples();
 a[0].job.conclusion='failure';a[1].job.conclusion='cancelled';
 const x=projectObservedCicdTaskRuns({repo:'example/repo',
  observations:a,status:'SAMPLED_METRICS_NOT_SLO',readErrors:[]});
 assert.equal(x.records[0].attributes['cicd.pipeline.task.run.result'],'failure');
 assert.equal(x.records[1].attributes['cicd.pipeline.task.run.result'],'cancellation');
 assert.equal(x.release_authorized,false);
});

test('existing single hourly Janitor emits semantic projection without network exporters or new scheduler',async()=>{
 const all=samples();
 const runs=Array.from({length:5},(_,i)=>all[i*4].run);
 let count=0;
 const read=path=>{
  count++;
  if(path.includes('status=completed'))return {workflow_runs:runs};
  const runId=Number(path.match(/runs\/(\d+)\/jobs/)[1]);
  const jobs=all.filter(x=>x.run.id===runId).map(x=>x.job);
  return {total_count:jobs.length,jobs};
 };
 const x=await collectObservedCiThroughput({repo:'example/repo',now:NOW+10_000,read});
 assert.equal(x.status,'SAMPLED_METRICS_NOT_SLO');
 assert.equal(x.cicd_semconv_evidence.status,'SOURCE_ONLY_FIELD_COMPATIBLE');
 assert.equal(x.cicd_semconv_evidence.sampled_tasks,20);
 assert.equal(x.cicd_semconv_evidence.exported,false);
 assert.equal(x.automation_allowed,false);
 assert.equal(count,6);
 const source=readFileSync('tools/delivery/ci-throughput-telemetry.mjs','utf8');
 assert.match(source,/projectObservedCicdTaskRuns/);
 assert.match(source,/cicd_semconv_evidence_status/);
 assert.doesNotMatch(source,/OTLP_ENDPOINT|traceExporter|schedule\s*\(/i);
});


test('semconv projection excludes malformed timestamps even when 20 other canonical jobs qualify',()=>{
 const good=samples();
 const malformed=[
  {created_at:null},
  {created_at:iso(1500)},                   // job was created after its start
  {started_at:iso(-500)},                    // job started before creation
  {started_at:iso(172800000+1000),completed_at:iso(172800000+3000)}, // >48h wait
  {completed_at:iso(172800000+3001)},       // >48h execution
  {started_at:'garbled'},                   // unparsable
  {completed_at:'garbled'}
 ];
 for(const bad of malformed){
  const rowNew=row(900,90001);
  rowNew.job={...rowNew.job,...bad};
  const observed=projectObservedCicdTaskRuns({repo:'example/repo',
   observations:[...good,rowNew],status:'SAMPLED_METRICS_NOT_SLO',readErrors:[]});
  assert.equal(observed.status,'SOURCE_ONLY_FIELD_COMPATIBLE');
  assert.equal(observed.records.length,20);
  assert.ok(observed.records.every(x=>x.job_id!==90001),'unverified task must not leak into proof');
 }
 // If a bad row would be the twentieth, the entire sample remains unproven.
 const x=projectObservedCicdTaskRuns({repo:'example/repo',
  observations:[...good.slice(0,19),{...row(900,90001),job:{
   ...row(900,90001).job,created_at:null}}],
  status:'SAMPLED_METRICS_NOT_SLO',readErrors:[]});
 assert.equal(x.status,'INCOMPLETE_OR_INSUFFICIENT_SOURCE');
 assert.equal(x.records.length,0);
});

test('failure and timeout use low-cardinality OpenTelemetry error.type; success/cancel do not',()=>{
 const rows=samples();
 rows[0].job.conclusion='failure';
 rows[1].job.conclusion='timed_out';
 rows[2].job.conclusion='cancelled';
 const x=projectObservedCicdTaskRuns({repo:'example/repo',
  observations:rows,status:'SAMPLED_METRICS_NOT_SLO',readErrors:[]});
 assert.equal(x.status,'SOURCE_ONLY_FIELD_COMPATIBLE');
 assert.equal(x.records[0].attributes['error.type'],'ci_task_failed');
 assert.equal(x.records[1].attributes['error.type'],'timeout');
 assert.equal(x.records[2].attributes['error.type'],undefined);
 assert.equal(x.records[3].attributes['error.type'],undefined);
 assert.ok(!JSON.stringify(x).includes('runner.stderr'),'must never ingest arbitrary output');
});
