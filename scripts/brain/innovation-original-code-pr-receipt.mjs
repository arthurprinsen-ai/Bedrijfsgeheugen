import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {WORK_ORDER,CONTRACT} from './innovation-original-code-delivery.mjs';
import {trustedBrainReadConfig} from './planned-action-review-audit.mjs';

const need=(ok,code)=>{if(!ok)throw new Error('ORIGINAL_INNOVATION_PR_RECEIPT_'+code);};
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
export function verifyOriginalCandidateReceipt({workorder,pr,operation}={}){
  need(workorder?.contract===CONTRACT&&workorder.selected===true&&uuid(workorder.candidate_id),'WORKORDER_INVALID');
  need(pr?.baseRefName==='main'&&pr?.state==='OPEN'
    &&/^https:\/\/github\.com\/arthurprinsen-ai\/Bedrijfsgeheugen\/pull\/\d+$/.test(pr?.url??'')
    &&/^[a-f0-9]{40}$/i.test(pr?.headRefOid??'')
    &&typeof pr?.body==='string'
    &&pr.body.includes(workorder.candidate_id)
    &&pr.body.includes(workorder.source_sha256)
    &&pr.body.includes(workorder.source_revision),'UNTRUSTED_GITHUB_PR');
  need(operation?.id===workorder.operation_id
    &&operation.operation_type==='INNOVATION_INTAKE'
    &&operation.status==='PLANNED'&&!operation.remote_ref
    &&operation.capability_id===workorder.owner
    &&operation.payload_sha256===workorder.source_sha256
    &&operation.change_id===workorder.source_key
    &&operation.correlation_id===workorder.correlation_id
    &&operation.idempotency_key===workorder.idempotency_key
    &&operation.evidence?.original_owner_decision?.fingerprint===workorder.decision_fingerprint
    &&operation.evidence?.original_owner_decision?.consumer_ack_verified===false,'ORIGINAL_SOURCE_CHANGED');
  const previous=operation.evidence?.original_code_candidate_pr;
  if(previous){
    need(previous.candidate_id===workorder.candidate_id
      &&previous.url===pr.url&&previous.head_sha===pr.headRefOid,'CONFLICTING_PRIOR_BUILD');
    return Object.freeze({already_recorded:true,receipt:previous});
  }
  return Object.freeze({already_recorded:false,receipt:{
    contract:'ORIGINAL_INNOVATION_PROTECTED_CANDIDATE_RECEIPT_V1',
    candidate_id:workorder.candidate_id,source_revision:workorder.source_revision,
    source_sha256:workorder.source_sha256,original_owner:workorder.owner,
    url:pr.url,head_sha:pr.headRefOid,pr_number:Number(pr.url.split('/').at(-1)),
    protected_ci_pending:true,production_not_proven:true,
    consumer_ack_verified:false,independent_effect_verified:false,
    terminal_success:false,observed_at:new Date().toISOString()
  }});
}
async function fetchOperation(config,id){
  const query=new URLSearchParams({id:'eq.'+id,
    select:'id,operation_type,capability_id,status,remote_ref,version,payload_sha256,change_id,correlation_id,idempotency_key,evidence'});
  const response=await fetch(config.origin+'/rest/v1/brain_operations?'+query,{
    headers:{apikey:config.key,Authorization:'Bearer '+config.key,Accept:'application/json'}
  });
  need(response.ok,'ORIGINAL_GET_HTTP_'+response.status);
  const rows=await response.json();
  need(Array.isArray(rows)&&rows.length===1,'ORIGINAL_GET_CARDINALITY');
  return rows[0];
}
async function main(){
  need(process.argv.length===4&&process.argv[2]==='--record','USAGE');
  const workorder=JSON.parse(readFileSync(WORK_ORDER,'utf8'));
  const prUrl=process.argv[3];
  const pr=JSON.parse(execFileSync('gh',['pr','view',prUrl,'--json',
    'number,url,state,headRefOid,body,baseRefName'],{encoding:'utf8',timeout:25000}));
  const config=trustedBrainReadConfig(process.env);
  const original=await fetchOperation(config,workorder.operation_id);
  const decision=verifyOriginalCandidateReceipt({workorder,pr,operation:original});
  if(!decision.already_recorded){
    const response=await fetch(config.origin+'/rest/v1/rpc/brain_transition_operation',{
      method:'POST',headers:{apikey:config.key,Authorization:'Bearer '+config.key,
        'content-type':'application/json',Accept:'application/json'},
      body:JSON.stringify({p_operation_id:original.id,
        p_expected_version:original.version,p_status:'PLANNED',
        p_dispatch_generation:null,p_remote_ref:null,
        p_evidence:{...original.evidence,original_code_candidate_pr:decision.receipt}})
    });
    need(response.ok,'ORIGINAL_CAS_HTTP_'+response.status);
    const written=await response.json();
    need(written?.id===original.id&&written.status==='PLANNED'
      &&Number(written.version)===Number(original.version)+1
      &&written.evidence?.original_code_candidate_pr?.head_sha===pr.headRefOid,
      'ORIGINAL_WRITE_RECEIPT_UNVERIFIED');
  }
  const independent=await fetchOperation(config,workorder.operation_id);
  need(independent.status==='PLANNED'
    &&independent.evidence?.original_code_candidate_pr?.url===pr.url
    &&independent.evidence?.original_code_candidate_pr?.head_sha===pr.headRefOid
    &&independent.evidence?.original_code_candidate_pr?.terminal_success===false
    &&!independent.remote_ref,'INDEPENDENT_READBACK_FAILED');
  const safe={contract:decision.receipt.contract,candidate_id:workorder.candidate_id,
    original_operation_id:original.id,github_pr:pr.url,
    protected_candidate_recorded:true,original_still_planned:true,
    consumer_ack_verified:false,production_not_proven:true};
  process.stdout.write(JSON.stringify(safe)+'\n');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])
  main().catch(e=>{process.stderr.write(String(e.message).slice(0,200)+'\n');process.exitCode=1;});
