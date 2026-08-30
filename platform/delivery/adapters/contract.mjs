const clean=value=>String(value??'').trim();

export function createDeliveryAdapter({platform,productionIdentity,requiredEvidence=[],rollbackKind='restore-last-known-good'}={}){
  const id=clean(platform).toLowerCase();
  if(!id)throw new TypeError('platform is required');
  if(!clean(productionIdentity))throw new TypeError('productionIdentity is required');
  const evidenceKeys=Object.freeze([...new Set(requiredEvidence.map(clean).filter(Boolean))]);
  const validateCandidate=input=>{
    if(clean(input?.platform).toLowerCase()!==id)throw new Error(`platform mismatch for ${id}`);
    const evidence=input?.evidence&&typeof input.evidence==='object'?input.evidence:{};
    const missing=evidenceKeys.filter(key=>evidence[key]===undefined||evidence[key]===null||evidence[key]==='');
    if(missing.length)throw new Error(`missing evidence for ${id}: ${missing.join(', ')}`);
    return Object.freeze({ok:true,platform:id,productionIdentity,evidence:Object.freeze({...evidence})});
  };
  return Object.freeze({
    platform:id,
    productionIdentity,
    requiredEvidence:evidenceKeys,
    classifyChange(input={}){return Object.freeze({platform:id,changeId:clean(input.changeId),candidateVersion:clean(input.candidateVersion),contractKeys:Object.freeze([...(input.contractKeys||[])])});},
    validateCandidate,
    async activate(input={}){
      if(typeof input.execute==='function')return input.execute(input);
      return Object.freeze({state:'ACTIVATION_READY',platform:id,executed:false,changeId:clean(input.changeId),candidateVersion:clean(input.candidateVersion)});
    },
    async readBack(input={}){
      if(typeof input.read==='function')return input.read(input);
      return Object.freeze({state:'READBACK_REQUIRED',platform:id,productionIdentity,requiredEvidence:evidenceKeys});
    },
    async rollback(input={}){
      if(typeof input.executeRollback==='function')return input.executeRollback(input);
      return Object.freeze({state:'ROLLBACK_READY',platform:id,executed:false,rollbackKind});
    }
  });
}
