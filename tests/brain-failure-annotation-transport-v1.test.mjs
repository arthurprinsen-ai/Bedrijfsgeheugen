import test from 'node:test';
import assert from 'node:assert/strict';
import {clusterBrainFailures,brainFailureAnnotationChunks} from '../tools/delivery/brain-failure-clustering.mjs';
const options={headSha:'a'.repeat(40),runId:'fixture-run',lane:'backend'};
test('every redacted TAP failure remains in the full canonical report and bounded annotations',()=>{
 const titles=Array.from({length:271},(_,i)=>'contract '+i+' '+('source '.repeat(20)));
 const log=titles.map((title,i)=>'not ok '+(i+1)+' - '+title).join('\n')+'\n# fail 271\n';
 const report=clusterBrainFailures(log,options);
 assert.equal(report.coverage_complete,true);assert.equal(report.failures.length,271);
 const parts=brainFailureAnnotationChunks(report);
 assert.ok(parts.length<=8);
 assert.deepEqual(parts.flatMap(p=>p.failures.map(f=>f.title)),report.failures.map(f=>f.title));
 for(const part of parts){
  assert.equal(part.head_sha,options.headSha);assert.equal(part.run_id,options.runId);
  assert.equal(part.reported_failures,271);assert.equal(part.annotation_coverage_complete,true);
  assert.ok(JSON.stringify(part).length<12000);
 }
});
test('source tokens and email addresses cannot leak through annotation transport',()=>{
 const report=clusterBrainFailures('not ok 1 - token=synthetic-secret user@example.invalid\n# fail 1\n',options);
 const serialized=JSON.stringify(brainFailureAnnotationChunks(report));
 assert.doesNotMatch(serialized,/synthetic-secret|user@example.invalid/);
 assert.match(serialized,/redacted/);
});
test('bounded annotation truncation never claims full coverage or a successful recovery',()=>{
 const rows=Array.from({length:5000},(_,i)=>'not ok '+(i+1)+' - '+i+' '+('x'.repeat(240))).join('\n');
 const report=clusterBrainFailures(rows+'\n# fail 5000\n',options),parts=brainFailureAnnotationChunks(report);
 assert.equal(report.status,'OBSERVED_NOT_REPAIRED');assert.equal(report.coverage_complete,true);assert.equal(report.failures.length,5000);
 assert.equal(parts.length,8);assert.ok(parts.flatMap(p=>p.failures).length<5000);
 for(const part of parts)assert.equal(part.annotation_coverage_complete,false);
 const incomplete=clusterBrainFailures('not ok 1 - one\n# fail 2\n',options);
 assert.equal(brainFailureAnnotationChunks(incomplete)[0].annotation_coverage_complete,false);
});
