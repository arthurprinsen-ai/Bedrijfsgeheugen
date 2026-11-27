import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {selectOriginalCodeCandidate,isExactOriginalInnovationImplementationPr,checkChangedPaths,classifyOriginalCodeDiff,CONTRACT,INNOVATION_METHOD_FAMILIES,originalInnovationMethodPlan,validateOriginalInnovationMethodEvidence} from '../scripts/brain/innovation-original-code-delivery.mjs';
import {evaluateOriginalNochangeReview} from '../scripts/brain/innovation-original-code-nochange-review.mjs';
import {verifyOriginalCandidateReceipt} from '../scripts/brain/innovation-original-code-pr-receipt.mjs';
import {compileLearningEvaluationPlan,validateEvaluationContract} from '../scripts/brain/learning-canonicalization-gate.mjs';

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const id='2c1ecc77-58aa-4f25-ae68-e2337853fdc7';
const payload='a'.repeat(64);
const revision='source-rev-20261115';
function fixture(){
  const proposed_action={action:'Extend existing authorized runtime writers to carry real actor, skill, source and before after evidence into canonical cycle events with privacy-safe readback.'};
  const rollback_plan={rollback:'revert through protected delivery'};
  const candidate={candidate_id:id,source_key:'quality-learning-v1:runtime',component_id:'powerhouse-decision-cycle-evidence',
    owner_agent:'engineering',status:'candidate',safety_class:'review_required',created_at:'2026-10-29T10:00:00Z',
    proposed_action,rollback_plan};
  const obligation={business_entity:id,change_id:candidate.source_key,state:'OPEN',
    payload_sha256:payload,evidence:{source_revision:revision}};
  const pre={original_owner:'agent:agent-integration-engineer',source_revision:revision,
    exact_source_action_digest:hash(proposed_action),exact_source_rollback_digest:hash(rollback_plan),
    consumer_ack_verified:false,external_side_effect:false};
  const decision={original_owner:pre.original_owner,source_revision:revision,source_sha256:payload,
    original_action_digest:hash(proposed_action),decision:'CONCRETE_PROTECTED_CHANGE_PROPOSAL_DUE',
    actionable_work_package:true,production_mutation_authorized:false,
    consumer_ack_verified:false,fingerprint:'b'.repeat(64)};
  const op={id:'b37f9278-6c04-49d0-8424-4517a538aabb',operation_type:'INNOVATION_INTAKE',
    capability_id:pre.original_owner,status:'PLANNED',version:4,remote_ref:null,
    change_id:candidate.source_key,payload_sha256:payload,
    correlation_id:'innovation-delivery:'+id,
    idempotency_key:'innovation-delivery:'+id+':'+payload.slice(0,16),
    evidence:{original_agent_pre_review:pre,original_owner_decision:decision}};
  const snapshot={candidates:[candidate],obligations:[obligation],intakes:[op]};
  const report={contract:'ORIGINAL_INNOVATION_AGENT_OWNER_READBACK_V1',
    counts:{candidates:1,obligations:1,intakes:1}};
  return {snapshot,report};
}
test('source-bound original engineering decision selects one candidate without claiming deployment',()=>{
  const result=selectOriginalCodeCandidate(fixture());
  assert.equal(result.contract,CONTRACT);
  assert.equal(result.selected,true);
  assert.equal(result.candidate_id,id);
  assert.equal(result.automatic_production_mutation,false);
  assert.equal(result.consumer_ack_verified,false);
  assert.deepEqual(result.allowed_source_paths,[
    'platform/portal/powerhouse-existing-integration-read-model.mjs',
    'platform/system-map/canonical-system-map.mjs'
  ]);
});
test('already recorded GitHub candidate is not regenerated',()=>{
  const result=selectOriginalCodeCandidate({...fixture(),existingPrFor:x=>x===id});
  assert.equal(result.selected,false);
  assert.equal(result.existing,1);
});
test('original owner decision cannot silently bypass source identity',()=>{
  const o=fixture();o.snapshot.intakes[0].payload_sha256='f'.repeat(64);
  assert.throws(()=>selectOriginalCodeCandidate(o),/SOURCE_BINDING_INCOMPLETE/);
});
test('pre-review mismatch cannot be turned into green',()=>{
  const o=fixture();o.snapshot.intakes[0].evidence.original_agent_pre_review.source_revision='stale';
  assert.throws(()=>selectOriginalCodeCandidate(o),/PRE_REVIEW_CONFLICT/);
});
test('read-only proposal with old PR reference is held, not rebuilt',()=>{
  const o=fixture();o.snapshot.candidates[0].proposed_action.parent_pr=5109;
  const actionHash=hash(o.snapshot.candidates[0].proposed_action);
  o.snapshot.intakes[0].evidence.original_agent_pre_review.exact_source_action_digest=actionHash;
  o.snapshot.intakes[0].evidence.original_owner_decision.original_action_digest=actionHash;
  assert.equal(selectOriginalCodeCandidate(o).selected,false);
});
test('bounded diff rejects workflow, destructive paths, tests-only and fake learning',()=>{
  const workorder=selectOriginalCodeCandidate(fixture());
  const okay=[
    'platform/portal/powerhouse-existing-integration-read-model.mjs',
    'tests/brain-innovation-autonomous-build-20261115.test.mjs',
    'brain/learning/2026-11-15-innovation-engineering-code-v1.json',
    'docs/changes/2026-11-15-innovation-engineering-code-v1.md',
    'docs/development-ledger-events/2026-11-15-innovation-engineering-code-v1.md'
  ];
  assert.equal(checkChangedPaths({workorder,changed:okay}).source.length,1);
  for(const bad of ['.github/workflows/powerhouse-daily-self-evolution.yml',
    'supabase/migrations/20261115000000_unsafe.sql','AGENTS.md']){
    assert.throws(()=>checkChangedPaths({workorder,changed:[...okay,bad]}),/PATH_SCOPE/);
  }
  assert.throws(()=>checkChangedPaths({workorder,changed:okay,deleted:[okay[0]]}),/DELETION_FORBIDDEN/);
  assert.throws(()=>checkChangedPaths({workorder,changed:okay.slice(1)}),/PATH_SCOPE/);
});

test('PR receipt only records provider-linked candidate and cannot invent verified ACK',()=>{
  const f=fixture(),workorder=selectOriginalCodeCandidate(f);
  const pr={baseRefName:'main',state:'OPEN',
    url:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/999999',
    headRefOid:'c'.repeat(40),
    body:'Original-Candidate: '+workorder.candidate_id+'\nOriginal-Source-Revision: '+workorder.source_revision+
      '\nOriginal-Source-SHA256: '+workorder.source_sha256};
  const decision=verifyOriginalCandidateReceipt({workorder,pr,operation:f.snapshot.intakes[0]});
  assert.equal(decision.already_recorded,false);
  assert.equal(decision.receipt.consumer_ack_verified,false);
  assert.equal(decision.receipt.terminal_success,false);
  assert.equal(decision.receipt.production_not_proven,true);
  assert.throws(()=>verifyOriginalCandidateReceipt({workorder,pr:{...pr,state:'MERGED'},operation:f.snapshot.intakes[0]}),
    /UNTRUSTED_GITHUB_PR/);
  assert.throws(()=>verifyOriginalCandidateReceipt({workorder,pr,operation:{...f.snapshot.intakes[0],status:'VERIFIED'}}),
    /ORIGINAL_SOURCE_CHANGED/);
  f.snapshot.intakes[0].evidence.original_code_candidate_pr={...decision.receipt,url:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/12345'};
  assert.throws(()=>verifyOriginalCandidateReceipt({workorder,pr,operation:f.snapshot.intakes[0]}),/CONFLICTING_PRIOR_BUILD/);
});

test('network-derived GitHub PR receipt is kept in native Brain, never dumped to local artifact',()=>{
  const source=readFileSync('scripts/brain/innovation-original-code-pr-receipt.mjs','utf8');
  assert.doesNotMatch(source,/writeFileSync\s*\(/);
  assert.match(source,/brain_transition_operation/);
  assert.match(source,/INDEPENDENT_READBACK_FAILED/);
  assert.match(source,/JSON\.stringify\(safe\)/);
});


test('legitimate zero changed files is an audited no-op, never a fake implementation',()=>{
  const workorder=selectOriginalCodeCandidate(fixture());
  const result=classifyOriginalCodeDiff({workorder,changed:[],deleted:[]});
  assert.equal(result.has_changes,false);
  assert.equal(result.status,'NO_CODE_CHANGE_INDEPENDENT_REVIEW_DUE');
  assert.equal(result.implementation_verified,false);
  assert.equal(result.terminal_success,false);
  assert.throws(()=>classifyOriginalCodeDiff({workorder,changed:[],deleted:['platform/system-map/canonical-system-map.mjs']}),/DELETION_FORBIDDEN|PATH_SCOPE/);
});

test('no-change review requires identical ORIGINAL operation, owner, source and branch SHA',()=>{
  const f=fixture(),workorder=selectOriginalCodeCandidate(f);
  const plan=evaluateOriginalNochangeReview({workorder,operation:f.snapshot.intakes[0],headSha:'a'.repeat(40),observedAt:'2026-11-15T19:24:34Z'});
  assert.equal(plan.already_recorded,false);
  assert.equal(plan.receipt.implementation_verified,false);
  assert.equal(plan.receipt.terminal_success,false);
  assert.equal(plan.receipt.consumer_ack_verified,false);
  assert.equal(plan.receipt.original_operation_stays,'PLANNED');
  f.snapshot.intakes[0].evidence.original_code_nochange_review=plan.receipt;
  const replay=evaluateOriginalNochangeReview({workorder,operation:f.snapshot.intakes[0],headSha:'a'.repeat(40)});
  assert.equal(replay.already_recorded,true);
  assert.equal(selectOriginalCodeCandidate(f).selected,false,'same source no-change review must not spend again');
  f.snapshot.intakes[0].evidence.original_code_nochange_review={...plan.receipt,source_sha256:'f'.repeat(64)};
  assert.throws(()=>selectOriginalCodeCandidate(f),/ORIGINAL_NOCHANGE_REVIEW_CONFLICT/);
});
test('reject invalid no-change review without mutating a Brain source',()=>{
  const f=fixture(),workorder=selectOriginalCodeCandidate(f);
  assert.throws(()=>evaluateOriginalNochangeReview({workorder,operation:f.snapshot.intakes[0],headSha:'untrusted'}),/INVALID_ORIGINAL_IDENTITY/);
  assert.throws(()=>evaluateOriginalNochangeReview({workorder,operation:{...f.snapshot.intakes[0],status:'VERIFIED'},headSha:'a'.repeat(40)}),/SOURCE_VERSION_OWNER_OR_DECISION_DRIFT/);
  assert.throws(()=>evaluateOriginalNochangeReview({workorder,operation:{...f.snapshot.intakes[0],evidence:{}},headSha:'a'.repeat(40)}),/SOURCE_VERSION_OWNER_OR_DECISION_DRIFT/);
});


test('exact GitHub implementation identity differentiates PR from unrelated recovery text',()=>{
  const w=selectOriginalCodeCandidate(fixture());
  const valid={
    headRefName:'writer/innovation-'+w.candidate_id.slice(0,8)+'-43752164113',
    body:[
      'Parent-P0: #4198',
      'Candidate-Type: implementation',
      'Original-Candidate: '+w.candidate_id,
      'Original-Source-SHA256: '+w.source_sha256,
      'Original-Source-Revision: '+w.source_revision,
      'Original-Operation: '+w.operation_id,
      'Writer-Lease-Owner: agent:agent-integration-engineer'
    ].join('\n')
  };
  const args={pr:valid,candidateId:w.candidate_id,sourceSha:w.source_sha256,sourceRevision:w.source_revision};
  assert.equal(isExactOriginalInnovationImplementationPr(args),true);
  assert.equal(isExactOriginalInnovationImplementationPr({...args,pr:{...valid,headRefName:'fix/4198-original-code-nochange-reconcile-20261115'}}),false);
  assert.equal(isExactOriginalInnovationImplementationPr({...args,pr:{...valid,body:valid.body.replace('Candidate-Type: implementation','Candidate-Type: recovery')}}),false);
  assert.equal(isExactOriginalInnovationImplementationPr({...args,pr:{...valid,body:valid.body.replace('Original-Source-SHA256: '+w.source_sha256,'Original-Source-SHA256: '+('f'.repeat(64)))}}),false);
  assert.equal(isExactOriginalInnovationImplementationPr({...args,pr:{...valid,body:valid.body+'\nOriginal-Candidate: '+w.candidate_id.replace(/.$/,'f'),headRefName:'writer/innovation-fake-123'}}),false);
  assert.equal(isExactOriginalInnovationImplementationPr({...args,pr:{...valid,body:'Mentioned original candidate '+w.candidate_id+' during repair, not a built PR'}}),false);
});
test('one canonical candidate selector passes exact immutable source identity into GitHub dedupe gate',()=>{
  const f=fixture(),w=selectOriginalCodeCandidate(f);
  let call=null;
  const result=selectOriginalCodeCandidate({...f,existingPrFor:(id,sha,rev)=>{
    call={id,sha,rev};return true;
  }});
  assert.deepEqual(call,{id:w.candidate_id,sha:w.source_sha256,rev:w.source_revision});
  assert.equal(result.selected,false);
  assert.equal(result.existing,1);
});


test('original agent PR must include both human-readable change and original development ledger',()=>{
  const w=selectOriginalCodeCandidate(fixture());
  const paths=[
    'platform/portal/powerhouse-existing-integration-read-model.mjs',
    'tests/brain-innovation-canonical-evidence-20261115.test.mjs',
    'brain/learning/2026-11-15-innovation-canonical-evidence-v1.json',
    'docs/changes/2026-11-15-innovation-canonical-evidence-v1.md',
    'docs/development-ledger-events/2026-11-15-innovation-canonical-evidence-v1.md'
  ];
  assert.equal(checkChangedPaths({workorder:w,changed:paths}).docs.length,2);
  for(const missing of [paths[3],paths[4]]){
    assert.throws(()=>checkChangedPaths({workorder:w,changed:paths.filter(p=>p!==missing)}),
      /PATH_SCOPE_OR_EVIDENCE_MISSING/);
  }
  assert.throws(()=>checkChangedPaths({workorder:w,changed:[...paths,
    'docs/changes/2026-11-15-innovation-extra-v1.md']}),/PATH_SCOPE_OR_EVIDENCE_MISSING/);
});

test('original engineer derives runtime false-green canary and security shadow without false evidence',()=>{
  const runtime={compiler:{failure_class:'FALSE_GREEN',scope:'RUNTIME',machine_enforceable:true}};
  const runtimePlan=compileLearningEvaluationPlan(runtime);
  assert.equal(runtimePlan.canary_required,true);
  assert.equal(runtimePlan.shadow_required,false);
  const path='tests/brain-innovation-original-code-delivery-20261115.test.mjs';
  assert.throws(()=>validateEvaluationContract({evaluation:{historical_replay:[path]}},runtimePlan),
    /LEARNING_EVALUATION_TESTS_REQUIRED:canary/);
  const valid=validateEvaluationContract({evaluation:{historical_replay:[path],canary:[path]}},runtimePlan);
  assert.deepEqual(valid.required_modes,['historical_replay','canary']);
  const securityPlan=compileLearningEvaluationPlan({compiler:{failure_class:'SECURITY',scope:'RUNTIME',machine_enforceable:true}});
  assert.throws(()=>validateEvaluationContract({evaluation:{historical_replay:[path],canary:[path]}},securityPlan),
    /LEARNING_EVALUATION_TESTS_REQUIRED:shadow/);
  assert.deepEqual(validateEvaluationContract({evaluation:{historical_replay:[path],canary:[path],shadow:[path]}},securityPlan).required_modes,
    ['historical_replay','shadow','canary']);
});

test('same original workflow requires canonical evaluation and both original docs before PR creation',()=>{
  const workflow=readFileSync('.github/workflows/powerhouse-daily-self-evolution.yml','utf8');
  const src=readFileSync('scripts/brain/innovation-original-code-delivery.mjs','utf8');
  assert.match(workflow,/MUST also create ONE NEW docs\/changes/);
  assert.match(workflow,/docs\/development-ledger-events\/2026-11-\*-innovation/);
  assert.match(workflow,/test "\$\{#paths\[@\]\}" -ge 5/);
  assert.match(src,/validateEvaluationContract\(lesson,plan\)/);
  assert.match(src,/compileLearningEvaluationPlan\(lesson\)/);
  assert.match(src,/ORIGINAL_DOC_SOURCE_OR_CONTENT_MISSING/);
});


test('verified original quality candidate reaches same scoped analyst and protected builder; unguarded and duplicates remain held',()=>{
 const f=fixture(),c=f.snapshot.candidates[0],op=f.snapshot.intakes[0],ob=f.snapshot.obligations[0];
 const fp='portal-visual-density-oversized-responsive-cascade-v1';
 c.component_id='portal-v2';c.source_key='quality-learning-v1:'+fp;c.baseline={quality_fingerprint:fp};
 c.proposed_action={kind:'bounded_learning_followup',source_quality_fingerprint:fp,human_review_required:true,direct_production_mutation:false,provider_dispatch_authorized:false};
 op.change_id=ob.change_id=c.source_key;
 const pre=op.evidence.original_agent_pre_review,decision=op.evidence.original_owner_decision;
 pre.exact_source_action_digest=hash(c.proposed_action);pre.fingerprint='d'.repeat(64);
 decision.original_action_digest=hash(c.proposed_action);decision.decision='BASELINE_AND_EVALUATION_DESIGN_REQUIRED';decision.actionable_work_package=false;
 assert.equal(selectOriginalCodeCandidate(f).selected,false);
 const receipt={contract:'ORIGINAL_INNOVATION_ALL_FOURTEEN_EVIDENCE_RECONCILIATION_V1',candidate_id:id,original_operation_id:op.id,original_owner:op.capability_id,source_revision:revision,source_sha256:payload,original_change_id:c.source_key,source_decision_fingerprint:decision.fingerprint,source_pre_review_fingerprint:pre.fingerprint,source_quality:{status:'verified',original_fingerprint:fp,source_evidence_sha256:'e'.repeat(64),historical_claim_not_current_production_proof:true,regression_ref_present:true},fingerprint:'f'.repeat(64),next_action:'ORIGINAL_MOBILE_VISUAL_DENSITY_EXACT_PRODUCTION_RECHECK',disposition:'HISTORICAL_VERIFIED_QUALITY_SOURCE_CURRENT_EFFECT_DUE',evidence_type:'HISTORICAL_FIRST_PARTY_QUALITY_EVENT_UNCONFIRMED_AS_CURRENT_PRODUCTION',independently_verified_current_effect:false,consumer_ack_verified:false,terminal_success:false,historical_baseline_not_current_effect:true,protected_review_required:true,automated_external_provider_dispatch:false};
 op.evidence.original_evidence_reconciliation=receipt;
 const w=selectOriginalCodeCandidate(f);assert.equal(w.selected,true);assert.equal(w.work_kind,'SOURCE_BOUND_BASELINE_CHALLENGER');assert.equal(w.current_effect_verified,false);assert.equal(w.automatic_production_mutation,false);assert.equal(w.source_quality_receipt_fingerprint,receipt.fingerprint);assert.deepEqual(w.allowed_source_paths,['portal-v2/csrd-impact.css','portal-v2/csrd-mobile-saas.css','portal-v2/app.css']);
 assert.equal(selectOriginalCodeCandidate({...f,existingPrFor:()=>true}).selected,false);
 receipt.source_quality.status='guard_required';assert.equal(selectOriginalCodeCandidate(f).selected,false);receipt.source_quality.status='verified';
 receipt.source_revision='wrong';assert.throws(()=>selectOriginalCodeCandidate(f),/ORIGINAL_QUALITY_RECEIPT_SOURCE_OR_AUTHORITY_DRIFT/);receipt.source_revision=revision;
 c.proposed_action.direct_production_mutation=true;pre.exact_source_action_digest=decision.original_action_digest=hash(c.proposed_action);assert.throws(()=>selectOriginalCodeCandidate(f),/LEARNING_SOURCE_POLICY_CONFLICT/);
});

test('method catalog covers all 14 families and original work order receives source-specific methods',()=>{
  assert.equal(INNOVATION_METHOD_FAMILIES.length,14);
  assert.equal(new Set(INNOVATION_METHOD_FAMILIES.map(f=>f.id)).size,14);
  assert.ok(INNOVATION_METHOD_FAMILIES.every(f=>f.source.startsWith('https://')&&f.methods.length>=5&&f.evidence));
  const w=selectOriginalCodeCandidate(fixture());
  assert.deepEqual(w.innovation_method_plan,originalInnovationMethodPlan(w.component_id));
  assert.ok(w.innovation_method_plan.families.some(f=>f.id==='ai'));
  assert.ok(originalInnovationMethodPlan('portal-v2').families.some(f=>f.id==='customer'));
  assert.ok(originalInnovationMethodPlan('unknown').families.some(f=>f.id==='risk'));
  assert.equal(w.innovation_method_plan.effect_verified,false);
  assert.equal(w.automatic_production_mutation,false);
});
test('method evidence must bind exact source, compare alternatives and cannot claim effect',()=>{
  const w=selectOriginalCodeCandidate(fixture());
  const e={version:w.innovation_method_plan.version,candidate_id:w.candidate_id,
    source_revision:w.source_revision,source_sha256:w.source_sha256,
    methods:['TDD','champion challenger'],baseline_ref:'test fixture baseline',metric:'failed contract count',
    incumbent:'existing source version',challenger:'minimal bounded fix',comparison_ref:'same regression fixture',
    decision_reason:'reproduced defect fixed',rollback:'protected revert',current_effect_verified:false};
  assert.equal(validateOriginalInnovationMethodEvidence(w,e),true);
  for(const wrong of [{methods:['TDD']},{methods:['TDD','TDD']},{methods:['TDD','unknown']},
    {source_revision:'other'},{source_sha256:'wrong'},{candidate_id:'wrong'},
    {baseline_ref:''},{challenger:e.incumbent},{comparison_ref:''},{current_effect_verified:true}])
    assert.throws(()=>validateOriginalInnovationMethodEvidence(w,{...e,...wrong}),/INNOVATION_METHOD_EVIDENCE_INCOMPLETE/);
  assert.throws(()=>validateOriginalInnovationMethodEvidence(w,null),/INNOVATION_METHOD_EVIDENCE_INCOMPLETE/);
});
