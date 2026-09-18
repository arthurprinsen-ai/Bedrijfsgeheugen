import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDeliveryMetadata, parseWriterLease, validateDeliveryMetadata } from './delivery-hygiene.mjs';

const SHA40=/^[0-9a-f]{40}$/i;
const normalize=v=>String(v??'').trim();
const field=(body,label)=>[...String(body??'').matchAll(new RegExp(`^${label}:\\s*(.+)$`,'gim'))].map(m=>normalize(m[1]));
const uniq=a=>[...new Set(a)];

export function createCandidateIdentity({obligationId,headSha,mainEpochSha}={}){
  const obligation=normalize(obligationId);
  const head=normalize(headSha).toLowerCase();
  const epoch=normalize(mainEpochSha).toLowerCase();
  if(!obligation) throw new Error('OBLIGATION_ID_MISSING');
  if(!SHA40.test(head)) throw new Error('CANDIDATE_HEAD_INVALID');
  if(!SHA40.test(epoch)) throw new Error('MAIN_EPOCH_INVALID');
  return Object.freeze({obligation_id:obligation,candidate_head_sha:head,main_epoch_sha:epoch,key:`${obligation}:${head}:${epoch}`});
}

export function validateMachineReadablePrBody({body='',candidateHeadSha='',currentMainSha='',policy={}}={}){
  const metadata=parseDeliveryMetadata(body);
  const errors=[...validateDeliveryMetadata(metadata,policy).errors];
  for(const label of ['Obligation-ID','Delivery-Lane','Candidate-Type','Base-SHA']){
    const values=field(body,label);
    if(values.length!==1) errors.push(values.length===0?`${label.toUpperCase().replaceAll('-','_')}_MISSING`:`${label.toUpperCase().replaceAll('-','_')}_DUPLICATE`);
  }
  const supersedes=field(body,'Supersedes');
  if(supersedes.length>1) errors.push('SUPERSEDES_DUPLICATE');
  const lease=parseWriterLease(body);
  const terminal=lease.state==='TERMINAL_DELIVERY';
  if(terminal){
    const required=['Writer-Lease-State','Writer-Lease-Owner','Writer-Lease-Scope','Writer-Lease-Head','Writer-Lease-Main-Epoch','Writer-Lease-Obligation'];
    for(const label of required){
      const values=field(body,label);
      if(values.length!==1) errors.push(values.length===0?`${label.toUpperCase().replaceAll('-','_')}_MISSING`:`${label.toUpperCase().replaceAll('-','_')}_DUPLICATE`);
    }
    const leaseEpoch=normalize(field(body,'Writer-Lease-Main-Epoch')[0]).toLowerCase();
    const leaseObligation=normalize(field(body,'Writer-Lease-Obligation')[0]);
    if(!SHA40.test(leaseEpoch)) errors.push('WRITER_LEASE_MAIN_EPOCH_INVALID');
    if(leaseObligation!==metadata.obligationId) errors.push('WRITER_LEASE_OBLIGATION_DRIFT');
    if(candidateHeadSha && normalize(lease.headSha).toLowerCase()!==normalize(candidateHeadSha).toLowerCase()) errors.push('WRITER_LEASE_HEAD_DRIFT');
    if(currentMainSha && leaseEpoch!==normalize(currentMainSha).toLowerCase()) errors.push('WRITER_LEASE_MAIN_EPOCH_DRIFT');
  }
  return Object.freeze({ok:errors.length===0,errors:uniq(errors),metadata,lease,terminal});
}

export function scanStaticSecurity(diff=''){
  const text=String(diff??'');
  const findings=[];
  const rules=[
    ['PRIVATE_KEY',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
    ['GITHUB_TOKEN_LITERAL',/(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}/],
    ['AWS_ACCESS_KEY_LITERAL',/AKIA[0-9A-Z]{16}/],
    ['SUPABASE_JWT_LITERAL',/eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/]
  ];
  for(const [id,re] of rules) if(re.test(text)) findings.push(id);
  return Object.freeze({ok:findings.length===0,findings});
}

export function evaluateBranchHygiene({headRef='',baseRef='main'}={}){
  const head=normalize(headRef);
  const base=normalize(baseRef);
  const reasons=[];
  if(base!=='main') reasons.push('BASE_NOT_MAIN');
  if(!head) reasons.push('HEAD_REF_MISSING');
  if(head==='main') reasons.push('DIRECT_MAIN_FORBIDDEN');
  if(/\s/.test(head)) reasons.push('HEAD_REF_WHITESPACE');
  return Object.freeze({ok:reasons.length===0,reasons});
}

export function evaluateTestWorkflowCoverage({changedPaths=[],classifiedLanes=[]}={}){
  const tests=changedPaths.filter(p=>/^tests\/.+\.test\.mjs$/.test(p));
  const reasons=[];
  if(tests.length && !classifiedLanes.length) reasons.push('TESTS_WITHOUT_CLASSIFIED_LANE');
  return Object.freeze({ok:reasons.length===0,reasons,tests,classifiedLanes:uniq(classifiedLanes)});
}

function conclusionOk(v){return ['success','neutral','skipped'].includes(normalize(v).toLowerCase());}

export function evaluateTerminalMergeGuard({
  body='',policy={},candidateHeadSha='',validatedHeadSha='',currentMainSha='',behindBy=null,mergeable=true,
  requiredChecks=[],openCandidates=[]
}={}){
  const contract=validateMachineReadablePrBody({body,candidateHeadSha,currentMainSha,policy});
  const reasons=[...contract.errors];
  if(!contract.terminal) reasons.push('TERMINAL_WRITER_LEASE_REQUIRED');
  if(normalize(candidateHeadSha).toLowerCase()!==normalize(validatedHeadSha).toLowerCase()) reasons.push('VALIDATED_HEAD_DRIFT');
  if(Number(behindBy)!==0) reasons.push('BEHIND_MAIN');
  if(mergeable===false) reasons.push('MERGE_CONFLICT');
  const failed=requiredChecks.filter(c=>!conclusionOk(c.conclusion)).map(c=>c.name||c.context||'unknown');
  if(failed.length) reasons.push(`REQUIRED_CHECKS_NOT_GREEN:${failed.join(',')}`);
  const newer=openCandidates.filter(c=>{
    const m=parseDeliveryMetadata(c.body||'');
    return Number(c.number)>Number(c.selfNumber??0) && m.obligationId && m.obligationId===contract.metadata.obligationId;
  });
  if(newer.length) reasons.push(`CANONICAL_SUCCESSOR_EXISTS:${newer.map(c=>c.number).join(',')}`);
  const identity=contract.metadata.obligationId && SHA40.test(normalize(candidateHeadSha)) && SHA40.test(normalize(currentMainSha))
    ? createCandidateIdentity({obligationId:contract.metadata.obligationId,headSha:candidateHeadSha,mainEpochSha:currentMainSha})
    : null;
  return Object.freeze({ok:reasons.length===0,state:reasons.length?'BLOCKED_TERMINAL_MERGE':'TERMINAL_MERGE_ADMITTED',reasons,identity,contract,failedChecks:failed});
}

function arg(name){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:'';}
const isCli=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isCli){
  const cmd=process.argv[2];
  try{
    if(cmd==='security-static'){
      const diff=fs.readFileSync(arg('--diff'),'utf8');
      const result=scanStaticSecurity(diff);
      console.log(JSON.stringify(result,null,2));
      if(!result.ok) process.exitCode=78;
    } else if(cmd==='terminal-guard'){
      const payload=JSON.parse(fs.readFileSync(arg('--input'),'utf8'));
      const result=evaluateTerminalMergeGuard(payload);
      console.log(JSON.stringify(result,null,2));
      if(!result.ok) process.exitCode=78;
    } else {
      throw new Error('USAGE: github-delivery-state-machine.mjs security-static --diff <file> | terminal-guard --input <file>');
    }
  }catch(error){console.error(`GITHUB_DELIVERY_STATE_MACHINE_FAILED: ${error.message}`);process.exitCode=1;}
}
