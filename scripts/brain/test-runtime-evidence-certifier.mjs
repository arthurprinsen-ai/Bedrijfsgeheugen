import assert from 'node:assert/strict';
import { normalizeBrainRecord } from '../../brain/operating-loop/model.mjs';
import { certifyWholeBrainRuntime } from '../../brain/operating-loop/runtime-evidence-certifier.mjs';

const base={tenantId:'tenant-a',correlationId:'corr-1',owner:'Powerhouse',evidenceIds:['E1']};
const records=[
  normalizeBrainRecord({...base,type:'Evidence',id:'E1',predecessorIds:[],source:'make',payload:{}}),
  normalizeBrainRecord({...base,type:'Entity',id:'G1',predecessorIds:['E1'],payload:{loopStage:'graph'}}),
  normalizeBrainRecord({...base,type:'Signal',id:'I1',predecessorIds:['G1'],payload:{}}),
  normalizeBrainRecord({...base,type:'Impact',id:'IMP1',predecessorIds:['I1'],payload:{}}),
  normalizeBrainRecord({...base,type:'Decision',id:'D1',predecessorIds:['IMP1'],payload:{}}),
  normalizeBrainRecord({...base,type:'Action',id:'A1',predecessorIds:['D1'],payload:{}}),
  normalizeBrainRecord({...base,type:'Execution',id:'X1',predecessorIds:['A1'],executed:true,result:'ok',payload:{runtimeExecutionId:'run-1',candidateRevision:'rev-1'}}),
  normalizeBrainRecord({...base,type:'Verification',id:'V1',predecessorIds:['X1'],verified:true,result:'passed',payload:{readbackVerified:true,runtimeExecutionId:'run-1',verifiedRevision:'rev-1'}}),
  normalizeBrainRecord({...base,type:'Value',id:'VAL1',predecessorIds:['V1'],executed:true,verified:true,result:'100 EUR',payload:{realised:true}}),
  normalizeBrainRecord({...base,type:'Learning',id:'L1',predecessorIds:['VAL1'],payload:{}}),
  normalizeBrainRecord({...base,type:'Memory',id:'M1',predecessorIds:['L1'],payload:{}}),
  normalizeBrainRecord({...base,type:'Relation',id:'GF1',predecessorIds:['M1'],payload:{loopStage:'graph_feedback',from:'memory:M1',to:'entity:customer'}}),
];

const adapterContract={
  activation:{production_ready_requires:['capacity_available','execution_proof','exact_revision_evidence','whole_brain_lineage_verified']},
  platforms:[{platform:'make',authority:'BG169',capacity_gate:'required',execution_proof:'required'}],
};

const proven=certifyWholeBrainRuntime({records,correlationId:'corr-1',platform:'make',adapterContract,runtimeEvidence:{capacity:'available',executionId:'run-1',executed:true,authority:'BG169',candidateRevision:'rev-1',activeRevision:'rev-1',verifiedAt:'2026-08-31T07:30:00Z',readback:{verified:true,executionId:'run-1',revision:'rev-1'}}});
assert.equal(proven.status,'PROVEN');
assert.equal(proven.green,true);
assert.deepEqual(proven.missing,[]);

const noReadback=certifyWholeBrainRuntime({records,correlationId:'corr-1',platform:'make',adapterContract,runtimeEvidence:{capacity:'available',executionId:'run-1',executed:true,authority:'BG169',candidateRevision:'rev-1',activeRevision:'rev-1',verifiedAt:'2026-08-31T07:30:00Z',readback:{verified:false,executionId:'run-1',revision:'rev-1'}}});
assert.equal(noReadback.status,'NOT_PROVEN');
assert.equal(noReadback.green,false);
assert.ok(noReadback.missing.includes('exact_runtime_readback'));

const quotaBlocked=certifyWholeBrainRuntime({records,correlationId:'corr-1',platform:'make',adapterContract,runtimeEvidence:{capacity:'paused',executionId:'run-1',executed:true,authority:'BG169',candidateRevision:'rev-1',activeRevision:'rev-1',verifiedAt:'2026-08-31T07:30:00Z',readback:{verified:true,executionId:'run-1',revision:'rev-1'}}});
assert.equal(quotaBlocked.status,'NOT_PROVEN');
assert.ok(quotaBlocked.missing.includes('capacity_available'));

const revisionDrift=certifyWholeBrainRuntime({records,correlationId:'corr-1',platform:'make',adapterContract,runtimeEvidence:{capacity:'available',executionId:'run-1',executed:true,authority:'BG169',candidateRevision:'rev-1',activeRevision:'rev-2',verifiedAt:'2026-08-31T07:30:00Z',readback:{verified:true,executionId:'run-1',revision:'rev-2'}}});
assert.equal(revisionDrift.status,'NOT_PROVEN');
assert.ok(revisionDrift.missing.includes('exact_revision_evidence'));

console.log('runtime evidence certifier tests passed');
