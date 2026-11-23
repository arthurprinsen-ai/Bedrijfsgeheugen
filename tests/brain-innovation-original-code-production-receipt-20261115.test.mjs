import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyOriginalInnovationRelease,recordOriginalRelease} from '../scripts/brain/innovation-original-code-production-receipt.mjs';

const cid='2c1ecc77-58aa-4f25-ae68-e2337853fdc7';
const opId='56e16919-6275-4c2e-9208-6ac0c8a29a29';
const main='a'.repeat(40),source='b'.repeat(64),revision='2026-10-29T13:19:24.643686+00:00';
const prUrl='https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5908';
function evidence(){
 const candidate={candidate_id:cid,owner_agent:'engineering',status:'candidate',source_key:'quality-learning-v1:runtime'};
 const receipt={url:prUrl,pr_number:5908,candidate_id:cid,source_sha256:source,
   source_revision:revision,original_owner:'agent:agent-integration-engineer',
   terminal_success:false,consumer_ack_verified:false};
 const operation={id:opId,status:'PLANNED',operation_type:'INNOVATION_INTAKE',remote_ref:null,
   capability_id:'agent:agent-integration-engineer',version:7,change_id:candidate.source_key,
   payload_sha256:source,correlation_id:'innovation-delivery:'+cid,
   idempotency_key:'innovation-delivery:'+cid+':'+source.slice(0,16),
   evidence:{original_code_candidate_pr:receipt,original_owner_decision:{}}};
 const obligation={business_entity:cid,state:'OPEN',change_id:candidate.source_key,
   payload_sha256:source,evidence:{source_revision:revision}};
 const pr={number:5908,url:prUrl,state:'MERGED',baseRefName:'main',
   headRefName:'writer/innovation-2c1ecc77-43754864334',
   headRefOid:'c'.repeat(40),
   mergeCommit:{oid:main},mergedAt:'2026-11-15T20:08:30Z',
   body:['Candidate-Type: implementation','Original-Candidate: '+cid,
     'Original-Operation: '+opId,'Original-Source-Revision: '+revision,
     'Original-Source-SHA256: '+source,
     'Writer-Lease-Owner: agent:agent-integration-engineer'].join('\n')};
 const live={deploy_id:'6afa1140fce862102329274e',commit_ref:main,context:'production'};
 const release={status:'LIVE_VERIFIED',deployment_required:true,merge_sha:main,deployed_sha:main,
   netlify_deploy_id:live.deploy_id,deploy_status:'ready',routes_ok:true};
 return {candidate,operation,obligation,pr,release,live,
   mainSha:main,runId:'43756362047',observedAt:'2026-11-15T20:10:12Z'};
}

test('original code release reconciles only exact protected merged PR and independently released Netlify source',()=>{
 const x=evidence(),p=verifyOriginalInnovationRelease(x);
 assert.equal(p.contract,'ORIGINAL_INNOVATION_CODE_RELEASE_INDEPENDENT_READBACK_V1');
 assert.equal(p.github_merge_commit_sha,x.mainSha);
 assert.equal(p.netlify_deploy_id,x.live.deploy_id);
 assert.equal(p.independently_verified_provider_release,true);
 assert.equal(p.original_innovation_fully_delivered,false);
 assert.equal(p.original_operation_stays,'PLANNED');
 assert.equal(p.consumer_ack_verified,false);
 assert.equal(p.independent_business_effect_verified,false);
 assert.equal(p.terminal_success,false);
});
test('wrong PR type, operation, source hash, protected branch, commit or stale Netlify fails closed',()=>{
 const base=evidence();
 const mutations=[
  x=>{x.pr.state='OPEN';},
  x=>{x.pr.body=x.pr.body.replace('implementation','recovery');},
  x=>{x.pr.body=x.pr.body.replace(opId,'00000000-0000-4000-8000-000000000000');},
  x=>{x.pr.body=x.pr.body.replace(source,'f'.repeat(64));},
  x=>{x.pr.headRefName='fix/4198-diagnostic';},
  x=>{x.pr.mergeCommit.oid='d'.repeat(40);},
  x=>{x.live.commit_ref='d'.repeat(40);},
  x=>{x.live.deploy_id='other-deploy';},
  x=>{x.release.status='RELEASE_INCOMPLETE';},
  x=>{x.release.routes_ok=false;},
  x=>{x.release.deployment_required=false;},
  x=>{x.operation.status='VERIFIED';},
  x=>{x.obligation.state='FULFILLED';},
  x=>{x.operation.evidence.original_code_candidate_pr.source_sha256='d'.repeat(64);}
 ];
 for(const mutate of mutations){
   const x=evidence();mutate(x);
   assert.throws(()=>verifyOriginalInnovationRelease(x),/ORIGINAL_INNOVATION_RELEASE_/,String(mutate));
 }
});
test('safe replay preserves immutable Brain operation and does not mint terminal success',async()=>{
 const fixture=evidence(),p=verifyOriginalInnovationRelease(fixture);
 const op=fixture.operation;
 const config={origin:'https://example.supabase.co',key:'test-Service-role'};
 let version=7,proof=null,casCount=0,getCount=0;
 async function fetchImpl(url,options={}){
  if(url.includes('/rest/v1/rpc/brain_transition_operation')){
    casCount++;
    const body=JSON.parse(options.body);
    assert.equal(body.p_expected_version,version);
    assert.equal(body.p_status,'PLANNED');
    assert.equal(body.p_remote_ref,null);
    assert.equal(body.p_evidence.original_code_production_readback.terminal_success,false);
    proof=body.p_evidence.original_code_production_readback;
    version++;
    return {ok:true,json:async()=>({...op,version,
      evidence:{...op.evidence,original_code_production_readback:proof}})};
  }
  getCount++;
  return {ok:true,json:async()=>[{...op,version,evidence:{
   ...op.evidence,...(proof?{original_code_production_readback:proof}:{})
  }}]};
 }
 const result=await recordOriginalRelease({proof:p,config,fetchImpl});
 assert.equal(result.status,'ORIGINAL_RELEASE_RECEIPT_VERIFIED');
 assert.equal(result.original_still_planned,true);
 assert.equal(casCount,1);
 assert.equal(getCount,2);
 const repeat=await recordOriginalRelease({proof:p,config,fetchImpl});
 assert.equal(repeat.already_recorded,true);
 assert.equal(casCount,1);
 assert.equal(getCount,4);
});
test('release proof is inside existing producer, after immutable website acceptance',()=>{
 const workflow=readFileSync('.github/workflows/production-release-readback.yml','utf8');
 const producer='scripts/brain/innovation-original-code-production-receipt.mjs --record';
 assert.equal((workflow.match(new RegExp(producer,'g'))||[]).length,1);
 assert.ok(workflow.indexOf(producer)>workflow.indexOf('Evaluate immutable Netlify backend production truth'));
 assert.ok(workflow.indexOf(producer)<workflow.indexOf('Capture production readback failure as Brain learning evidence'));
 assert.match(workflow,/success\(\) && steps\.scope\.outputs\.deployment_required == 'true'/);
 assert.doesNotMatch(workflow,/cron:\s*.*innovation-original-code-production-receipt/);
});
