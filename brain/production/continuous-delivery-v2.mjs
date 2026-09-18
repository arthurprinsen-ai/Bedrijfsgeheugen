import {evaluatePlatformPromotion} from './platform-promotion-policy.mjs';

const REQUIRED=['contract','change_id','component_id','lane_id','component_type','candidate_identity','tested_identity'];
const SHA_RE=/^[a-f0-9]{40}$/i;

export function validateDeliveryManifest(m={}){
  const errors=[];
  for(const k of REQUIRED) if(!m[k]) errors.push(k);
  if(m.contract && m.contract!=='BRAIN-DELIVERY-v2') errors.push('contract_version');
  if(!Array.isArray(m.scopes)||m.scopes.length===0) errors.push('scopes');
  if(!Array.isArray(m.dependencies)) errors.push('dependencies');
  return {ok:errors.length===0,errors};
}

const clean=s=>String(s||'').replace(/^\.\//,'').replace(/\*\*$/,'').replace(/\*$/,'').replace(/\/$/,'');
export function scopesConflict(a=[],b=[]){
  for(const x0 of a) for(const y0 of b){
    const x=clean(x0),y=clean(y0);
    if(!x||!y) continue;
    if(x===y||x.startsWith(`${y}/`)||y.startsWith(`${x}/`)) return true;
  }
  return false;
}

const normalizedSha=value=>String(value||'').toLowerCase();

export function evaluateMergeEpoch(i={}){
  if(i?.required!==true) return {ok:true,decision:'MERGE_EPOCH_NOT_REQUIRED',reason:'integration_guard_not_required'};

  const candidateHead=normalizedSha(i.candidate_head);
  const testedHead=normalizedSha(i.tested_head);
  const gateMain=normalizedSha(i.gate_main_sha);
  const currentMain=normalizedSha(i.current_main_sha);
  const behindBy=Number(i.behind_by ?? 0);

  if(!SHA_RE.test(candidateHead)||!SHA_RE.test(testedHead)) {
    return {ok:false,decision:'RECOVERING',reason:'merge_epoch_candidate_identity_missing'};
  }
  if(candidateHead!==testedHead) {
    return {ok:false,decision:'RECOVERING',reason:'merge_epoch_exact_head_not_tested'};
  }
  if(!SHA_RE.test(gateMain)||!SHA_RE.test(currentMain)) {
    return {ok:false,decision:'RECOVERING',reason:'merge_epoch_main_identity_missing'};
  }
  if(i.merge_conflict===true||i.mergeable===false) {
    return {ok:false,decision:'RECOVERING',reason:'merge_conflict_reconcile_required'};
  }
  if(!Number.isFinite(behindBy)||behindBy<0) {
    return {ok:false,decision:'RECOVERING',reason:'merge_epoch_invalid_behind_count'};
  }
  if(gateMain!==currentMain) {
    return {ok:false,decision:'RECOVERING',reason:'main_epoch_moved_after_gate',action:'RECONCILE_AND_REPROVE'};
  }
  if(behindBy!==0) {
    return {ok:false,decision:'RECOVERING',reason:'candidate_behind_current_main',action:'RECONCILE_AND_REPROVE'};
  }

  const lease=i.landing_lease||{};
  if(lease.status!=='HELD') {
    return {ok:false,decision:'RECOVERING',reason:'landing_lease_not_held'};
  }
  if(normalizedSha(lease.main_sha)!==currentMain||normalizedSha(lease.candidate_head)!==candidateHead) {
    return {ok:false,decision:'RECOVERING',reason:'landing_lease_identity_stale',action:'REACQUIRE_ON_CURRENT_MAIN'};
  }

  return {
    ok:true,
    decision:'MERGE_EPOCH_GREEN',
    reason:'current_main_exact_head_and_landing_lease_verified',
    candidate_head:candidateHead,
    main_sha:currentMain,
  };
}

export function evaluateDeliveryLane(s={}){
  const valid=validateDeliveryManifest(s);
  if(!valid.ok) return {decision:'BLOCK_HARD_BOUNDARY',reason:`manifest_invalid:${valid.errors.join(',')}`};
  if(s.registered!==true) return {decision:'RECOVERING',reason:'component_not_registered'};
  if(s.brain_context_loaded!==true) return {decision:'RECOVERING',reason:'brain_context_missing'};
  if(s.learning_writeback_configured!==true) return {decision:'RECOVERING',reason:'learning_writeback_missing'};
  if(!s.rollback_identity) return {decision:'BLOCK_HARD_BOUNDARY',reason:'rollback_missing'};
  if(s.candidate_identity!==s.tested_identity) return {decision:'RECOVERING',reason:'candidate_identity_mismatch'};
  const gates=[['contract','contract'],['quality','quality'],['security','security'],['cost_performance','cost_performance'],['preview','preview']];
  for(const [k,n] of gates) if(s.gates?.[k]!==true) return {decision:'RECOVERING',reason:`${n}_gate_red`};

  const mergeEpoch=evaluateMergeEpoch(s.integration);
  if(!mergeEpoch.ok) return {decision:mergeEpoch.decision,reason:mergeEpoch.reason,action:mergeEpoch.action};

  if(s.platform){
    const platformPolicy=evaluatePlatformPromotion({platform:s.platform,registry:s.platform_registry,capacity:s.platform_capacity,executionProof:s.execution_proof});
    if(!platformPolicy.ok) return {decision:platformPolicy.decision,reason:platformPolicy.reason,platform:platformPolicy.platform};
  }
  const p=s.production||{};
  if(String(p.status).toUpperCase()==='RED') return {decision:'ROLLBACK',reason:'production_red',rollback_identity:s.rollback_identity};
  if(String(p.status).toUpperCase()==='GREEN'){
    if(!p.deployed_identity||p.deployed_identity!==s.candidate_identity) return {decision:'ROLLBACK',reason:'production_identity_mismatch',rollback_identity:s.rollback_identity};
    return {decision:'PRODUCTION_GREEN',reason:'exact_production_identity_verified',candidate_identity:s.candidate_identity};
  }
  return {decision:'PROMOTION_READY',reason:'lane_green',candidate_identity:s.candidate_identity,rollback_identity:s.rollback_identity};
}
