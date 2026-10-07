const runtimeRegion=()=>String(
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  globalThis.Netlify?.context?.region ||
  'UNKNOWN'
).trim();

export default async request=>{
  if(request.method!=='GET')return Response.json({error:'METHOD_NOT_ALLOWED'},{status:405});
  const region=runtimeRegion();
  return Response.json({
    contract:'data-sovereignty-runtime-observation-v2',
    provider:'netlify',
    runtimeRegion:region,
    runtimeRegionObservation:true,
    euOnlyGuarantee:false,
    storageRegion:'PLATFORM_MANAGED_UNKNOWN',
    deployId:process.env.DEPLOY_ID||null,
    commitRef:process.env.COMMIT_REF||process.env.HEAD||null,
    verified:false,
    limitation:'Een runtime-regio-observatie is geen data-residencygarantie. Deze Netlify Function heeft geen ondersteunde per-function regiopin in de gebruikte runtimeconfiguratie.',
    observedAt:new Date().toISOString()
  },{headers:{'cache-control':'no-store'}});
};

export const config={path:'/api/data-sovereignty/runtime-proof'};
