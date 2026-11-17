import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {readCanonicalRows,evaluateOriginalOwnerHandoff} from './innovation-original-owner-readback.mjs';
import {trustedBrainReadConfig} from './planned-action-review-audit.mjs';

// Same original daily agent, no separate scheduler or Brain.
// All writes are nonterminal evidence updates on original versioned operations.
export const CONTRACT='ORIGINAL_INNOVATION_DELIVERY_CONTINUITY_V1';
const REPO='arthurprinsen-ai/Bedrijfsgeheugen';
const SHA=/^[a-f0-9]{40}$/i;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail=code=>{throw new Error('ORIGINAL_INNOVATION_CONTINUITY_'+code);};
const assert=(yes,code)=>{if(!yes)fail(code);};
const fingerprint=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const string=x=>typeof x==='string'?x.trim():'';
const statusKind=decision=>decision==='CRO_MEASUREMENT_AND_HOLDOUT_DESIGN_REQUIRED'?'CRO_HOLDOUT':
  decision==='BASELINE_AND_EVALUATION_DESIGN_REQUIRED'?'BASELINE_AND_EVALUATION':
  decision==='CONCRETE_PROTECTED_CHANGE_PROPOSAL_DUE'?'PROTECTED_ENGINEERING':
  'SOURCE_REVIEW_REQUIRED';

export function examineOriginalDelivery({candidate,obligation,operation,githubPr=null,production=null,checkedAt=new Date().toISOString()}={}){
  assert(Number.isFinite(Date.parse(checkedAt)),'CLOCK_INVALID');
  assert(UUID.test(candidate?.candidate_id)&&candidate.source_key===obligation?.change_id&&
    obligation.business_entity===candidate.candidate_id&&
    obligation.payload_sha256===operation?.payload_sha256&&
    operation.operation_type==='INNOVATION_INTAKE'&&
    operation.correlation_id==='innovation-delivery:'+candidate.candidate_id&&
    operation.change_id===candidate.source_key&&
    operation.capability_id===(candidate.owner_agent==='cro'?'agent:agent-growth-market':'agent:agent-integration-engineer')&&
    obligation.owner==='original-agent:'+candidate.owner_agent&&
    string(obligation.evidence?.source_revision).length>0,'SOURCE_OWNER_IDENTITY_DRIFT');
  assert(['OPEN','READY','RUNNING','FULFILLED'].includes(obligation.state),'OBLIGATION_STATE_INVALID');
  const alreadyVerified=operation.status==='VERIFIED'&&
    string(operation.remote_ref).length>0&&
    operation.evidence?.consumer_owner===operation.capability_id&&
    operation.evidence?.source_revision===obligation.evidence.source_revision&&
    operation.evidence?.independent_consumer_readback===true;
  assert((operation.status==='PLANNED'&&!operation.remote_ref)||alreadyVerified,
    'UNSUPPORTED_ORIGINAL_OPERATION_STATE');
  const decision=operation.evidence?.original_owner_decision;
  const owner=operation.capability_id;
  assert(decision?.original_owner===owner&&
    decision?.source_sha256===operation.payload_sha256&&
    decision?.source_revision===obligation.evidence.source_revision&&
    string(decision.decision).length>0,'ORIGINAL_DECISION_UNVERIFIED');
  const prior=operation.evidence?.original_code_candidate_pr;
  const noop=operation.evidence?.original_code_nochange_review;
  let stage='BASELINE_OR_SAFE_SCOPE_DUE';
  let prNumber=null,mergeSha=null,deployedSha=null,deployId=null,codeInProduction=false;
  let previouslyVerifiedCodeRelease=false;
  if(statusKind(decision.decision)==='CRO_HOLDOUT')stage='CRO_CONSENT_BASELINE_AND_HOLDOUT_DUE';
  if(alreadyVerified)stage='ORIGINAL_CONSUMER_ACK_VERIFIED_IMPACT_READBACK_DUE';
  if(!alreadyVerified&&statusKind(decision.decision)==='PROTECTED_ENGINEERING')stage='PROTECTED_BUILD_DUE';
  if(noop&&!alreadyVerified){
    assert(!prior&&noop.candidate_id===candidate.candidate_id&&
      noop.source_sha256===operation.payload_sha256&&
      noop.source_revision===obligation.evidence.source_revision&&
      noop.implementation_verified===false&&noop.consumer_ack_verified===false,
      'NOCHANGE_SOURCE_CONFLICT');
    stage='NO_CHANGE_INDEPENDENT_OWNER_REVIEW_DUE';
  }
  if(prior&&!alreadyVerified){
    assert(!noop&&prior.candidate_id===candidate.candidate_id&&
      prior.source_sha256===operation.payload_sha256&&
      prior.source_revision===obligation.evidence.source_revision&&
      prior.original_owner===owner&&
      prior.consumer_ack_verified===false&&
      prior.terminal_success===false&&SHA.test(prior.head_sha)&&
      /^https:\/\/github\.com\/arthurprinsen-ai\/Bedrijfsgeheugen\/pull\/\d+$/.test(prior.url),
      'PR_RECEIPT_SOURCE_CONFLICT');
    prNumber=Number(prior.url.split('/').at(-1));
    stage='PROVIDER_PR_READBACK_DUE';
    if(githubPr){
      const lines=string(githubPr.body).split(/\r?\n/).map(s=>s.trim());
      assert(githubPr.url===prior.url&&githubPr.number===prNumber&&
        githubPr.baseRefName==='main'&&
        githubPr.headRefName?.startsWith('writer/innovation-'+candidate.candidate_id.slice(0,8)+'-')&&
        lines.includes('Candidate-Type: implementation')&&
        lines.includes('Original-Candidate: '+candidate.candidate_id)&&
        lines.includes('Original-Source-SHA256: '+prior.source_sha256)&&
        lines.includes('Original-Source-Revision: '+prior.source_revision)&&
        lines.includes('Original-Operation: '+operation.id)&&
        lines.includes('Writer-Lease-Owner: '+owner),
        'GITHUB_PR_LINEAGE_CONFLICT');
      const historical=operation.evidence?.original_code_candidate_release;
      const pastProvider=operation.evidence?.original_code_production_readback;
      const historicalReleaseProven=historical?.contract==='ORIGINAL_INNOVATION_PROTECTED_RELEASE_READBACK_V1'&&
        pastProvider?.contract==='ORIGINAL_INNOVATION_CODE_RELEASE_INDEPENDENT_READBACK_V1'&&
        historical.original_candidate_id===candidate.candidate_id&&
        historical.original_pr_url===prior.url&&
        historical.initial_pr_head_sha===prior.head_sha&&
        historical.final_protected_pr_head_sha===githubPr.headRefOid&&
        historical.merge_sha===githubPr.mergeCommit?.oid&&
        historical.github_merged===true&&historical.protected_ci==='PASSED'&&
        historical.independent_release_readback_result==='SUCCESS'&&
        historical.implementation_technical_release_verified===true&&
        historical.netlify_state==='READY_CURRENT_PRODUCTION'&&
        SHA.test(historical.netlify_commit_sha)&&string(historical.netlify_deploy_id)&&
        pastProvider.candidate_id===candidate.candidate_id&&
        pastProvider.original_operation_id===operation.id&&
        pastProvider.original_owner===owner&&
        pastProvider.source_revision===obligation.evidence.source_revision&&
        pastProvider.source_sha256===operation.payload_sha256&&
        pastProvider.github_pr_final_head===githubPr.headRefOid&&
        pastProvider.github_merge_commit_sha===historical.merge_sha&&
        pastProvider.netlify_deploy_id===historical.netlify_deploy_id&&
        pastProvider.netlify_deploy_commit_sha===historical.netlify_commit_sha&&
        pastProvider.netlify_context==='production'&&
        pastProvider.netlify_deploy_status==='ready'&&
        pastProvider.independently_verified_provider_release===true&&
        pastProvider.original_innovation_fully_delivered===false&&
        pastProvider.independent_business_effect_verified===false;
      if(githubPr.headRefOid!==prior.head_sha&&!historicalReleaseProven){
        stage='ORIGINAL_PR_HEAD_CHANGED_REVIEW_DUE';
      }else if(githubPr.state==='OPEN'){
        stage='PROTECTED_PR_CHECKS_OR_REVIEW_DUE';
      }else if(githubPr.state==='MERGED'&&SHA.test(githubPr.mergeCommit?.oid)){
        mergeSha=githubPr.mergeCommit.oid;
        stage='PRODUCTION_PROVIDER_READBACK_DUE';
        if(historicalReleaseProven){
          previouslyVerifiedCodeRelease=true;
          deployId=historical.netlify_deploy_id;
          deployedSha=historical.netlify_commit_sha;
          stage='HISTORICAL_NATIVE_CODE_RELEASE_VERIFIED_EFFECT_MEASUREMENT_DUE';
        }
        // New provider truth upgrades historical release to current deployment
        // only if the SAME latest READY commit contains the protected merge.
        if(production?.state==='ready'&&production.context==='production'&&
          SHA.test(production.commit_ref)&&string(production.id)&&
          production.current_contains_merge===true){
          deployedSha=production.commit_ref;
          deployId=production.id;
          codeInProduction=true;
          stage='PRODUCTION_CODE_PRESENT_EFFECT_MEASUREMENT_DUE';
        }
      }else if(githubPr.state==='CLOSED'){
        stage='PR_CLOSED_WITHOUT_PROTECTED_MERGE_REVIEW_DUE';
      }else{
        stage='PROTECTED_MERGE_PROVIDER_PROOF_UNAVAILABLE';
      }
    }
  }
  // Neither a PR nor a deploy can attest measured business impact.
  const assessment={contract:CONTRACT,candidate_id:candidate.candidate_id,
    source_revision:obligation.evidence.source_revision,
    source_sha256:operation.payload_sha256,original_owner:owner,
    original_operation_id:operation.id,delivery_lane:statusKind(decision.decision),
    stage,pr_number:prNumber,merge_sha:mergeSha,
    production_deploy_id:deployId,production_sha:deployedSha,
    verified_code_in_production:codeInProduction,
    historically_verified_code_release:previouslyVerifiedCodeRelease,
    expected_impact:null,actual_impact:null,holdout_impact:null,
    independent_impact_verified:false,consumer_ack_verified:alreadyVerified,
    independent_heartbeat_learning_verified:false,terminal_success:false,
    original_state_remains:operation.status,obligation_state_remains:obligation.state,
    checked_at:checkedAt};
  const {checked_at,...stable}=assessment;
  return Object.freeze({...assessment,assessment_fingerprint:fingerprint(stable)});
}

export function planOriginalContinuity({snapshot,report,githubPrByCandidate={},productionByCandidate={},checkedAt=new Date().toISOString()}={}){
  assert(report?.contract==='ORIGINAL_INNOVATION_AGENT_OWNER_READBACK_V1'&&
    [snapshot?.candidates,snapshot?.obligations,snapshot?.intakes].every(Array.isArray)&&
    report.counts?.candidates===snapshot.candidates.length&&
    report.counts?.obligations===snapshot.obligations.length&&
    report.counts?.intakes===snapshot.intakes.length,'SOURCE_COUNT_DRIFT');
  const obligations=new Map(snapshot.obligations.map(x=>[x.business_entity,x]));
  const intakes=new Map(snapshot.intakes.map(x=>[x.correlation_id,x]));
  assert(obligations.size===snapshot.obligations.length&&intakes.size===snapshot.intakes.length,'DUPLICATE_SOURCE');
  const plans=[];
  for(const candidate of snapshot.candidates){
    const obligation=obligations.get(candidate.candidate_id);
    const operation=intakes.get('innovation-delivery:'+candidate.candidate_id);
    assert(obligation&&operation,'ORPHAN_ORIGINAL');
    plans.push(Object.freeze({operation,assessment:examineOriginalDelivery({candidate,obligation,operation,
      githubPr:githubPrByCandidate[candidate.candidate_id]??null,
      production:productionByCandidate[candidate.candidate_id]??null,checkedAt})}));
  }
  assert(plans.length===snapshot.obligations.length&&plans.length===snapshot.intakes.length,
    'SOURCE_CARDINALITY_DRIFT');
  return Object.freeze(plans);
}

function gh(args){return JSON.parse(execFileSync('gh',args,{encoding:'utf8',timeout:25000,maxBuffer:3000000}));}
async function netlifyProduction({fetchImpl=fetch,env=process.env}={}){
  const token=string(env.NETLIFY_AUTH_TOKEN),site=string(env.NETLIFY_SITE_ID);
  if(!token||!site)return null;
  assert(/^[a-zA-Z0-9-]+$/.test(site),'NETLIFY_SITE_ID_INVALID');
  const response=await fetchImpl('https://api.netlify.com/api/v1/sites/'+site+'/deploys?per_page=8',{
    headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(20000)});
  if(!response.ok)return null;
  const deployments=await response.json();
  if(!Array.isArray(deployments))return null;
  return deployments.find(d=>d.context==='production'&&d.state==='ready'&&SHA.test(d.commit_ref))??null;
}
async function originalGet(config,id){
  const params=new URLSearchParams({id:'eq.'+id,select:'id,operation_type,capability_id,change_id,correlation_id,idempotency_key,status,version,remote_ref,payload_sha256,evidence'});
  const response=await fetch(config.origin+'/rest/v1/brain_operations?'+params,
    {headers:{apikey:config.key,Authorization:'Bearer '+config.key,Accept:'application/json'},signal:AbortSignal.timeout(20000)});
  assert(response.ok,'ORIGINAL_GET_HTTP_'+response.status);
  const rows=await response.json();
  assert(Array.isArray(rows)&&rows.length===1,'ORIGINAL_GET_CARDINALITY');
  return rows[0];
}
async function persistOriginal(config,{operation,assessment}){
  // An externally proven owner ACK is immutable evidence, not a new CAS write.
  // Keep the effect stage visible but never reset VERIFIED back to PLANNED.
  if(operation.status==='VERIFIED'&&assessment.consumer_ack_verified===true)return false;
  const fresh=await originalGet(config,operation.id);
  assert(fresh.operation_type==='INNOVATION_INTAKE'&&fresh.status==='PLANNED'&&
    !fresh.remote_ref&&fresh.capability_id===operation.capability_id&&
    fresh.payload_sha256===operation.payload_sha256&&fresh.change_id===operation.change_id&&
    fresh.correlation_id===operation.correlation_id&&
    fresh.idempotency_key===operation.idempotency_key&&
    fresh.evidence?.original_owner_decision?.source_revision===assessment.source_revision,
    'ORIGINAL_CAS_IDENTITY_DRIFT');
  if(fresh.evidence?.original_innovation_continuity?.assessment_fingerprint===assessment.assessment_fingerprint)return false;
  const response=await fetch(config.origin+'/rest/v1/rpc/brain_transition_operation',{
    method:'POST',headers:{apikey:config.key,Authorization:'Bearer '+config.key,
      'content-type':'application/json',Accept:'application/json'},
    body:JSON.stringify({p_operation_id:operation.id,p_expected_version:fresh.version,
      p_status:'PLANNED',p_dispatch_generation:null,p_remote_ref:null,
      p_evidence:{...fresh.evidence,original_innovation_continuity:assessment}}),
    signal:AbortSignal.timeout(20000)});
  assert(response.ok,'ORIGINAL_CAS_HTTP_'+response.status);
  const written=await response.json();
  assert(written?.id===operation.id&&written.status==='PLANNED'&&
    Number(written.version)===Number(fresh.version)+1&&
    written.evidence?.original_innovation_continuity?.assessment_fingerprint===assessment.assessment_fingerprint,
    'ORIGINAL_CAS_WRITEBACK_UNVERIFIED');
  const proof=await originalGet(config,operation.id);
  assert(proof.status==='PLANNED'&&!proof.remote_ref&&
    proof.evidence?.original_innovation_continuity?.assessment_fingerprint===assessment.assessment_fingerprint,
    'INDEPENDENT_ORIGINAL_READBACK_FAILED');
  return true;
}
async function main(){
  assert(process.argv[2]==='--reconcile','USAGE');
  const config=trustedBrainReadConfig(process.env);
  const snapshot=await readCanonicalRows({config});
  const report=evaluateOriginalOwnerHandoff(snapshot);
  const githubPrByCandidate={};
  const productionByCandidate={};
  let currentProduction=null;
  try{currentProduction=await netlifyProduction();}catch{
    // Provider unavailable: release remains unverified, never fabricated.
  }
  for(const candidate of snapshot.candidates){
    const operation=snapshot.intakes.find(op=>op.correlation_id==='innovation-delivery:'+candidate.candidate_id);
    const prior=operation?.evidence?.original_code_candidate_pr;
    if(!prior)continue;
    const number=Number(prior.pr_number);
    assert(Number.isSafeInteger(number)&&number>0,'PR_NUMBER_INVALID');
    try{
      const pr=gh(['pr','view',String(number),'--repo',REPO,'--json',
        'number,url,state,headRefName,headRefOid,baseRefName,body,mergeCommit']);
      githubPrByCandidate[candidate.candidate_id]=pr;
      if(pr.state==='MERGED'&&SHA.test(pr.mergeCommit?.oid)&&currentProduction){
        let contained=false;
        try{
          const comparison=gh(['api','repos/'+REPO+'/compare/'+pr.mergeCommit.oid+'...'+currentProduction.commit_ref]);
          contained=['ahead','identical'].includes(comparison?.status);
        }catch{contained=false;}
        productionByCandidate[candidate.candidate_id]={...currentProduction,current_contains_merge:contained};
      }
    }catch{
      // Provider readback stays DUE, never re-dispatch an external effect.
    }
  }
  const plans=planOriginalContinuity({snapshot,report,githubPrByCandidate,productionByCandidate});
  const counts={};let writes=0;
  for(const item of plans){
    counts[item.assessment.stage]=(counts[item.assessment.stage]??0)+1;
    if(await persistOriginal(config,item))writes++;
  }
  process.stdout.write(JSON.stringify({contract:CONTRACT,source_count:plans.length,reviewed:plans.length,
    actual_provider_verified_code_in_production:plans.filter(x=>x.assessment.verified_code_in_production).length,
    independently_measured_outcomes:0,original_terminalized:0,original_rows_updated:writes,
    states:counts,missing_or_unproven:plans.length,no_new_agent:true,no_new_schedule:true,
    no_external_send:true,terminal_success:false})+'\n');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])
  main().catch(err=>{process.stderr.write(String(err.message).slice(0,240)+'\n');process.exitCode=1;});
