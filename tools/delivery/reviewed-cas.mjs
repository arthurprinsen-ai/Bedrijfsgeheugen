// Reviewed union transport boundary. Never called by the production entrypoint
// until an independent, provider-enforced main-wide reservation exists.
import { createHash } from 'node:crypto';
import { createSupabaseLeaseVerifier } from './writer-real-adapters.mjs';
const SHA=/^[a-f0-9]{40}$/;
const HASH=/^[a-f0-9]{64}$/;
const positive=n=>Number.isSafeInteger(n)&&n>0;
const safeInteger=n=>typeof n==='string'&&/^[1-9]\d*$/.test(n)?Number(n):n;
const REPO='arthurprinsen-ai/Bedrijfsgeheugen';
// One canonical serialization for preparation, transport and recovery.
function reviewedIntentDigest(i){
 const canonical={repository:i.repository,state:i.state,prNumber:i.prNumber,head:i.head,main:i.main,branch:i.branch,obligation:i.obligation,holder:i.holder,manifestSha256:i.manifestSha256,generation:i.generation,revision:i.revision,commit:i.commit,tree:i.tree};
 return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}
function requireCondition(ok,code){if(ok!==true)throw Error(code);}
export async function publishReviewedUnion({manifest,preflight,prepared,holder,authorizedPgQuery,github,slot,transport,ttlSeconds=120}){
 // Pin caller-owned scalar identities before any asynchronous adapter invocation.
 manifest=Object.freeze({...manifest}); preflight=Object.freeze({...preflight}); prepared=Object.freeze({...prepared});
 const head=manifest?.expectedHead, main=preflight?.executionMainSha, branch=manifest?.branch, obligation=manifest?.obligation;
 requireCondition(!!prepared&&!!preflight&&HASH.test(preflight.manifestSha256||'')&&prepared.manifestSha256===preflight.manifestSha256&&prepared.state==='PREPARED_NOT_PUBLISHED'&&prepared.writeAuthorized===false&&preflight.writeAuthorized===false&&head===prepared.head&&head===preflight.headSha&&main===prepared.main&&branch===preflight.branch&&obligation===preflight.obligation&&manifest.expectedBase===preflight.prBaseSha&&[head,main,prepared.commit,prepared.tree].every(s=>typeof s==='string'&&SHA.test(s))&&prepared.commit!==head&&prepared.commit!==main,'UNION_IDENTITY_UNPROVEN');
 requireCondition(typeof branch==='string'&&branch!=='main'&&branch.length>0&&typeof obligation==='string'&&obligation.length>0&&typeof holder==='string'&&/^github-actions:\d+:\d+$/.test(holder)&&positive(manifest.prNumber)&&positive(ttlSeconds)&&ttlSeconds<=300,'REVIEWED_WRITER_CONTEXT_INVALID');
 requireCondition(typeof authorizedPgQuery==='function'&&typeof github?.readReviewedPR==='function'&&typeof github?.readHead==='function'&&typeof slot?.readReservation==='function'&&typeof slot?.readPendingReservation==='function'&&typeof transport?.inspect==='function'&&typeof transport?.pushExact==='function'&&typeof transport?.readCommit==='function','REVIEWED_CAS_ADAPTER_REQUIRED');
 const expected=Object.freeze({prNumber:manifest.prNumber,head,main,branch,obligation,holder,manifestSha256:preflight.manifestSha256});
 const readSlot=async()=>{
   const s=await slot.readReservation(expected);
   requireCondition(s?.state==='EXCLUSIVE_PREWRITE_RESERVED'&&s.providerEnforced===true&&s.mutationAuthority===true&&s.appId===5916428&&positive(s.generation)&&positive(s.revision)&&s.prNumber===expected.prNumber&&s.head===head&&s.main===main&&s.branch===branch&&s.obligation===obligation&&s.holder===holder&&s.manifestSha256===expected.manifestSha256&&s.activeGrantCount===0&&s.nativeBypassDenied===true,'MAIN_WIDE_PROVIDER_RESERVATION_UNPROVEN');
   return Object.freeze({generation:s.generation,revision:s.revision});
 };
 const identity=async()=>{
   const p=await github.readReviewedPR(manifest.prNumber);
   requireCondition(p?.open===true&&p.number===manifest.prNumber&&p.headSha===head&&p.branch===branch&&p.obligation===obligation&&p.baseSha===manifest.expectedBase,'REVIEWED_CANDIDATE_DRIFT');
   requireCondition(await github.readHead('main')===main,'MAIN_EPOCH_DRIFT');
   requireCondition(await github.readHead(branch)===head,'BRANCH_HEAD_DRIFT');
 };
 const object=await transport.inspect(prepared.commit);
 requireCondition(object?.tree===prepared.tree&&Array.isArray(object.parents)&&object.parents.length===2&&object.parents[0]===head&&object.parents[1]===main,'UNION_OBJECT_MISMATCH');
 await identity();
 const reserved=await readSlot(); const {generation,revision}=reserved; // no lease acquisition on an unproven global slot
 const rows=await authorizedPgQuery('select token, valid_until from writer_control.acquire($1,$2,$3,$4,$5,$6)',[obligation,holder,branch,head,main,ttlSeconds]);
 const raw=rows?.[0]?.token;
 const token=typeof raw==='number'?raw:typeof raw==='string'&&/^[1-9]\d*$/.test(raw)?Number(raw):NaN;
 requireCondition(Array.isArray(rows)&&rows.length===1&&positive(token),'ACQUIRE_NOT_CONFIRMED');
 const db=createSupabaseLeaseVerifier({query:authorizedPgQuery});
 let prepareAttempted=false,readbackComplete=false;
 try {
   const verify=async()=>requireCondition(await db.verifyLease({obligation,holder,token,branch,head,main}),'REVIEWED_LEASE_LOST');
   await verify();
   await identity();
   const again=await readSlot();
   requireCondition(again.revision===revision&&again.generation===generation,'MAIN_WIDE_RESERVATION_CHANGED');
   await verify();
   // Persist the exact write intent atomically before any irreversible transport.
   // A lost/ambiguous reply leaves the global reservation unresolved, never retryable.
   const pendingRevision=revision+1;
   requireCondition(positive(pendingRevision),'PREWRITE_REVISION_INVALID');
   const intent={repository:REPO,state:'prewrite_pending',...expected,generation,revision:pendingRevision,commit:prepared.commit,tree:prepared.tree};
   const intentDigest=reviewedIntentDigest(intent);
   prepareAttempted=true;
   const proof=await prepareReviewedPrewrite({intent:{...intent,intentDigest},authorizedPgQuery});
   requireCondition(proof.state==='PREWRITE_DURABLE_INTENT_OBSERVED_OWNER_REVIEW',proof.state);
   // A database record is not provider exclusivity. The protected native adapter
   // must independently attest the exact pending generation/revision and object.
   const pending=await slot.readPendingReservation({...intent,intentDigest});
   requireCondition(pending?.state==='EXCLUSIVE_PREWRITE_PENDING'&&pending.providerEnforced===true&&pending.mutationAuthority===true&&pending.nativeBypassDenied===true&&pending.appId===5916428&&pending.activeGrantCount===0&&[...Object.keys(intent).filter(k=>k!=='state'),'intentDigest'].every(k=>pending[k]===(k==='intentDigest'?intentDigest:intent[k])),'MAIN_WIDE_PENDING_PROVIDER_FENCE_UNPROVEN');
   await identity(); await verify();
   // Provider must perform exact expected-old-ref CAS; a plain REST fast-forward
   // or force=true update is not sufficient. Do not retry an ambiguous response.
   const response=await transport.pushExact({branch,expectedHead:head,newHead:prepared.commit,main,token,revision:pendingRevision,generation,intentDigest});
   requireCondition(response?.accepted===true,'NATIVE_EXPECTED_HEAD_CAS_UNPROVEN');
   requireCondition(await github.readHead(branch)===prepared.commit,'CAS_BRANCH_READBACK_MISMATCH');
   const commit=await transport.readCommit(prepared.commit);
   requireCondition(commit?.sha===prepared.commit&&commit.tree===prepared.tree&&Array.isArray(commit.parents)&&commit.parents.length===2&&commit.parents[0]===head&&commit.parents[1]===main,'CAS_COMMIT_READBACK_MISMATCH');
   requireCondition(await github.readHead('main')===main,'MAIN_MOVED_AFTER_CAS_RECONCILE_ONLY');
   readbackComplete=true;
   return Object.freeze({status:'PUBLISHED_PENDING_FULL_BRAIN',newHead:prepared.commit,tree:prepared.tree,leaseGeneration:token,slotRevision:pendingRevision,slotGeneration:generation,globalReservationResolved:false,mergeAuthorized:false,productionVerified:false});
 }finally{
   // Even an ambiguous prepare may have committed. Retain lease until proven readback.
   if(!prepareAttempted||readbackComplete){
   const released=await authorizedPgQuery('select writer_control.release($1,$2,$3) as released',[obligation,holder,token]);
   requireCondition(released?.length===1&&released[0].released===true,'WRITER_LEASE_RELEASE_NOT_CONFIRMED');
   }
 }
}

 // Review-only classifier. Never release a reservation, grant, retry or write.
 // Trusted provider adapters must independently establish receipt provenance.
 export function classifyPrewriteResolution({intent:i,observation:o}={}) {
  const result=state=>Object.freeze({state,mutationAuthority:false,releaseAuthorized:false,retryAuthorized:false,mergeAuthorized:false});
  if(i?.repository!=='arthurprinsen-ai/Bedrijfsgeheugen'||i.state!=='prewrite_pending'||
     !positive(i.prNumber)||!positive(i.generation)||!positive(i.revision)||
     typeof i.holder!=='string'||!/^github-actions:\d+:\d+$/.test(i.holder)||
     typeof i.branch!=='string'||!i.branch||i.branch==='main'||
     typeof i.obligation!=='string'||!i.obligation.trim()||
     ![i.head,i.main,i.commit,i.tree].every(x=>typeof x==='string'&&SHA.test(x))||
     i.commit===i.head||i.commit===i.main||typeof i.manifestSha256!=='string'||!HASH.test(i.manifestSha256))
    return result('INTENT_IDENTITY_UNPROVEN');
  const fields=['repository','prNumber','generation','revision','holder','branch','obligation','head','main','commit','tree','manifestSha256'];
  if(!o||fields.some(k=>o[k]!==i[k])||o.independentReadback!==true||
     ![o.branchBefore,o.branchAfter,o.mainBefore,o.mainAfter].every(x=>typeof x==='string'&&SHA.test(x)))
    return result('READBACK_IDENTITY_UNPROVEN');
  if(o.branchBefore!==o.branchAfter||o.mainBefore!==o.mainAfter)
    return result('PROVIDER_MOVEMENT_RECONCILE_ONLY');
  if(o.branchAfter===i.commit) {
    const c=o.commitObject;
    if(c?.sha!==i.commit||c.tree!==i.tree||!Array.isArray(c.parents)||c.parents.length!==2||c.parents[0]!==i.head||c.parents[1]!==i.main)
      return result('COMMIT_OBJECT_UNPROVEN');
    if(o.mainAfter!==i.main)return result('MAIN_MOVED_RECONCILE_ONLY');
    if(o.transportOutcome!=='accepted')return result('EXPECTED_COMMIT_VISIBLE_CAUSALITY_UNPROVEN');
    return result('EXACT_WRITE_OBSERVED_OWNER_REVIEW');
  }
  if(o.branchAfter!==i.head)return result('UNEXPECTED_BRANCH_RECONCILE_ONLY');
  if(o.mainAfter!==i.main)return result('MAIN_MOVED_RECONCILE_ONLY');
  if(o.transportOutcome==='rejected'&&o.credentialQuiescenceVerified===true&&o.inFlightTransportExcluded===true)
    return result('EXACT_REJECTION_OBSERVED_OWNER_REVIEW');
  return result('UNCHANGED_HEAD_UNRESOLVED');
 }

// Provider readback collector. Read only; cannot establish transport causality or
// credential quiescence. The durable resolver must obtain those separately.
export async function collectPrewriteReadback({intent,github}={}) {
 const hold=reason=>Object.freeze({state:reason,mutationAuthority:false,releaseAuthorized:false,retryAuthorized:false});
 const invalid=classifyPrewriteResolution({intent,observation:null});
 if(invalid.state==='INTENT_IDENTITY_UNPROVEN')return hold(invalid.state);
 if(typeof github?.readReviewedPR!=='function'||typeof github?.readHead!=='function'||typeof github?.readCommit!=='function')return hold('PROVIDER_READ_ADAPTER_REQUIRED');
 const keys=['repository','prNumber','generation','revision','holder','branch','obligation','head','main','commit','tree','manifestSha256'];
 const id=Object.fromEntries(keys.map(k=>[k,intent[k]]));
 const validPR=p=>p?.open===true&&p.number===id.prNumber&&p.branch===id.branch&&p.obligation===intent.obligation&&typeof p.headSha==='string'&&SHA.test(p.headSha);
 if(typeof intent.obligation!=='string'||!intent.obligation.trim())return hold('INTENT_OBLIGATION_UNPROVEN');
 try {
  const p=await github.readReviewedPR(id.prNumber);
  if(!validPR(p))return hold('NATIVE_PR_IDENTITY_UNPROVEN');
  const mainBefore=await github.readHead('main'),branchBefore=await github.readHead(id.branch);
  if(p.headSha!==branchBefore)return hold('NATIVE_PR_REF_DRIFT');
  let commitObject=null;
  if(branchBefore===id.commit)commitObject=await github.readCommit(id.commit);
  const branchAfter=await github.readHead(id.branch),mainAfter=await github.readHead('main');
  const q=await github.readReviewedPR(id.prNumber);
  if(!validPR(q)||q.headSha!==branchAfter||p.baseSha!==q.baseSha)return hold('NATIVE_PR_REF_DRIFT');
  const observation=Object.freeze({...id,independentReadback:true,mainBefore,branchBefore,mainAfter,branchAfter,commitObject,transportOutcome:'ambiguous',credentialQuiescenceVerified:false,inFlightTransportExcluded:false});
  return Object.freeze({...classifyPrewriteResolution({intent,observation}),observation});
 }catch{return hold('NATIVE_READBACK_UNAVAILABLE')}
}

// Staging-only adapter for the existing durable SQL intent contract.
// This adapter never transports, grants, retries or resolves a reservation.
// A lost response can mean the intent committed: fail closed and reconcile.
export async function prepareReviewedPrewrite({intent,authorizedPgQuery}={}) {
 const result=state=>Object.freeze({state,mutationAuthority:false,releaseAuthorized:false,retryAuthorized:false,mergeAuthorized:false});
 if(classifyPrewriteResolution({intent,observation:null}).state==='INTENT_IDENTITY_UNPROVEN'||
    !positive(intent.revision-1)||!HASH.test(intent.intentDigest||''))
  return result('PREWRITE_INPUT_UNPROVEN');
 if(typeof authorizedPgQuery!=='function')return result('PREWRITE_SQL_ADAPTER_REQUIRED');
 const i=Object.freeze({...intent});
 if(reviewedIntentDigest(i)!==i.intentDigest)return result('PREWRITE_INTENT_DIGEST_MISMATCH');
 const numberEquals=(value,expected)=>value===expected||(typeof value==='string'&&/^[1-9][0-9]*$/.test(value)&&value===String(expected));
 try {
  const rows=await authorizedPgQuery(
   'select generation,revision,state from delivery_control.prepare_prewrite($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
   [i.repository,i.holder,i.generation,i.revision-1,i.prNumber,i.head,i.main,i.manifestSha256,i.branch,i.obligation,i.commit,i.tree,i.intentDigest]);
  if(!Array.isArray(rows)||rows.length!==1||!numberEquals(rows[0].generation,i.generation)||
     !numberEquals(rows[0].revision,i.revision)||rows[0].state!=='prewrite_pending')
   return result('PREWRITE_PREPARE_UNCONFIRMED');
 } catch {return result('PREWRITE_PREPARE_UNCONFIRMED')}
 try {
  const rows=await authorizedPgQuery(
   `select i.repository,i.generation,i.revision,i.holder,i.pr_number,i.head_sha,i.main_sha,i.branch,i.obligation,
    i.commit_sha,i.tree_sha,i.manifest_digest,i.intent_digest,e.evidence_digest,r.state
    from delivery_control.promotion_prewrite_intent i
    join delivery_control.promotion_reservation r on r.repository=i.repository and r.generation=i.generation
     and r.revision=i.revision and r.holder=i.holder and r.pr_number=i.pr_number and r.head_sha=i.head_sha
     and r.main_sha=i.main_sha and r.manifest_digest=i.manifest_digest
    join delivery_control.promotion_reservation_event e on e.repository=i.repository and e.generation=i.generation
     and e.revision=i.revision and e.holder=i.holder and e.pr_number=i.pr_number and e.head_sha=i.head_sha
     and e.main_sha=i.main_sha and e.manifest_digest=i.manifest_digest and e.action='prepare_prewrite' and e.state=r.state
    where i.repository=$1 and i.generation=$2 and r.state='prewrite_pending' and r.valid_until>clock_timestamp()`,
   [i.repository,i.generation]);
  const r=rows?.[0];
  if(!Array.isArray(rows)||rows.length!==1||r.state!=='prewrite_pending'||!numberEquals(r.generation,i.generation)||
     !numberEquals(r.revision,i.revision)||!numberEquals(r.pr_number,i.prNumber)||
     r.repository!==i.repository||r.holder!==i.holder||r.head_sha!==i.head||r.main_sha!==i.main||
     r.branch!==i.branch||r.obligation!==i.obligation||r.commit_sha!==i.commit||r.tree_sha!==i.tree||
     r.manifest_digest!==i.manifestSha256||r.intent_digest!==i.intentDigest||r.evidence_digest!==i.intentDigest)
   return result('PREWRITE_DURABLE_READBACK_UNPROVEN');
  return result('PREWRITE_DURABLE_INTENT_OBSERVED_OWNER_REVIEW');
 }catch{return result('PREWRITE_DURABLE_READBACK_UNAVAILABLE')}
}

// Read-only recovery after an ambiguous prepare or transport, including expired leases.
// No renewal, release, retry, status mutation or authority is inferred.
export async function recoverReviewedPrewrite({intent,authorizedPgQuery,github}={}) {
 const hold=state=>Object.freeze({state,mutationAuthority:false,releaseAuthorized:false,retryAuthorized:false,mergeAuthorized:false});
 if(classifyPrewriteResolution({intent,observation:null}).state==='INTENT_IDENTITY_UNPROVEN'||!HASH.test(intent.intentDigest||'')||!positive(intent.revision-1))return hold('RECOVERY_INPUT_UNPROVEN');
 if(typeof authorizedPgQuery!=='function')return hold('RECOVERY_SQL_ADAPTER_REQUIRED');
 const i=Object.freeze({...intent});
 // Reconstruct the exact canonical write-intent serialization, not caller property order.
 if(reviewedIntentDigest(i)!==i.intentDigest)return hold('RECOVERY_INTENT_DIGEST_MISMATCH');
 const query=()=>authorizedPgQuery(
 `select i.repository,i.generation,i.revision,i.holder,i.pr_number,i.head_sha,i.main_sha,i.branch,i.obligation,i.commit_sha,i.tree_sha,i.manifest_digest,i.intent_digest,e.evidence_digest,r.state
 from delivery_control.promotion_prewrite_intent i
 join delivery_control.promotion_reservation r on r.repository=i.repository and r.generation=i.generation and r.revision=i.revision and r.holder=i.holder and r.pr_number=i.pr_number and r.head_sha=i.head_sha and r.main_sha=i.main_sha and r.manifest_digest=i.manifest_digest
 join delivery_control.promotion_reservation_event e on e.repository=i.repository and e.generation=i.generation and e.revision=i.revision and e.holder=i.holder and e.pr_number=i.pr_number and e.head_sha=i.head_sha and e.main_sha=i.main_sha and e.manifest_digest=i.manifest_digest and e.action='prepare_prewrite' and e.state=r.state
 where i.repository=$1 and i.generation=$2 and r.state='prewrite_pending'`,[i.repository,i.generation]);
 const eq=(a,b)=>a===b||(typeof a==='string'&&a===String(b));
 const exact=rows=>{const r=rows?.[0];return Array.isArray(rows)&&rows.length===1&&r?.state==='prewrite_pending'&&eq(r.generation,i.generation)&&eq(r.revision,i.revision)&&eq(r.pr_number,i.prNumber)&&r.repository===i.repository&&r.holder===i.holder&&r.head_sha===i.head&&r.main_sha===i.main&&r.branch===i.branch&&r.obligation===i.obligation&&r.commit_sha===i.commit&&r.tree_sha===i.tree&&r.manifest_digest===i.manifestSha256&&r.intent_digest===i.intentDigest&&r.evidence_digest===i.intentDigest};
 try{
  if(!exact(await query()))return hold('RECOVERY_DURABLE_INTENT_UNPROVEN');
  const observed=await collectPrewriteReadback({intent:i,github});
  if(!exact(await query()))return hold('RECOVERY_RESERVATION_CHANGED');
  return Object.freeze({...hold('RECOVERY_READBACK_OWNER_REVIEW'),providerState:observed.state});
 }catch{return hold('RECOVERY_DURABLE_READBACK_UNAVAILABLE')}
}
