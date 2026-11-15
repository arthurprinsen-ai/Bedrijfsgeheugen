import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readCanonicalRows} from './innovation-original-owner-readback.mjs';
import {trustedBrainReadConfig} from './planned-action-review-audit.mjs';
import {isExactOriginalInnovationImplementationPr} from './innovation-original-code-delivery.mjs';

const CONTRACT='ORIGINAL_INNOVATION_CODE_RELEASE_INDEPENDENT_READBACK_V1';
const REPO='arthurprinsen-ai/Bedrijfsgeheugen';
const SHA=/^[a-f0-9]{40}$/i;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const need=(ok,code)=>{if(!ok)throw new Error('ORIGINAL_INNOVATION_RELEASE_'+code);};
const positiveText=v=>typeof v==='string'&&v.trim().length>0;
const mergedSha=pr=>pr?.mergeCommit?.oid;
const hasOriginalLine=(body,key,value)=>{
  const hits=(String(body||'').split(/\r?\n/).filter(l=>l.startsWith(key+': ')));
  return hits.length===1&&hits[0]===key+': '+value;
};

export function verifyOriginalInnovationRelease({
 candidate,operation,obligation,pr,release,live,mainSha,runId,observedAt
}={}){
  const owner='agent:agent-integration-engineer';
  const receipt=operation?.evidence?.original_code_candidate_pr;
  need(SHA.test(mainSha)&&positiveText(runId)&&Number.isFinite(Date.parse(observedAt)),
    'EXECUTION_IDENTITY_REQUIRED');
  need(candidate?.candidate_id===receipt?.candidate_id&&
    candidate.owner_agent==='engineering'&&candidate.status==='candidate'&&
    UUID.test(operation?.id)&&
    operation.operation_type==='INNOVATION_INTAKE'&&
    operation.status==='PLANNED'&&!operation.remote_ref&&
    operation.capability_id===owner&&
    obligation?.business_entity===candidate.candidate_id&&
    obligation.state==='OPEN'&&
    operation.change_id===candidate.source_key&&
    obligation.change_id===candidate.source_key&&
    operation.payload_sha256===obligation.payload_sha256&&
    receipt.source_sha256===obligation.payload_sha256&&
    receipt.source_revision===obligation.evidence?.source_revision&&
    receipt.original_owner===owner&&
    receipt.terminal_success===false&&receipt.consumer_ack_verified===false&&
    operation.correlation_id==='innovation-delivery:'+candidate.candidate_id&&
    operation.idempotency_key==='innovation-delivery:'+candidate.candidate_id+':'+obligation.payload_sha256.slice(0,16),
    'ORIGINAL_SOURCE_OR_OWNER_DRIFT');
  const identity={candidateId:candidate.candidate_id,sourceSha:obligation.payload_sha256,
    sourceRevision:obligation.evidence.source_revision};
  need(isExactOriginalInnovationImplementationPr({pr:{
    headRefName:pr?.headRefName,body:pr?.body
  },...identity})&&
    hasOriginalLine(pr.body,'Original-Operation',operation.id)&&
    pr.state==='MERGED'&&pr.baseRefName==='main'&&
    Number(pr.number)===receipt.pr_number&&
    pr.url===receipt.url&&
    SHA.test(mergedSha(pr))&&mergedSha(pr)===mainSha&&
    positiveText(pr.mergedAt),
    'PROTECTED_GITHUB_PR_IDENTITY_UNVERIFIED');
  need(release?.status==='LIVE_VERIFIED'&&release.deployment_required===true&&
    release.merge_sha===mainSha&&release.deployed_sha===mainSha&&
    release.netlify_deploy_id===live?.deploy_id&&
    release.deploy_status==='ready'&&release.routes_ok===true&&
    live.commit_ref===mainSha&&live.context==='production'&&
    positiveText(live.deploy_id),
    'INDEPENDENT_NETLIFY_EXACT_RELEASE_UNVERIFIED');
  return Object.freeze({
    contract:CONTRACT,candidate_id:candidate.candidate_id,
    original_owner:owner,original_operation_id:operation.id,
    source_sha256:obligation.payload_sha256,
    source_revision:obligation.evidence.source_revision,
    github_pr_url:pr.url,github_pr_final_head:pr.headRefOid,
    github_merge_commit_sha:mainSha,github_merged_at:pr.mergedAt,
    github_release_readback_url:'https://github.com/'+REPO+'/actions/runs/'+runId,
    github_release_readback_stage:'EXACT_PRODUCTION_STEPS_COMPLETED',
    netlify_deploy_id:live.deploy_id,netlify_deploy_commit_sha:mainSha,
    netlify_deploy_status:'ready',netlify_context:'production',
    independently_verified_provider_release:true,implementation_code_published:true,
    original_innovation_fully_delivered:false,
    original_operation_stays:'PLANNED',original_obligation_stays:'OPEN',
    consumer_ack_verified:false,independent_business_effect_verified:false,
    terminal_success:false,observed_at:observedAt
  });
}

async function originalGet(config,id,fetchImpl){
  const params=new URLSearchParams({id:'eq.'+id,
    select:'id,operation_type,capability_id,status,remote_ref,version,change_id,payload_sha256,correlation_id,idempotency_key,evidence'});
  const response=await fetchImpl(config.origin+'/rest/v1/brain_operations?'+params,{
    headers:{apikey:config.key,Authorization:'Bearer '+config.key,Accept:'application/json'},
    signal:AbortSignal.timeout(15000)});
  need(response?.ok,'ORIGINAL_GET_HTTP');
  const rows=await response.json();
  need(Array.isArray(rows)&&rows.length===1,'ORIGINAL_GET_CARDINALITY');
  return rows[0];
}

export async function recordOriginalRelease({proof,config,fetchImpl=globalThis.fetch}={}){
  need(proof?.contract===CONTRACT&&proof.terminal_success===false&&
    proof.original_innovation_fully_delivered===false&&
    proof.independent_business_effect_verified===false&&
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config?.origin||'')&&
    positiveText(config?.key),'INVALID_TRUST_BOUNDARY');
  const current=await originalGet(config,proof.original_operation_id,fetchImpl);
  need(current.status==='PLANNED'&&!current.remote_ref&&
    current.payload_sha256===proof.source_sha256&&
    current.capability_id===proof.original_owner&&
    current.evidence?.original_code_candidate_pr?.url===proof.github_pr_url,
    'ORIGINAL_OPERATION_READBACK_DRIFT');
  const prior=current.evidence?.original_code_production_readback;
  if(prior){
    need(prior.contract===CONTRACT&&prior.candidate_id===proof.candidate_id&&
      prior.original_operation_id===proof.original_operation_id&&
      prior.source_sha256===proof.source_sha256&&
      prior.github_merge_commit_sha===proof.github_merge_commit_sha&&
      prior.netlify_deploy_id===proof.netlify_deploy_id&&
      prior.terminal_success===false&&
      prior.consumer_ack_verified===false,'PRIOR_RELEASE_CONFLICT');
  }else{
    const r=await fetchImpl(config.origin+'/rest/v1/rpc/brain_transition_operation',{
      method:'POST',headers:{apikey:config.key,Authorization:'Bearer '+config.key,
        'content-type':'application/json',Accept:'application/json'},
      body:JSON.stringify({p_operation_id:current.id,p_expected_version:current.version,
        p_status:'PLANNED',p_dispatch_generation:null,p_remote_ref:null,
        p_evidence:{...current.evidence,original_code_production_readback:proof}}),
      signal:AbortSignal.timeout(15000)});
    need(r?.ok,'ORIGINAL_NATIVE_CAS_FAILED');
    const written=await r.json();
    need(written?.id===current.id&&written.status==='PLANNED'&&
      Number(written.version)===Number(current.version)+1&&
      written.evidence?.original_code_production_readback?.github_merge_commit_sha===
        proof.github_merge_commit_sha,'ORIGINAL_NATIVE_WRITE_UNVERIFIED');
  }
  const independentlyRead=await originalGet(config,proof.original_operation_id,fetchImpl);
  need(independentlyRead.status==='PLANNED'&&!independentlyRead.remote_ref&&
    independentlyRead.evidence?.original_code_production_readback?.contract===CONTRACT&&
    independentlyRead.evidence.original_code_production_readback.github_merge_commit_sha===
      proof.github_merge_commit_sha&&
    independentlyRead.evidence.original_code_production_readback.netlify_deploy_id===
      proof.netlify_deploy_id&&
    independentlyRead.evidence.original_code_production_readback.terminal_success===false,
    'INDEPENDENT_NATIVE_GET_FAILED');
  return Object.freeze({status:'ORIGINAL_RELEASE_RECEIPT_VERIFIED',
    candidate_id:proof.candidate_id,original_operation_id:proof.original_operation_id,
    github_merge_sha:proof.github_merge_commit_sha,netlify_deploy_id:proof.netlify_deploy_id,
    already_recorded:Boolean(prior),original_still_planned:true,
    consumer_ack_verified:false,independent_business_effect_verified:false});
}
function getPr(url){
  need(/^https:\/\/github\.com\/arthurprinsen-ai\/Bedrijfsgeheugen\/pull\/\d+$/.test(url),
    'UNTRUSTED_PR_URL');
  const data=execFileSync('gh',['pr','view',url,'--repo',REPO,
    '--json','number,url,state,body,headRefOid,headRefName,baseRefName,mergeCommit,mergedAt'],
    {encoding:'utf8',timeout:20000,maxBuffer:1000000});
  return JSON.parse(data);
}
async function main(){
  need(process.argv[2]==='--record','USAGE');
  const mainSha=process.env.GITHUB_SHA;
  const runId=String(process.env.GITHUB_RUN_ID||'');
  need(SHA.test(mainSha)&&/^\d+$/.test(runId),'TRUSTED_MAIN_SHA_OR_RUN_REQUIRED');
  const release=JSON.parse(readFileSync('.artifacts/production-release-readback.json','utf8'));
  const live=JSON.parse(readFileSync('live-release.json','utf8'));
  // The original readback job has already verified signed Portal proof and routes.
  need(release.status==='LIVE_VERIFIED'&&release.deployed_sha===mainSha&&
    release.netlify_deploy_id===live.deploy_id&&live.commit_ref===mainSha,
    'RELEASE_GATE_NOT_PROVEN');
  const config=trustedBrainReadConfig(process.env);
  const snapshot=await readCanonicalRows({config});
  const obligations=new Map(snapshot.obligations.map(o=>[o.business_entity,o]));
  const operations=new Map(snapshot.intakes.map(o=>[o.correlation_id,o]));
  let inspected=0,matched=0,recorded=0;
  for(const candidate of snapshot.candidates){
    const op=operations.get('innovation-delivery:'+candidate.candidate_id);
    if(!op?.evidence?.original_code_candidate_pr)continue;
    inspected++;
    const pr=getPr(op.evidence.original_code_candidate_pr.url);
    if(mergedSha(pr)!==mainSha)continue; // unrelated protected release.
    matched++;
    need(matched===1,'MORE_THAN_ONE_ORIGINAL_CANDIDATE_PER_RELEASE');
    const proof=verifyOriginalInnovationRelease({
      candidate,operation:op,obligation:obligations.get(candidate.candidate_id),
      pr,release,live,mainSha,runId,observedAt:new Date().toISOString()});
    const result=await recordOriginalRelease({proof,config});
    recorded++;
    process.stdout.write(JSON.stringify(result)+'\n');
  }
  process.stdout.write(JSON.stringify({
    contract:CONTRACT,inspected,matched,recorded,
    no_original_candidate_match:matched===0,
    business_effect_verification_not_implied:true,
    original_obligations_preserved:true
  })+'\n');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])
  main().catch(e=>{process.stderr.write(String(e.message).slice(0,240)+'\n');process.exitCode=1;});
