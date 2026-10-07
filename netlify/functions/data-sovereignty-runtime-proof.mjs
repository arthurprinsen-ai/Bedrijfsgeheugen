const runtimeRegion=()=>String(
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  globalThis.Netlify?.context?.region ||
  'UNKNOWN'
).trim();

export default async request=>{
  if(request.method!=='GET')return Response.json({error:'METHOD_NOT_ALLOWED'},{status:405});
  const region=runtimeRegion();
  const verified=['eu-central-1','fra'].includes(region.toLowerCase());
  return Response.json({
    contract:'data-sovereignty-runtime-proof-v1',
    provider:'netlify',
    functionRegionConfigured:'fra',
    runtimeRegion:region,
    configuredStorageRegion:'eu-central-1',
    deployId:process.env.DEPLOY_ID||null,
    commitRef:process.env.COMMIT_REF||process.env.HEAD||null,
    verified,
    observedAt:new Date().toISOString()
  },{headers:{'cache-control':'no-store'}});
};

export const config={path:'/api/data-sovereignty/runtime-proof',region:'fra'};
