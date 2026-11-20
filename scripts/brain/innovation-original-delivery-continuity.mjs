import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {readCanonicalRows,evaluateOriginalOwnerHandoff} from './innovation-original-owner-readback.mjs';
import {trustedBrainReadConfig} from './planned-action-review-audit.mjs';
import {readOriginalSalesExecutionAudit} from '../../platform/portal/powerhouse-existing-integration-read-model.mjs';
import {CONTRACT as QUALITY_CONTRACT,QUALITY_NEXT} from './innovation-original-evidence-reconciliation.mjs';
import {readCanonicalProductionReleaseIdentity} from '../../tools/ci/portal-canonical-browser-release-fence.mjs';

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

// The original 14 source-quality receipts are immutable nonterminal evidence.
// A historical quality signal can specify the original owner's NEXT proof duty,
// but cannot authorize a build, provider send, consumer ACK, or effect claim.
export function sourceQualityNextAction({candidate,obligation,operation,decision,alreadyVerified=false}={}){
  const receipt=operation?.evidence?.original_evidence_reconciliation;
  if(!receipt||candidate?.proposed_action?.kind!=='bounded_learning_followup')return null;
  const quality=receipt.source_quality;
  const expected=QUALITY_NEXT[candidate.component_id];
  assert(decision?.decision==='BASELINE_AND_EVALUATION_DESIGN_REQUIRED'&&
    operation.status==='PLANNED'&&!alreadyVerified&&
    receipt.contract===QUALITY_CONTRACT&&
    receipt.candidate_id===candidate.candidate_id&&
    receipt.original_operation_id===operation.id&&
    receipt.original_owner===operation.capability_id&&
    receipt.source_revision===obligation.evidence?.source_revision&&
    receipt.source_sha256===operation.payload_sha256&&
    receipt.original_change_id===candidate.source_key&&
    receipt.source_decision_fingerprint===decision.fingerprint&&
    receipt.source_pre_review_fingerprint===operation.evidence?.original_agent_pre_review?.fingerprint&&
    quality?.original_fingerprint===candidate.baseline?.quality_fingerprint&&
    ['verified','guarded'].includes(quality?.status)&&
    quality.historical_claim_not_current_production_proof===true&&
    /^[a-f0-9]{64}$/i.test(quality.source_evidence_sha256)&&
    /^[a-f0-9]{64}$/i.test(receipt.fingerprint)&&
    receipt.next_action===expected&&typeof expected==='string'&&
    receipt.disposition===(quality.status==='verified'?
      'HISTORICAL_VERIFIED_QUALITY_SOURCE_CURRENT_EFFECT_DUE':
      'HISTORICAL_GUARDED_QUALITY_SOURCE_CURRENT_PROOF_DUE')&&
    receipt.evidence_type==='HISTORICAL_FIRST_PARTY_QUALITY_EVENT_UNCONFIRMED_AS_CURRENT_PRODUCTION'&&
    receipt.independently_verified_current_effect===false&&
    receipt.consumer_ack_verified===false&&receipt.terminal_success===false&&
    receipt.historical_baseline_not_current_effect===true&&
    receipt.protected_review_required===true&&
    receipt.automated_external_provider_dispatch===false,
    'ORIGINAL_QUALITY_RECEIPT_SOURCE_OR_AUTHORITY_DRIFT');
  return Object.freeze({
    stage:quality.status==='verified'?
      'HISTORICAL_VERIFIED_QUALITY_SOURCE_CURRENT_EFFECT_DUE':
      'HISTORICAL_GUARDED_QUALITY_SOURCE_CURRENT_PROOF_DUE',
    next_action:expected,receipt_fingerprint:receipt.fingerprint,
    quality_evidence_digest:quality.source_evidence_sha256,
    historical_source_status:quality.status,
    current_effect_verified:false,
    consumer_ack_verified:false
  });
}

export function examineOriginalDelivery({candidate,obligation,operation,githubPr=null,production=null,legacyPr=null,sourceAudit=null,checkedAt=new Date().toISOString()}={}){
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
  let preexistingProtectedSource=false;
  let internalSourceReadback=null;
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

  // One original 55bb source-joined sales-execution innovation was implemented
  // through an earlier protected portal PR, before the bounded Codex selector
  // existed. Its original intake has no new exact-purpose PR receipt; that must
  // NOT reset a real historical implementation back to "build missing".
  // Historical source text alone is not live provider, customer or impact proof.
  // A validated no-change Codex attempt is NOT historical implementation
  // proof and cannot hide an earlier, independently protected source release.
  // The original no-change source identity was checked above; leave its
  // immutable evidence intact, but prioritize original native PR and current
  // source readback without re-building the protected implementation.
  const existingSource=operation.evidence?.protected_implementation_source_evidence;
  if(candidate.component_id==='powerhouse-sales-cycle-execution-read-model'&&
    !prior&&!alreadyVerified&&existingSource){
    assert(existingSource.contract==='ORIGINAL_ENGINEERING_IMPLEMENTATION_EVIDENCE_V1'&&
      existingSource.candidate_id===candidate.candidate_id&&
      existingSource.original_owner===owner&&
      existingSource.source_revision===obligation.evidence.source_revision&&
      existingSource.implementation_scope==='readonly_original_sales_action_full_week_census'&&
      existingSource.protected_release_verified===true&&
      /^https:\/\/github\.com\/arthurprinsen-ai\/Bedrijfsgeheugen\/pull\/[1-9][0-9]*$/.test(existingSource.pr_url),
      'LEGACY_IMPLEMENTATION_SOURCE_IDENTITY_CONFLICT');
    stage='PREEXISTING_PROTECTED_SOURCE_NATIVE_PR_READBACK_DUE';
    if(legacyPr){
      assert(legacyPr.url===existingSource.pr_url&&
        legacyPr.number===Number(existingSource.pr_url.split('/').at(-1))&&
        legacyPr.baseRefName==='main'&&
        typeof legacyPr.body==='string'&&
        legacyPr.body.includes('Original candidate `'+candidate.candidate_id+'`')&&
        legacyPr.body.includes('Candidate-Type: implementation')&&
        legacyPr.body.includes('Writer-Lease-Owner: original agent:agent-integration-engineer'),
        'LEGACY_GITHUB_PR_LINEAGE_CONFLICT');
      if(legacyPr.state==='MERGED'&&SHA.test(legacyPr.mergeCommit?.oid)){
        preexistingProtectedSource=true;
        stage='PREEXISTING_PROTECTED_SOURCE_CURRENT_PROVIDER_AUDIT_DUE';
        // This is a NEW live native PostgREST 7-day exact-count, full-page
        // source-action join. Only internal sales execution is measured.
        if(sourceAudit?.readOnly===true&&
          sourceAudit.externalProviderProof===false&&
          sourceAudit.paidOutcomeProof===false&&
          sourceAudit.scope==='FULL_LAST_7D'&&
          Number.isSafeInteger(sourceAudit.totalEvents7d)&&
          Number.isSafeInteger(sourceAudit.sampledEvents)&&
          sourceAudit.totalEvents7d===sourceAudit.sampledEvents&&
          Number.isSafeInteger(sourceAudit.actionBackedSample)&&
          Number.isSafeInteger(sourceAudit.unsupportedSample)&&
          sourceAudit.actionBackedSample>=0&&
          sourceAudit.unsupportedSample>=0&&
          sourceAudit.actionBackedSample+sourceAudit.unsupportedSample===sourceAudit.sampledEvents&&
          Number.isFinite(Date.parse(sourceAudit.observedAt))&&
          Math.abs(Date.parse(checkedAt)-Date.parse(sourceAudit.observedAt))<=3600000){
          internalSourceReadback={
            provider:'ORIGINAL_CANONICAL_SUPABASE_POSTGREST',
            scope:'FULL_LAST_7D',
            state:sourceAudit.state,
            total_internal_execution_events_7d:sourceAudit.totalEvents7d,
            writer_action_joined:sourceAudit.actionBackedSample,
            unsupported_internal_events:sourceAudit.unsupportedSample,
            missing_original_actions:sourceAudit.missingActionSample,
            current_action_not_done:sourceAudit.currentActionNotDoneSample,
            current_execution_missing_event:sourceAudit.currentExecutionWithoutEventSample,
            independent_provider_send_verified:false,
            independent_revenue_or_customer_value_verified:false
          };
          stage=sourceAudit.state==='HISTORICAL_WRITER_ACTION_JOINED_PROVIDER_UNVERIFIED'?
            'PREEXISTING_SOURCE_CURRENTLY_MEASURED_CAUSAL_OUTCOME_DUE':
            sourceAudit.state==='NO_EXECUTION_EVENTS_OBSERVED'?
              'PREEXISTING_SOURCE_NO_CURRENT_EVENTS_MEASUREMENT_DUE':
              'PREEXISTING_SOURCE_GAPS_REQUIRE_ORIGINAL_OWNER_REPAIR';
        }
      }else stage='PREEXISTING_PROTECTED_SOURCE_PR_NOT_MERGED_REVIEW_DUE';
    }
  }
  const originalQualityAction=sourceQualityNextAction({
    candidate,obligation,operation,decision,alreadyVerified
  });
  if(originalQualityAction){
    assert(stage==='BASELINE_OR_SAFE_SCOPE_DUE','ORIGINAL_QUALITY_CANNOT_REPLACE_CODE_OR_IMPACT');
    stage=originalQualityAction.stage;
  }
  // Neither a PR nor a deploy can attest measured business impact.
  const assessment={contract:CONTRACT,candidate_id:candidate.candidate_id,
    source_revision:obligation.evidence.source_revision,
    source_sha256:operation.payload_sha256,original_owner:owner,
    original_operation_id:operation.id,delivery_lane:statusKind(decision.decision),
    stage,pr_number:prNumber,merge_sha:mergeSha,
    original_quality_next_action:originalQualityAction?.next_action??null,
    original_quality_receipt_fingerprint:originalQualityAction?.receipt_fingerprint??null,
    original_quality_evidence_sha256:originalQualityAction?.quality_evidence_digest??null,
    current_quality_effect_verified:false,
    production_deploy_id:deployId,production_sha:deployedSha,
    verified_code_in_production:codeInProduction,
    historically_verified_code_release:previouslyVerifiedCodeRelease,
    existing_protected_source_pr_verified:preexistingProtectedSource,
    internal_source_readback:internalSourceReadback,
    expected_impact:null,actual_impact:null,holdout_impact:null,
    independent_impact_verified:false,consumer_ack_verified:alreadyVerified,
    independent_heartbeat_learning_verified:false,terminal_success:false,
    original_state_remains:operation.status,obligation_state_remains:obligation.state,
    checked_at:checkedAt};
  const {checked_at,...stable}=assessment;
  return Object.freeze({...assessment,assessment_fingerprint:fingerprint(stable)});
}

export function planOriginalContinuity({snapshot,report,githubPrByCandidate={},productionByCandidate={},legacyPrByCandidate={},sourceAuditByCandidate={},checkedAt=new Date().toISOString()}={}){
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
      production:productionByCandidate[candidate.candidate_id]??null,
      legacyPr:legacyPrByCandidate[candidate.candidate_id]??null,
      sourceAudit:sourceAuditByCandidate[candidate.candidate_id]??null,checkedAt})}));
  }
  assert(plans.length===snapshot.obligations.length&&plans.length===snapshot.intakes.length,
    'SOURCE_CARDINALITY_DRIFT');
  return Object.freeze(plans);
}

function gh(args){return JSON.parse(execFileSync('gh',args,{encoding:'utf8',timeout:25000,maxBuffer:3000000}));}
async function netlifyProduction({fetchImpl=fetch,env=process.env}={}){
  const token=string(env.NETLIFY_AUTH_TOKEN),site=string(env.NETLIFY_SITE_ID);
  // The original read-only GitHub job intentionally has no Netlify API secrets.
  // Use existing strict two-manifest public proof; GitHub merge ancestry is
  // checked separately before any code-in-production classification.
  if(!token||!site)return readCanonicalProductionReleaseIdentity({fetchImpl});
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
  const legacyPrByCandidate={};
  const sourceAuditByCandidate={};
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

  // Existing original source-joined innovation was protected released before
  // this bounded Codex PR generator existed. Reconcile its REAL native PR and
  // actual source data, rather than generating duplicate code or inventing ACK.
  for(const candidate of snapshot.candidates){
    if(candidate.component_id!=='powerhouse-sales-cycle-execution-read-model')continue;
    const operation=snapshot.intakes.find(op=>op.correlation_id==='innovation-delivery:'+candidate.candidate_id);
    const existing=operation?.evidence?.protected_implementation_source_evidence;
    if(!existing||operation.evidence?.original_code_candidate_pr)continue;
    const match=/^https:\/\/github\.com\/arthurprinsen-ai\/Bedrijfsgeheugen\/pull\/([1-9][0-9]*)$/.exec(existing.pr_url);
    assert(match,'LEGACY_SOURCE_PR_UNBOUNDED');
    try{
      legacyPrByCandidate[candidate.candidate_id]=gh(['pr','view',match[1],'--repo',REPO,'--json',
        'number,url,state,headRefName,headRefOid,baseRefName,body,mergeCommit']);
    }catch{
      // Missing provider proof is nonterminal, never fake "not implemented".
    }
    sourceAuditByCandidate[candidate.candidate_id]=await readOriginalSalesExecutionAudit({
      baseUrl:config.origin,key:config.key});
  }
  const plans=planOriginalContinuity({snapshot,report,githubPrByCandidate,productionByCandidate,
    legacyPrByCandidate,sourceAuditByCandidate});
  const counts={};let writes=0;
  for(const item of plans){
    counts[item.assessment.stage]=(counts[item.assessment.stage]??0)+1;
    if(await persistOriginal(config,item))writes++;
  }
  process.stdout.write(JSON.stringify({contract:CONTRACT,source_count:plans.length,reviewed:plans.length,
    actual_provider_verified_code_in_production:plans.filter(x=>x.assessment.verified_code_in_production).length,
    original_legacy_protected_source_reconciled:plans.filter(x=>x.assessment.existing_protected_source_pr_verified).length,
    independently_audited_internal_sales_execution:plans.filter(x=>x.assessment.internal_source_readback?.scope==='FULL_LAST_7D').length,
    independently_measured_outcomes:0,original_terminalized:0,original_rows_updated:writes,
    states:counts,missing_or_unproven:plans.length,no_new_agent:true,no_new_schedule:true,
    no_external_send:true,terminal_success:false})+'\n');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])
  main().catch(err=>{process.stderr.write(String(err.message).slice(0,240)+'\n');process.exitCode=1;});
