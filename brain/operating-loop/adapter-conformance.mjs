const clean=v=>String(v??'').trim();
const exactRevision=value=>/^[a-f0-9]{40}$/i.test(clean(value));
const hasOwn=(obj,key)=>Object.prototype.hasOwnProperty.call(obj||{},key);

function telemetryComplete(e={}){
  return clean(e.health)!==''&&clean(e.freshness)!==''&&hasOwn(e,'error')&&clean(e.owner)!==''&&hasOwn(e,'cost')&&Number.isFinite(Number(e.cost))&&exactRevision(e.revision)&&clean(e.last_verified_at)!=='';
}
function executionComplete(e={}){
  const proof=e.execution_proof;
  return proof?.accepted===true&&proof?.executed===true&&clean(proof.authority)!==''&&exactRevision(proof.candidate_revision)&&clean(proof.verified_at)!=='';
}
function evaluate(platformConfig,evidence,required){
  const e=evidence||{};const missing=[];const blocked=[];
  const checks={
    compatibility_mapping:Boolean(clean(platformConfig?.compatibility_mapping))&&e.compatibility_mapping===true,
    regression_contract:Boolean(clean(platformConfig?.regression_contract))&&e.regression_contract===true,
    shared_memory:e.shared_memory===true,
    universal_event_ingest:e.universal_event_ingest===true,
    health_freshness_error_owner_cost_revision:telemetryComplete(e),
    capacity_available:clean(e.capacity)==='available',
    execution_proof:executionComplete(e),
    exact_revision_evidence:e.exact_revision_evidence===true&&exactRevision(e.revision),
    rollback_verified:e.rollback_verified===true,
    whole_brain_lineage_verified:e.whole_brain_lineage_verified===true
  };
  for(const key of required) if(checks[key]!==true) missing.push(key);
  if(clean(e.capacity)&&clean(e.capacity)!=='available') blocked.push('capacity_available');
  if(e.execution_proof&&(e.execution_proof.accepted===false||e.execution_proof.executed===false)) blocked.push('execution_proof');
  const productionReady=missing.length===0&&blocked.length===0;
  return Object.freeze({platform:clean(platformConfig?.platform),status:productionReady?'READY':blocked.length?'BLOCKED':'INCOMPLETE',productionReady,missing:Object.freeze(missing),blocked:Object.freeze([...new Set(blocked)]),revision:exactRevision(e.revision)?clean(e.revision):null,lastVerifiedAt:clean(e.last_verified_at)||null});
}

export function evaluateAdapterConformance(registry={},evidenceByPlatform={}){
  const required=Array.isArray(registry?.activation?.production_ready_requires)?registry.activation.production_ready_requires:[];
  const platforms=(Array.isArray(registry.platforms)?registry.platforms:[]).map(config=>evaluate(config,evidenceByPlatform?.[config.platform],required));
  return Object.freeze({contract:registry.conformance_contract||'ADAPTER-CONFORMANCE-v1',platforms:Object.freeze(platforms),summary:Object.freeze({total:platforms.length,ready:platforms.filter(x=>x.status==='READY').length,incomplete:platforms.filter(x=>x.status==='INCOMPLETE').length,blocked:platforms.filter(x=>x.status==='BLOCKED').length})});
}
