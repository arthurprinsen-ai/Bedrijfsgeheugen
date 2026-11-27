import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {examineOriginalDelivery,planOriginalContinuity,CONTRACT} from '../scripts/brain/innovation-original-delivery-continuity.mjs';
const id='2c1ecc77-58aa-4f25-ae68-e2337853fdc7';
const opId='56e16919-6275-4c2e-9208-6ac0c8a29a29';
const sha='a'.repeat(64),head='b'.repeat(40),merge='c'.repeat(40),deploy='d'.repeat(40);
const rev='2026-10-29T13:19:24.643686+00:00';
const source='quality-learning-v1:powerhouse-agent-runtime-lean-observability-coverage-20261029';
function fixture({decision='CONCRETE_PROTECTED_CHANGE_PROPOSAL_DUE',owner='engineering',pr=false,noop=false}={}){
 const candidate={candidate_id:id,source_key:source,owner_agent:owner};
 const obligation={business_entity:id,change_id:source,payload_sha256:sha,
   owner:'original-agent:'+owner,state:'OPEN',evidence:{source_revision:rev}};
 const operation={id:opId,operation_type:'INNOVATION_INTAKE',status:'PLANNED',remote_ref:null,
   capability_id:owner==='cro'?'agent:agent-growth-market':'agent:agent-integration-engineer',
   correlation_id:'innovation-delivery:'+id,payload_sha256:sha,change_id:source,
   idempotency_key:'innovation-delivery:'+id+':'+sha.slice(0,16),
   evidence:{original_owner_decision:{
     original_owner:owner==='cro'?'agent:agent-growth-market':'agent:agent-integration-engineer',
     source_sha256:sha,source_revision:rev,decision}}};
 if(pr)operation.evidence.original_code_candidate_pr={candidate_id:id,
   source_sha256:sha,source_revision:rev,original_owner:operation.capability_id,
   url:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5908',pr_number:5908,
   head_sha:head,consumer_ack_verified:false,terminal_success:false};
 if(noop)operation.evidence.original_code_nochange_review={candidate_id:id,
   source_sha256:sha,source_revision:rev,consumer_ack_verified:false,implementation_verified:false};
 return {candidate,obligation,operation};
}
function githubPr(overrides={}){
 return {url:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5908',number:5908,
   headRefName:'writer/innovation-'+id.slice(0,8)+'-43754864334',headRefOid:head,
   baseRefName:'main',state:'OPEN',mergeCommit:null,
   body:['Candidate-Type: implementation','Original-Candidate: '+id,
     'Original-Source-SHA256: '+sha,'Original-Source-Revision: '+rev,
     'Original-Operation: '+opId,
     'Writer-Lease-Owner: agent:agent-integration-engineer'].join('\n'),...overrides};
}
test('original engineer keeps source-bound protected build open',()=>{
 const a=examineOriginalDelivery(fixture());
 assert.equal(a.contract,CONTRACT);
 assert.equal(a.stage,'PROTECTED_BUILD_DUE');
 assert.equal(a.terminal_success,false);
 assert.equal(a.consumer_ack_verified,false);
 assert.equal(a.actual_impact,null);
 assert.equal(a.original_state_remains,'PLANNED');
});
test('baseline, CRO and nochange go to distinct safe lanes, not a fake code implementation',()=>{
 assert.equal(examineOriginalDelivery(fixture({decision:'BASELINE_AND_EVALUATION_DESIGN_REQUIRED'})).stage,'BASELINE_OR_SAFE_SCOPE_DUE');
 assert.equal(examineOriginalDelivery(fixture({owner:'cro',decision:'CRO_MEASUREMENT_AND_HOLDOUT_DESIGN_REQUIRED'})).stage,'CRO_CONSENT_BASELINE_AND_HOLDOUT_DUE');
 const n=examineOriginalDelivery(fixture({noop:true}));
 assert.equal(n.stage,'NO_CHANGE_INDEPENDENT_OWNER_REVIEW_DUE');
 assert.equal(n.verified_code_in_production,false);
});
test('PR receipt without independently fetched GitHub PR remains provider due',()=>{
 const a=examineOriginalDelivery(fixture({pr:true}));
 assert.equal(a.stage,'PROVIDER_PR_READBACK_DUE');
 assert.equal(a.production_sha,null);
});
test('open protected PR is not implementation or production',()=>{
 const a=examineOriginalDelivery({...fixture({pr:true}),githubPr:githubPr()});
 assert.equal(a.stage,'PROTECTED_PR_CHECKS_OR_REVIEW_DUE');
 assert.equal(a.pr_number,5908);
});
test('merged PR without production evidence remains pending',()=>{
 const a=examineOriginalDelivery({...fixture({pr:true}),githubPr:githubPr({state:'MERGED',mergeCommit:{oid:merge}})});
 assert.equal(a.stage,'PRODUCTION_PROVIDER_READBACK_DUE');
 assert.equal(a.merge_sha,merge);
 assert.equal(a.verified_code_in_production,false);
});
test('only READY production Netlify deploy with proven GitHub merge ancestry advances to impact verification',()=>{
 const base={...fixture({pr:true}),githubPr:githubPr({state:'MERGED',mergeCommit:{oid:merge}})};
 const preview=examineOriginalDelivery({...base,production:{state:'ready',context:'deploy-preview',id:'deploy01',commit_ref:deploy,current_contains_merge:true}});
 assert.equal(preview.verified_code_in_production,false);
 const ancestorMissing=examineOriginalDelivery({...base,production:{state:'ready',context:'production',id:'deploy01',commit_ref:deploy,current_contains_merge:false}});
 assert.equal(ancestorMissing.verified_code_in_production,false);
 const measuredDue=examineOriginalDelivery({...base,production:{state:'ready',context:'production',id:'deploy01',commit_ref:deploy,current_contains_merge:true}});
 assert.equal(measuredDue.stage,'PRODUCTION_CODE_PRESENT_EFFECT_MEASUREMENT_DUE');
 assert.equal(measuredDue.verified_code_in_production,true);
 assert.equal(measuredDue.independent_impact_verified,false);
 assert.equal(measuredDue.actual_impact,null);
 assert.equal(measuredDue.terminal_success,false);
});
test('changed PR HEAD and nonmerged terminal state stay nonterminal',()=>{
 const f=fixture({pr:true});
 assert.equal(examineOriginalDelivery({...f,githubPr:githubPr({headRefOid:deploy,state:'MERGED',mergeCommit:{oid:merge}})}).stage,'ORIGINAL_PR_HEAD_CHANGED_REVIEW_DUE');
 assert.equal(examineOriginalDelivery({...f,githubPr:githubPr({state:'CLOSED'})}).stage,'PR_CLOSED_WITHOUT_PROTECTED_MERGE_REVIEW_DUE');
 assert.equal(examineOriginalDelivery({...f,githubPr:githubPr({state:'MERGED'})}).stage,'PROTECTED_MERGE_PROVIDER_PROOF_UNAVAILABLE');
});
test('spoofed PR identity or source-owner drift fails closed',()=>{
 const f=fixture({pr:true});
 for(const mutation of [{body:'no source'},{url:'https://github.com/attacker/other/pull/5908'},
   {baseRefName:'malicious'},{headRefName:'recovery/mentions-source'},
   {body:githubPr().body.replace('Original-Source-SHA256: '+sha,'Original-Source-SHA256: '+('f'.repeat(64)))}]){
   assert.throws(()=>examineOriginalDelivery({...f,githubPr:githubPr(mutation)}),/GITHUB_PR_LINEAGE_CONFLICT/);
 }
 f.operation.capability_id='agent:other';
 assert.throws(()=>examineOriginalDelivery(f),/SOURCE_OWNER_IDENTITY_DRIFT/);
});
test('same provider proof yields stable idempotency fingerprint on later daily attempts',()=>{
 const f=fixture({pr:true}),g=githubPr({state:'MERGED',mergeCommit:{oid:merge}});
 const first=examineOriginalDelivery({...f,githubPr:g,checkedAt:'2026-11-17T19:00:00Z'});
 const second=examineOriginalDelivery({...f,githubPr:g,checkedAt:'2026-11-18T19:00:00Z'});
 assert.equal(first.assessment_fingerprint,second.assessment_fingerprint);
});
test('original 14-count/candidate identity must never be silently dropped',()=>{
 const f=fixture({pr:true});
 const snapshot={candidates:[f.candidate],obligations:[f.obligation],intakes:[f.operation]};
 const report={contract:'ORIGINAL_INNOVATION_AGENT_OWNER_READBACK_V1',counts:{candidates:1,obligations:1,intakes:1}};
 assert.equal(planOriginalContinuity({snapshot,report}).length,1);
 assert.throws(()=>planOriginalContinuity({snapshot:{...snapshot,obligations:[]},report}),/SOURCE_COUNT_DRIFT/);
 assert.throws(()=>planOriginalContinuity({snapshot:{...snapshot,intakes:[]},
   report:{...report,counts:{candidates:1,obligations:1,intakes:0}}}),/ORPHAN_ORIGINAL/);
});

test('unproven VERIFIED status remains forbidden even with an existing GitHub receipt',()=>{
 const f=fixture({pr:true});
 f.operation.status='VERIFIED';
 assert.throws(()=>examineOriginalDelivery(f),/UNSUPPORTED_ORIGINAL_OPERATION_STATE/);
});
test('independently proven original consumer ACK is not downgraded and still requires effect readback',()=>{
 const f=fixture({pr:true});
 f.operation.status='VERIFIED';
 f.operation.remote_ref='provider-proof-original-verified-123';
 f.operation.evidence.consumer_owner=f.operation.capability_id;
 f.operation.evidence.source_revision=rev;
 f.operation.evidence.independent_consumer_readback=true;
 const a=examineOriginalDelivery(f);
 assert.equal(a.stage,'ORIGINAL_CONSUMER_ACK_VERIFIED_IMPACT_READBACK_DUE');
 assert.equal(a.consumer_ack_verified,true);
 assert.equal(a.original_state_remains,'VERIFIED');
 assert.equal(a.independent_impact_verified,false);
 assert.equal(a.terminal_success,false);
});

test('historical protected release recorded by original Brain is reconciled across legitimate final PR head',()=>{
 const f=fixture({pr:true}),finalHead='e'.repeat(40);
 f.operation.evidence.original_code_candidate_release={
   contract:'ORIGINAL_INNOVATION_PROTECTED_RELEASE_READBACK_V1',
   original_candidate_id:id,original_pr_url:f.operation.evidence.original_code_candidate_pr.url,
   initial_pr_head_sha:head,final_protected_pr_head_sha:finalHead,
   merge_sha:merge,github_merged:true,protected_ci:'PASSED',
   independent_release_readback_result:'SUCCESS',
   implementation_technical_release_verified:true,
   netlify_state:'READY_CURRENT_PRODUCTION',netlify_deploy_id:'native-deploy-001',netlify_commit_sha:merge
 };
 f.operation.evidence.original_code_production_readback={
   contract:'ORIGINAL_INNOVATION_CODE_RELEASE_INDEPENDENT_READBACK_V1',
   candidate_id:id,original_operation_id:opId,original_owner:f.operation.capability_id,
   source_revision:rev,source_sha256:sha,github_pr_final_head:finalHead,
   github_merge_commit_sha:merge,netlify_deploy_id:'native-deploy-001',
   netlify_deploy_commit_sha:merge,netlify_context:'production',
   netlify_deploy_status:'ready',independently_verified_provider_release:true,
   original_innovation_fully_delivered:false,independent_business_effect_verified:false
 };
 const pr=githubPr({state:'MERGED',headRefOid:finalHead,mergeCommit:{oid:merge}});
 const a=examineOriginalDelivery({...f,githubPr:pr});
 assert.equal(a.stage,'HISTORICAL_NATIVE_CODE_RELEASE_VERIFIED_EFFECT_MEASUREMENT_DUE');
 assert.equal(a.historically_verified_code_release,true);
 assert.equal(a.verified_code_in_production,false,'historic evidence is not a fresh current-deploy GET');
 assert.equal(a.production_deploy_id,'native-deploy-001');
 assert.equal(a.independent_impact_verified,false);
 assert.equal(a.terminal_success,false);
 const sourceDrift=fixture({pr:true});
 sourceDrift.operation.evidence.original_code_candidate_release=f.operation.evidence.original_code_candidate_release;
 sourceDrift.operation.evidence.original_code_production_readback={
   ...f.operation.evidence.original_code_production_readback,
   source_sha256:'f'.repeat(64)
 };
 assert.equal(examineOriginalDelivery({...sourceDrift,githubPr:pr}).stage,'ORIGINAL_PR_HEAD_CHANGED_REVIEW_DUE');
 const now=examineOriginalDelivery({...f,githubPr:pr,production:{
   state:'ready',context:'production',id:'latest-provider-deploy',
   commit_ref:deploy,current_contains_merge:true
 }});
 assert.equal(now.stage,'PRODUCTION_CODE_PRESENT_EFFECT_MEASUREMENT_DUE');
 assert.equal(now.verified_code_in_production,true);
 assert.equal(now.terminal_success,false);
});

test('daily candidate execution survives unrelated improve failure but never bypasses canonical daily admission',()=>{
 const workflow=readFileSync('.github/workflows/powerhouse-daily-self-evolution.yml','utf8');
 const job=workflow.slice(workflow.indexOf('  original-innovation-code-candidate:'));
 assert.match(job,/needs: \[improve, daily-admission\]/);
 assert.match(job,/needs\.daily-admission\.result == 'success'/);
 assert.match(job,/needs\.improve\.result == 'failure'/);
 assert.match(job,/execution_scope == 'original_code_recovery'/);
 assert.match(job,/node scripts\/brain\/innovation-original-code-delivery\.mjs --prepare/);
 assert.match(job,/gh pr merge "\$PR_URL" --auto --squash/);
 assert.doesNotMatch(job,/force-push|--admin|--bypass|workflow_dispatch.*\n\s+- cron:/);
});

test('manual delivery recovery uses the SAME original workflow and daily admission is fenced',()=>{
 const workflow=readFileSync('.github/workflows/powerhouse-daily-self-evolution.yml','utf8');
 assert.match(workflow,/^\s+- original_delivery_recovery$/m);
 assert.equal((workflow.match(/inputs\.execution_scope != 'original_delivery_recovery'/g)||[]).length,3);
 assert.equal((workflow.match(/^\s+- cron:/gm)||[]).length,1,'no extra scheduler');
 const start=workflow.indexOf('  original-delivery-recovery:');
 assert.ok(start>0);
 const recovery=workflow.slice(start,workflow.indexOf('  model-freshness:',start));
 assert.match(recovery,/execution_scope == 'original_delivery_recovery'/);
 assert.match(recovery,/permissions:\s*\n\s+contents: read\s*\n\s+actions: read\s*\n\s+pull-requests: read/);
 assert.match(recovery,/node --test tests\/brain-innovation-delivery-continuity-20261117\.test\.mjs/);
 assert.match(recovery,/node scripts\/brain\/innovation-original-delivery-continuity\.mjs --reconcile/);
 assert.doesNotMatch(recovery,/codex-action|gh pr create|gh pr merge|NETLIFY_AUTH_TOKEN|NETLIFY_SITE_ID|contents: write|pull-requests: write/);
});


test('verified quality analysis receipt does not erase a genuine no-change or protected PR stage',()=>{
 const fp='portal-visual-density-oversized-responsive-cascade-v1';
 for(const options of [{noop:true},{pr:true}]){
  const f=fixture({...options,decision:'BASELINE_AND_EVALUATION_DESIGN_REQUIRED'});
  const {candidate:c,obligation:b,operation:o}=f;
  c.component_id='portal-v2';c.proposed_action={kind:'bounded_learning_followup'};c.baseline={quality_fingerprint:fp};
  o.evidence.original_owner_decision.fingerprint='1'.repeat(64);o.evidence.original_agent_pre_review={fingerprint:'2'.repeat(64)};
  const receipt={contract:'ORIGINAL_INNOVATION_ALL_FOURTEEN_EVIDENCE_RECONCILIATION_V1',candidate_id:id,original_operation_id:opId,original_owner:o.capability_id,source_revision:rev,source_sha256:sha,original_change_id:c.source_key,source_decision_fingerprint:'1'.repeat(64),source_pre_review_fingerprint:'2'.repeat(64),source_quality:{status:'verified',original_fingerprint:fp,source_evidence_sha256:'3'.repeat(64),historical_claim_not_current_production_proof:true},fingerprint:'4'.repeat(64),next_action:'ORIGINAL_MOBILE_VISUAL_DENSITY_EXACT_PRODUCTION_RECHECK',disposition:'HISTORICAL_VERIFIED_QUALITY_SOURCE_CURRENT_EFFECT_DUE',evidence_type:'HISTORICAL_FIRST_PARTY_QUALITY_EVENT_UNCONFIRMED_AS_CURRENT_PRODUCTION',independently_verified_current_effect:false,consumer_ack_verified:false,terminal_success:false,historical_baseline_not_current_effect:true,protected_review_required:true,automated_external_provider_dispatch:false};
  o.evidence.original_evidence_reconciliation=receipt;
  const a=examineOriginalDelivery(f);assert.equal(a.stage,options.noop?'NO_CHANGE_INDEPENDENT_OWNER_REVIEW_DUE':'PROVIDER_PR_READBACK_DUE');assert.equal(a.terminal_success,false);assert.equal(a.independent_impact_verified,false);
 }
});
