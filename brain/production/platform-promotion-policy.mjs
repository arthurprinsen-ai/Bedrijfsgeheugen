const clean=v=>String(v??'').trim().toLowerCase();

export function evaluatePlatformPromotion({platform,registry,capacity,executionProof}={}){
  const id=clean(platform);
  if(!id||!registry||!Array.isArray(registry.platforms)) return {ok:false,decision:'BLOCK_HARD_BOUNDARY',reason:'platform_registry_missing'};
  const adapter=registry.platforms.find(item=>clean(item?.platform)===id);
  if(!adapter) return {ok:false,decision:'BLOCK_HARD_BOUNDARY',reason:'unknown_platform_adapter'};
  if(adapter.direct_promotion!==true) return {ok:false,decision:'BLOCK_HARD_BOUNDARY',reason:'direct_promotion_disabled',platform:id};
  if(adapter.authority!=='BG169') return {ok:false,decision:'BLOCK_HARD_BOUNDARY',reason:'production_authority_must_be_BG169',platform:id};
  if(adapter.hard_boundary_policy!=='respect_global') return {ok:false,decision:'BLOCK_HARD_BOUNDARY',reason:'global_hard_boundary_policy_required',platform:id};
  if(adapter.capacity_gate==='required'&&capacity!=='available') return {ok:false,decision:'RECOVERING',reason:'platform_capacity_unavailable',platform:id};
  if(adapter.execution_proof==='required'&&executionProof!==true) return {ok:false,decision:'RECOVERING',reason:'execution_proof_missing',platform:id};
  return {ok:true,decision:'PLATFORM_PROMOTION_ALLOWED',platform:id,authority:'BG169'};
}
