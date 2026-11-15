import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {appendFileSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {readCanonicalRows, evaluateOriginalOwnerHandoff} from './innovation-original-owner-readback.mjs';
import {trustedBrainReadConfig} from './planned-action-review-audit.mjs';

export const CONTRACT='ORIGINAL_INNOVATION_BOUNDED_CODE_CANDIDATE_V1';
export const WORK_ORDER='artifacts/quality/original-innovation-code-workorder.json';
const REPO='arthurprinsen-ai/Bedrijfsgeheugen';
const SHA=/^[a-f0-9]{64}$/i;
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

export function selectOriginalCodeCandidate({snapshot,report,existingPrFor=()=>false}={}){
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
    // A previously implemented source, or a duplicate candidate PR, must be reconciled, not rebuilt.
    if(/\bPR\s*#?\d{3,6}\b/i.test(action)||c.proposed_action.parent_pr){held++;continue;}
    const priorNoDiff=op.evidence?.original_code_no_diff_review;
    if(priorNoDiff){
      if(priorNoDiff.candidate_id!==c.candidate_id||
         priorNoDiff.source_revision!==obligation.evidence.source_revision||
         priorNoDiff.source_sha256!==obligation.payload_sha256||
         priorNoDiff.consumer_ack_verified!==false||
         priorNoDiff.production_verified!==false)fail('PRIOR_NO_DIFF_REVIEW_CONFLICT');
      held++;continue; // An original verification duty remains OPEN; do not re-generate an identical PR.
    }
    eligible++;
    if(existingPrFor(c.candidate_id)){existing++;continue;}
    return Object.freeze({contract:CONTRACT,selected:true,
      candidate_id:c.candidate_id,component_id:c.component_id,
      owner,source_key:c.source_key,source_revision:obligation.evidence.source_revision,
      source_sha256:obligation.payload_sha256,
      operation_id:op.id,operation_version:op.version,
      correlation_id:op.correlation_id,idempotency_key:op.idempotency_key,
      decision_fingerprint:decision.fingerprint,
      proposed_action:action,rollback:JSON.stringify(c.rollback_plan).slice(0,1200),
      allowed_source_paths:scopes[c.component_id],
      protected_review_required:true,automatic_production_mutation:false,
      candidate_pr_only:true,consumer_ack_verified:false});
  }
  return Object.freeze({contract:CONTRACT,selected:false,eligible,existing,held,
    reason:'NO_NEW_SOURCE_BOUND_SAFE_CODE_CANDIDATE',terminal_success:false});
}
function git(args){
  return execFileSync('git',args,{encoding:'utf8',timeout:15000,maxBuffer:2000000}).trim();
}
function existingPrFor(id){
  const data=JSON.parse(execFileSync('gh',
    ['pr','list','--repo',REPO,'--state','all','--search',id,
      '--limit','100','--json','number,body'],
    {encoding:'utf8',timeout:25000,maxBuffer:4000000}));
  if(!Array.isArray(data))fail('GITHUB_PR_READBACK_INVALID');
  return data.some(pr=>typeof pr.body==='string'&&pr.body.includes(id));
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
  if(changed.length<3||changed.length>8||source.length<1||test.length<1||learn.length<1||
     source.length+test.length+learn.length+docs.length!==changed.length)fail('PATH_SCOPE_OR_EVIDENCE_MISSING');
  return {source,test,learn,docs,changed};
}
export function classifyOriginalCodeDiff({workorder,changed,deleted=[]}={}){
  if(workorder?.contract!==CONTRACT||workorder.selected!==true||
     !Array.isArray(changed)||!Array.isArray(deleted))fail('INVALID_DIFF_CLASSIFICATION');
  if(deleted.length)fail('DELETION_FORBIDDEN');
  if(changed.length===0)return Object.freeze({
    changed:false,state:'NO_DIFF_INSPECTION_REQUIRES_ORIGINAL_OWNER_FOLLOWUP',
    consumer_ack_verified:false,production_verified:false,terminal_success:false
  });
  return Object.freeze({
    changed:true,state:'VALIDATION_REQUIRED',scope:checkChangedPaths({workorder,changed,deleted}),
    consumer_ack_verified:false,production_verified:false,terminal_success:false
  });
}

export async function persistOriginalCodeNoDiffReview({workorder,config,fetchImpl=globalThis.fetch,observedAt=new Date().toISOString()}={}){
  if(workorder?.contract!==CONTRACT||workorder.selected!==true||
     !UUID.test(workorder.operation_id)||!SHA.test(workorder.source_sha256)||
     !UUID.test(workorder.candidate_id)||!text(workorder.source_revision)||
     !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config?.origin??'')||
     text(config?.key).length<12||typeof fetchImpl!=='function')fail('NO_DIFF_SOURCE_INVALID');
  const headers={apikey:config.key,Authorization:'Bearer '+config.key,Accept:'application/json'};
  const params=new URLSearchParams({id:'eq.'+workorder.operation_id,
    select:'id,operation_type,capability_id,status,idempotency_key,payload_sha256,change_id,correlation_id,remote_ref,evidence,version'});
  const get=async()=>{
    const res=await fetchImpl(config.origin+'/rest/v1/brain_operations?'+params,{method:'GET',headers});
    if(!res?.ok)fail('NO_DIFF_READBACK_HTTP_'+(res?.status??'UNKNOWN'));
    const rows=await res.json();
    if(!Array.isArray(rows)||rows.length!==1)fail('NO_DIFF_READBACK_CARDINALITY');
    return rows[0];
  };
  const fingerprint=digest({candidate_id:workorder.candidate_id,
    source_revision:workorder.source_revision,source_sha256:workorder.source_sha256,
    operation_id:workorder.operation_id,decision_fingerprint:workorder.decision_fingerprint,
    class:'NO_DIFF_INSPECTION_NOT_PRODUCTION_PROOF'});
  const matches=row=>row?.id===workorder.operation_id&&row?.operation_type==='INNOVATION_INTAKE'&&
    row?.capability_id===workorder.owner&&row?.status==='PLANNED'&&!text(row?.remote_ref)&&
    row?.idempotency_key===workorder.idempotency_key&&row?.correlation_id===workorder.correlation_id&&
    row?.payload_sha256===workorder.source_sha256&&row?.change_id===workorder.source_key;
  const current=await get();
  if(!matches(current))fail('NO_DIFF_ORIGINAL_SOURCE_CHANGED');
  const prior=current.evidence?.original_code_no_diff_review;
  if(prior){
    if(prior.fingerprint!==fingerprint||prior.consumer_ack_verified!==false||
       prior.production_verified!==false)fail('NO_DIFF_PRIOR_CONFLICT');
    return Object.freeze({recorded:true,already_recorded:true,terminal_success:false});
  }
  if(Number(current.version)!==Number(workorder.operation_version))fail('NO_DIFF_VERSION_CONFLICT');
  const review=Object.freeze({fingerprint,candidate_id:workorder.candidate_id,
    source_revision:workorder.source_revision,source_sha256:workorder.source_sha256,
    original_owner:workorder.owner,status:'NO_CODE_DIFF_REVIEW_PENDING',
    next_action:'Original owner independently verifies source revision and production behavior; do not mark this innovation delivered or learned',
    consumer_ack_verified:false,production_verified:false,independent_effect_verified:false,
    terminal_success:false,external_side_effect:false,observed_at:observedAt});
  const response=await fetchImpl(config.origin+'/rest/v1/rpc/brain_transition_operation',{
    method:'POST',headers:{...headers,'content-type':'application/json'},
    body:JSON.stringify({p_operation_id:workorder.operation_id,
      p_expected_version:current.version,p_status:'PLANNED',p_dispatch_generation:null,
      p_remote_ref:null,p_evidence:{...current.evidence,original_code_no_diff_review:review}})
  });
  // Ambiguous write outcome: re-read the SAME original record, never retry blindly.
  const after=await get();
  if(!matches(after)||after.evidence?.original_code_no_diff_review?.fingerprint!==fingerprint||
     after.evidence.original_code_no_diff_review.consumer_ack_verified!==false||
     after.evidence.original_code_no_diff_review.production_verified!==false||
     Number(after.version)<Number(current.version)+1)fail('NO_DIFF_NATIVE_CAS_OR_READBACK_FAILED');
  if(!response?.ok&&after.evidence.original_code_no_diff_review.fingerprint!==fingerprint)
    fail('NO_DIFF_PROVIDER_REJECTED');
  return Object.freeze({recorded:true,already_recorded:false,terminal_success:false});
}

function recordOutput(name,value){
  if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,name+'='+value+'\n');
}
async function main(){
  const mode=process.argv[2];
  if(mode==='--prepare'){
    const snapshot=await readCanonicalRows({config:trustedBrainReadConfig(process.env)});
    const report=evaluateOriginalOwnerHandoff(snapshot);
    const selected=selectOriginalCodeCandidate({snapshot,report,existingPrFor});
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
    const classification=classifyOriginalCodeDiff({workorder:selected,changed,deleted});
    if(!classification.changed){
      recordOutput('changed','false');
      process.stdout.write(JSON.stringify({state:classification.state,
        candidate_id:selected.candidate_id,terminal_success:false,original_obligation_still_open:true})+'\n');
      return;
    }
    const result=classification.scope;
    for(const path of result.learn){
      const lesson=JSON.parse(readFileSync(path,'utf8'));
      if(!lesson.compiler?.failure_class||
         !Array.isArray(lesson.evaluation?.historical_replay)||
         !lesson.evaluation.historical_replay.length)fail('LEARNING_REGRESSION_REQUIRED');
    }
    git(['diff','--check']);
    for(const path of result.test)execFileSync('node',['--test',path],
      {stdio:'inherit',timeout:120000});
    recordOutput('changed','true');
    process.stdout.write(JSON.stringify({validated:true,changed:result.changed,
      candidate_id:selected.candidate_id,protected_release_due:true})+'\n');
    return;
  }
  if(mode==='--record-no-diff'){
    const selected=JSON.parse(readFileSync(WORK_ORDER,'utf8'));
    const tracked=git(['diff','HEAD','--name-only']).split('\n').filter(Boolean);
    const untracked=git(['ls-files','--others','--exclude-standard']).split('\n')
      .filter(x=>x&&!x.startsWith('artifacts/quality/'));
    const classification=classifyOriginalCodeDiff({workorder:selected,
      changed:[...new Set([...tracked,...untracked])],
      deleted:git(['diff','HEAD','--name-only','--diff-filter=D']).split('\n').filter(Boolean)});
    if(classification.changed)fail('NO_DIFF_MODE_WITH_CHANGES');
    const result=await persistOriginalCodeNoDiffReview({
      workorder:selected,config:trustedBrainReadConfig(process.env)});
    process.stdout.write(JSON.stringify({state:'NO_DIFF_REVIEW_RECORDED',...result,
      original_operation_still_planned:true,original_obligation_still_open:true})+'\n');
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
