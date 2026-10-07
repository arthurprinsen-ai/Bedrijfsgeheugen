export default async (request,context)=>{
  if(request.method!=='GET')return Response.json({error:'METHOD_NOT_ALLOWED'},{status:405});
  const region=String(context?.server?.region||'UNKNOWN').trim();
  const computeRegionVerified=['fra','eu-central-1'].includes(region.toLowerCase());
  return Response.json({
    contract:'data-sovereignty-runtime-observation-v3',
    provider:'netlify',
    functionRegionTarget:'fra',
    runtimeRegion:region,
    computeRegionVerified,
    blobRegionTarget:'eu-central-1',
    legacyStorageState:'UNVERIFIED_MIGRATION_REQUIRED',
    verified:false,
    limitation:'Compute wordt runtime gemeten. Nieuwe site-wide Blob reads/writes zijn op eu-central-1 geconfigureerd, maar bestaande legacy blobs zijn pas EU-only na expliciete migratie- en purge-readback.',
    observedAt:new Date().toISOString()
  },{headers:{'cache-control':'no-store'}});
};

export const config={path:'/api/data-sovereignty/runtime-proof'};
