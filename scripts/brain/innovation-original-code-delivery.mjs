import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {appendFileSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {readCanonicalRows, evaluateOriginalOwnerHandoff} from './innovation-original-owner-readback.mjs';
import {trustedBrainReadConfig} from './planned-action-review-audit.mjs';
import {compileLearningEvaluationPlan, validateEvaluationContract} from './learning-canonicalization-gate.mjs';

export const CONTRACT='ORIGINAL_INNOVATION_BOUNDED_CODE_CANDIDATE_V1';
export const WORK_ORDER='artifacts/quality/original-innovation-code-workorder.json';
const REPO='arthurprinsen-ai/Bedrijfsgeheugen';
const SHA=/^[a-f0-9]{64}$/i;
const GIT_SHA=/^[a-f0-9]{40}$/i;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fail=code=>{throw new Error('ORIGINAL_INNOVATION_CODE_'+code);};
const scopes=Object.freeze({
  'powerhouse-decision-cycle-evidence':[
    'platform/portal/powerhouse-existing-integration-read-model.mjs',
    'platform/system-map/canonical-system-map.mjs'
  ],
  'powerhouse-sales-cycle-execution-read-model':[
    'platform/portal/powerhouse-existing-integration-read-model.mjs',
    'portal-v2/control-plane-cockpit.js'
  ],
  'powerhouse-commercial-message-plan':[
    'supabase/functions/powerhouse-commercial-message-composer/index.ts'
  ]
});
const priority=['powerhouse-decision-cycle-evidence',
  'powerhouse-sales-cycle-execution-read-model','powerhouse-commercial-message-plan'];
const text=value=>typeof value==='string'?value.trim():'';
const obj=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

// A named parent PR is an immutable prerequisite, NOT automatically a duplicate
// of the child's different, source-bound read-model implementation. Fail closed
// until native GitHub independently proves an exact protected main ancestor,
// an implementation PR, and NO overlapping child source paths.
export function classifyVerifiedOriginalParentPr({parentPr,pr,mainSha,compare,childId,childAllowedSourcePaths}={}){
  if(!Number.isSafeInteger(parentPr)||parentPr<1||parentPr>999999||
     !UUID.test(childId)||!Array.isArray(childAllowedSourcePaths)||
     !childAllowedSourcePaths.length||new Set(childAllowedSourcePaths).size!==childAllowedSourcePaths.length||
     !GIT_SHA.test(mainSha)||pr?.number!==parentPr||
     pr?.url!=='https://github.com/'+REPO+'/pull/'+parentPr||
     pr?.state!=='MERGED'||pr?.baseRefName!=='main'||
     !GIT_SHA.test(pr?.mergeCommit?.oid)||!Array.isArray(pr?.files)||
     !pr.files.length||!pr.files.every(f=>typeof f?.path==='string'&&f.path.length>0)||
     pr.files.some(f=>childAllowedSourcePaths.includes(f.path))||
     !['ahead','identical'].includes(compare?.status)||
     compare?.merge_base_commit?.sha!==pr.mergeCommit.oid)return null;
  const lines=String(pr.body??'').split(/\r?\n/).map(s=>s.trim());
  if(!lines.includes('Candidate-Type: implementation')||
     lines.includes('Original-Candidate: '+childId)||
     lines.includes('Original-Operation: '+childId))return null;
  return Object.freeze({
    contract:'ORIGINAL_INNOVATION_DISTINCT_PARENT_PROTECTED_SOURCE_V1',
    parent_pr:parentPr,parent_url:pr.url,merge_sha:pr.mergeCommit.oid,
    original_candidate_id:childId,verified_against_main_sha:mainSha,
    protected_main_ancestor:true,source_paths_disjoint:true,
    parent_is_not_child_implementation:true,
    child_implementation_proven:false,child_consumer_ack_verified:false
  });
}
function verifiedOriginalParentFor(parentPr,{candidateId,allowedSourcePaths}={}){
  if(!Number.isSafeInteger(parentPr)||parentPr<1||parentPr>999999||
     !UUID.test(candidateId)||!Array.isArray(allowedSourcePaths))return null;
  try{
    const pr=JSON.parse(execFileSync('gh',
      ['pr','view',String(parentPr),'--repo',REPO,'--json',
        'number,url,state,baseRefName,mergeCommit,body,files'],
      {encoding:'utf8',timeout:25000,maxBuffer:4000000}));
    if(pr?.state!=='MERGED'||!GIT_SHA.test(pr?.mergeCommit?.oid))return null;
    const main=JSON.parse(execFileSync('gh',['api','repos/'+REPO+'/branches/main'],
      {encoding:'utf8',timeout:25000,maxBuffer:3000000}));
    if(!GIT_SHA.test(main?.commit?.sha))return null;
    const comparison=JSON.parse(execFileSync('gh',
      ['api','repos/'+REPO+'/compare/'+pr.mergeCommit.oid+'...'+main.commit.sha],
      {encoding:'utf8',timeout:25000,maxBuffer:3000000}));
    return classifyVerifiedOriginalParentPr({
      parentPr,pr,mainSha:main.commit.sha,compare:comparison,
      childId:candidateId,childAllowedSourcePaths:allowedSourcePaths
    });
  }catch{return null;}
}

export function selectOriginalCodeCandidate({snapshot,report,existingPrFor=()=>false,verifiedParentFor=()=>null}={}){
  if(report?.contract!=='ORIGINAL_INNOVATION_AGENT_OWNER_READBACK_V1')fail('SOURCE_REPORT_REQUIRED');
  if(![snapshot?.candidates,snapshot?.obligations,snapshot?.intakes].every(Array.isArray))fail('SOURCE_ARRAYS_REQUIRED');
  if(snapshot.candidates.length!==report.counts?.candidates||
     snapshot.obligations.length!==report.counts?.obligations||
     snapshot.intakes.length!==report.counts?.intakes)fail('SOURCE_CARDINALITY_DRIFT');
  const obligations=new Map(snapshot.obligations.map(x=>[String(x.business_entity),x]));
  const intakes=new Map(snapshot.intakes.map(x=>[String(x.correlation_id),x]));
  if(obligations.size!==snapshot.obligations.length||intakes.size!==snapshot.intakes.length)fail('DUPLICATE_SOURCE');
  const candidates=[...snapshot.candidates].sort((a,b)=>
    priority.indexOf(a.component_id)-priority.indexOf(b.component_id)||
    String(a.created_at).localeCompare(String(b.created_at)));
  let eligible=0,existing=0,held=0;
  for(const c of candidates){
    if(!Object.hasOwn(scopes,c.component_id)){held++;continue;}
    const obligation=obligations.get(c.candidate_id),op=intakes.get('innovation-delivery:'+c.candidate_id);
    if(!obligation||!op)fail('ORIGINAL_IDENTITY_MISSING');
    const owner='agent:agent-integration-engineer';
    const pre=op.evidence?.original_agent_pre_review;
    const decision=op.evidence?.original_owner_decision;
    if(!UUID.test(c.candidate_id)||!SHA.test(obligation.payload_sha256)||
       c.owner_agent!=='engineering'||c.status!=='candidate'||
       c.safety_class!=='review_required'||op.operation_type!=='INNOVATION_INTAKE'||
       op.status!=='PLANNED'||text(op.remote_ref)||
       op.capability_id!==owner||obligation.state!=='OPEN'||
       op.change_id!==c.source_key||obligation.change_id!==c.source_key||
       op.payload_sha256!==obligation.payload_sha256||
       op.correlation_id!=='innovation-delivery:'+c.candidate_id||
       op.idempotency_key!=='innovation-delivery:'+c.candidate_id+':'+obligation.payload_sha256.slice(0,16)||
       text(obligation.evidence?.source_revision)==='')fail('SOURCE_BINDING_INCOMPLETE');
    const action=text(c.proposed_action?.action);
    if(action.length<60||action.length>1800||!obj(c.rollback_plan)||
       !text(JSON.stringify(c.rollback_plan))){held++;continue;}
    if(!pre||pre.original_owner!==owner||
       pre.source_revision!==obligation.evidence.source_revision||
       pre.exact_source_action_digest!==digest(c.proposed_action)||
       pre.exact_source_rollback_digest!==digest(c.rollback_plan)||
       pre.consumer_ack_verified!==false||pre.external_side_effect!==false)fail('PRE_REVIEW_CONFLICT');
    if(!decision||decision.original_owner!==owner||
       decision.source_revision!==obligation.evidence.source_revision||
       decision.source_sha256!==obligation.payload_sha256||
       decision.original_action_digest!==digest(c.proposed_action)||
       decision.decision!=='CONCRETE_PROTECTED_CHANGE_PROPOSAL_DUE'||
       decision.actionable_work_package!==true||
       decision.production_mutation_authorized!==false||
       decision.consumer_ack_verified!==false)fail('ORIGINAL_OWNER_DECISION_CONFLICT');
    // Reconcile exact prior protected PRs and no-change review in the ORIGINAL operation.
    // A no-change review is NOT implementation evidence; it only prevents repeat model
    // spend against the same source revision while independent evaluation is due.
    const priorBuild=op.evidence?.original_code_candidate_pr;
    if(priorBuild){
      if(priorBuild.candidate_id!==c.candidate_id||
         priorBuild.source_revision!==obligation.evidence.source_revision||
         priorBuild.source_sha256!==obligation.payload_sha256)fail('ORIGINAL_PRIOR_CODE_PR_CONFLICT');
      held++;continue;
    }
    const priorNoChange=op.evidence?.original_code_nochange_review;
    if(priorNoChange){
      if(priorNoChange.candidate_id!==c.candidate_id||
         priorNoChange.source_revision!==obligation.evidence.source_revision||
         priorNoChange.source_sha256!==obligation.payload_sha256||
         priorNoChange.decision_fingerprint!==decision.fingerprint||
         priorNoChange.implementation_verified!==false||
         priorNoChange.consumer_ack_verified!==false)fail('ORIGINAL_NOCHANGE_REVIEW_CONFLICT');
      held++;continue;
    }
    // A PR mentioned *as the action itself* is not a fresh implementation workorder.
    // A separate child read-model correction may instead reference one exact parent.
    if(/\bPR\s*#?\d{3,6}\b/i.test(action)){held++;continue;}
    const parentPr=c.proposed_action?.parent_pr;
    let provenParent=null;
    if(parentPr!==undefined&&parentPr!==null){
      // First scoped recovery: never apply parent exceptions to arbitrary components.
      if(c.component_id!=='powerhouse-sales-cycle-execution-read-model'){held++;continue;}
      provenParent=verifiedParentFor(parentPr,{
        candidateId:c.candidate_id,allowedSourcePaths:scopes[c.component_id]
      });
      if(provenParent?.parent_pr!==parentPr||
         provenParent?.original_candidate_id!==c.candidate_id||
         provenParent?.protected_main_ancestor!==true||
         provenParent?.source_paths_disjoint!==true||
         provenParent?.parent_is_not_child_implementation!==true||
         provenParent?.child_implementation_proven!==false||
         !GIT_SHA.test(provenParent?.merge_sha)){held++;continue;}
    }
    eligible++;
    if(existingPrFor(c.candidate_id,obligation.payload_sha256,obligation.evidence.source_revision)){existing++;continue;}
    return Object.freeze({contract:CONTRACT,selected:true,
      candidate_id:c.candidate_id,component_id:c.component_id,
      owner,source_key:c.source_key,source_revision:obligation.evidence.source_revision,
      source_sha256:obligation.payload_sha256,
      operation_id:op.id,operation_version:op.version,
      correlation_id:op.correlation_id,idempotency_key:op.idempotency_key,
      decision_fingerprint:decision.fingerprint,
      proposed_action:action,rollback:JSON.stringify(c.rollback_plan).slice(0,1200),
      allowed_source_paths:scopes[c.component_id],
      verified_parent_pr:provenParent,
      protected_review_required:true,automatic_production_mutation:false,
      candidate_pr_only:true,consumer_ack_verified:false});
  }
  return Object.freeze({contract:CONTRACT,selected:false,eligible,existing,held,
    reason:'NO_NEW_SOURCE_BOUND_SAFE_CODE_CANDIDATE',terminal_success:false});
}
function git(args){
  return execFileSync('git',args,{encoding:'utf8',timeout:15000,maxBuffer:2000000}).trim();
}
export function isExactOriginalInnovationImplementationPr({pr,candidateId,sourceSha,sourceRevision}={}){
  if(!UUID.test(candidateId)||!SHA.test(sourceSha)||
     typeof sourceRevision!=='string'||!sourceRevision.trim()||
     typeof pr?.body!=='string')return false;
  // A recovery/doc PR can mention the UUID but is NOT an implementation receipt.
  if(typeof pr.headRefName!=='string'||
     !new RegExp('^writer/innovation-'+candidateId.slice(0,8)+'-[0-9]+$').test(pr.headRefName))return false;
  const lines=pr.body.split(/\r?\n/).map(line=>line.trim());
  return lines.includes('Candidate-Type: implementation')&&
    lines.includes('Original-Candidate: '+candidateId)&&
    lines.includes('Original-Source-SHA256: '+sourceSha)&&
    lines.includes('Original-Source-Revision: '+sourceRevision)&&
    lines.some(line=>line.startsWith('Original-Operation: '))&&
    lines.includes('Writer-Lease-Owner: agent:agent-integration-engineer');
}
function existingPrFor(id,sourceSha,sourceRevision){
  const data=JSON.parse(execFileSync('gh',
    ['pr','list','--repo',REPO,'--state','all','--search',id,
      '--limit','100','--json','number,body,headRefName'],
    {encoding:'utf8',timeout:25000,maxBuffer:4000000}));
  if(!Array.isArray(data))fail('GITHUB_PR_READBACK_INVALID');
  return data.some(pr=>isExactOriginalInnovationImplementationPr({
    pr,candidateId:id,sourceSha,sourceRevision
  }));
}
export function checkChangedPaths({workorder,changed,deleted=[]}={}){
  if(workorder?.contract!==CONTRACT||workorder.selected!==true||
     !Array.isArray(workorder.allowed_source_paths)||
     !Array.isArray(changed)||new Set(changed).size!==changed.length)fail('INVALID_DIFF');
  if(deleted.length)fail('DELETION_FORBIDDEN');
  const source=changed.filter(x=>workorder.allowed_source_paths.includes(x));
  const test=changed.filter(x=>/^tests\/brain-innovation-[a-z0-9-]+\.test\.mjs$/.test(x));
  const learn=changed.filter(x=>/^brain\/learning\/2026-11-\d{2}-innovation-[a-z0-9-]+\.json$/.test(x));
  const docs=changed.filter(x=>/^docs\/(changes|development-ledger-events)\/2026-11-\d{2}-innovation-[a-z0-9-]+\.md$/.test(x));
  const human=docs.filter(x=>x.startsWith('docs/changes/'));
  const ledger=docs.filter(x=>x.startsWith('docs/development-ledger-events/'));
  if(changed.length<5||changed.length>8||source.length<1||test.length<1||learn.length<1||
     human.length!==1||ledger.length!==1||
     source.length+test.length+learn.length+docs.length!==changed.length)fail('PATH_SCOPE_OR_EVIDENCE_MISSING');
  return {source,test,learn,docs,changed};
}
export function classifyOriginalCodeDiff({workorder,changed,deleted=[]}={}){
  if(workorder?.contract!==CONTRACT||workorder.selected!==true||
     !Array.isArray(changed)||!Array.isArray(deleted))fail('INVALID_DIFF');
  if(changed.length===0&&deleted.length===0){
    return Object.freeze({has_changes:false,status:'NO_CODE_CHANGE_INDEPENDENT_REVIEW_DUE',
      implementation_verified:false,consumer_ack_verified:false,terminal_success:false});
  }
  const checked=checkChangedPaths({workorder,changed,deleted});
  return Object.freeze({...checked,has_changes:true,status:'BOUNDED_CODE_CANDIDATE'});
}
function recordOutput(name,value){
  if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,name+'='+value+'\n');
}
async function main(){
  const mode=process.argv[2];
  if(mode==='--prepare'){
    const snapshot=await readCanonicalRows({config:trustedBrainReadConfig(process.env)});
    const report=evaluateOriginalOwnerHandoff(snapshot);
    const selected=selectOriginalCodeCandidate({snapshot,report,existingPrFor,verifiedParentFor:verifiedOriginalParentFor});
    mkdirSync('artifacts/quality',{recursive:true});
    writeFileSync(WORK_ORDER,JSON.stringify(selected,null,2)+'\n');
    recordOutput('selected',selected.selected?'true':'false');
    if(selected.selected)recordOutput('candidate_id',selected.candidate_id);
    process.stdout.write(JSON.stringify({contract:CONTRACT,selected:selected.selected,
      candidate_id:selected.candidate_id??null,reason:selected.reason??null,
      source_bound:true,production_authorized:false})+'\n');
    return;
  }
  if(mode==='--validate'){
    const selected=JSON.parse(readFileSync(WORK_ORDER,'utf8'));
    const tracked=git(['diff','HEAD','--name-only']).split('\n').filter(Boolean);
    const deleted=git(['diff','HEAD','--name-only','--diff-filter=D']).split('\n').filter(Boolean);
    const untracked=git(['ls-files','--others','--exclude-standard']).split('\n')
      .filter(x=>x&&!x.startsWith('artifacts/quality/'));
    const changed=[...new Set([...tracked,...untracked])].sort();
    const result=classifyOriginalCodeDiff({workorder:selected,changed,deleted});
    recordOutput('has_changes',result.has_changes?'true':'false');
    if(!result.has_changes){
      process.stdout.write(JSON.stringify({candidate_id:selected.candidate_id,
        result:result.status,implementation_verified:false,original_remains_planned:true})+'\n');
      return;
    }
    for(const path of result.learn){
      const lesson=JSON.parse(readFileSync(path,'utf8'));
      if(!lesson.compiler?.failure_class||!lesson.fingerprint||!lesson.root_cause)
        fail('LEARNING_ROOT_CAUSE_REQUIRED');
      const plan=compileLearningEvaluationPlan(lesson);
      const modes=validateEvaluationContract(lesson,plan);
      for(const [mode,tests] of Object.entries(modes.tests_by_mode)){
        execFileSync('node',['--test',...tests],{stdio:'inherit',timeout:120000,
          env:{...process.env,POWERHOUSE_LEARNING_EVAL_MODE:mode.toUpperCase()}});
      }
    }
    for(const path of result.docs){
      const content=readFileSync(path,'utf8');
      if(content.trim().length<180||!content.includes(selected.candidate_id))
        fail('ORIGINAL_DOC_SOURCE_OR_CONTENT_MISSING');
    }
    git(['diff','--check']);
    for(const path of result.test)execFileSync('node',['--test',path],
      {stdio:'inherit',timeout:120000});
    process.stdout.write(JSON.stringify({validated:true,changed:result.changed,
      candidate_id:selected.candidate_id,protected_release_due:true})+'\n');
    return;
  }
  if(mode==='--paths'){
    const selected=JSON.parse(readFileSync(WORK_ORDER,'utf8'));
    const tracked=git(['diff','HEAD','--name-only']).split('\n').filter(Boolean);
    const untracked=git(['ls-files','--others','--exclude-standard']).split('\n')
      .filter(x=>x&&!x.startsWith('artifacts/quality/'));
    const changed=[...new Set([...tracked,...untracked])].sort();
    checkChangedPaths({workorder:selected,changed,
      deleted:git(['diff','HEAD','--name-only','--diff-filter=D']).split('\n').filter(Boolean)});
    process.stdout.write(changed.join('\n')+'\n');
    return;
  }
  fail('UNKNOWN_MODE');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])main().catch(e=>{
  process.stderr.write(String(e.message).slice(0,220)+'\n');process.exitCode=1;
});
