import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateKnowledgeCompletion} from '../../brain/guards/knowledge-completion-gate.mjs';
import {diagnoseRequiredStatus} from '../../brain/guards/github-required-status-diagnostics.mjs';

test('recognizes synthetic merge-ref required-status gap without rerunning tests',()=>{
  const d=diagnoseRequiredStatus({requiredContext:'test',requiredAppId:15368,headStatuses:[{context:'test',state:'success',app_id:15368}],headCheckRuns:[{name:'test',conclusion:'success',app_id:15368}],mergeCheckRuns:[],mergeApiMessage:'Required status check "test" is expected.'});
  assert.equal(d.classification,'expected_on_synthetic_ref');
  assert.equal(d.rerunTests,false);
  assert.equal(d.disableRequiredCheck,false);
});

test('material technical knowledge is complete only after BG167 readback',()=>{
  const base={source_refs:[{system:'github',kind:'pull_request',id:'1159'}],evidence:[{kind:'deploy',id:'6a9fe513a7af0e0008661320'}],outcome:{status:'success'},architecture_impact:{status:'MAPPED',components:['website:homepage-hero-video']},rollback:{strategy:'revert merge'},projection:{state:'projected'},writeback:{state:'written'},readback:{state:'pending'}};
  assert.equal(evaluateKnowledgeCompletion(base).status,'OPEN');
  assert.equal(evaluateKnowledgeCompletion({...base,readback:{state:'verified',bg167_ref:'readback-1'}}).status,'COMPLETE');
});

test('external Brain runtime blocker stays BLOCKED rather than complete',()=>{
  const event={source_refs:[{system:'make',kind:'scenario',id:'7136176'}],evidence:[{kind:'config',id:'bg168'}],outcome:{status:'blocked'},architecture_impact:{status:'MAPPED',components:['brain:bg168']},rollback:{strategy:'preserve legacy'},projection:{state:'projected'},writeback:{state:'blocked'},readback:{state:'pending'}};
  assert.equal(evaluateKnowledgeCompletion(event).status,'BLOCKED');
});
