const clean=value=>String(value??'').trim();
const requiredFields=['platform','key','status','owner','adapterType','productionIdentity','validation','activation','readBackEvidence','rollback','costClass','securityClass','brainContractVersion'];

export function validatePlatformRegistry(registry={},requiredPlatforms=[]){
  const platforms=Array.isArray(registry.platforms)?registry.platforms:[];
  const active=platforms.filter(item=>item?.status==='active');
  const byName=new Map(active.map(item=>[clean(item.platform).toLowerCase(),item]));
  const required=requiredPlatforms.map(value=>clean(value).toLowerCase()).filter(Boolean);
  for(const platform of required){
    if(!byName.has(platform))throw new Error(`missing required platform: ${platform}`);
  }
  for(const item of active){
    const missing=requiredFields.filter(field=>!clean(item?.[field]));
    if(missing.length)throw new Error(`incomplete platform ${clean(item.platform)||'unknown'}: ${missing.join(', ')}`);
    if(item.brainContractVersion!=='brain.v1')throw new Error(`incomplete platform ${item.platform}: brain.v1 required`);
  }
  const result=required.length?required:[...byName.keys()].sort();
  return Object.freeze({ok:true,platforms:Object.freeze(result)});
}
