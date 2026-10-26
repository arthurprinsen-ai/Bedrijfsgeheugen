export default async (request,context)=>{
  if(request.method!=='GET')return Response.json({error:'METHOD_NOT_ALLOWED'},{status:405});
  const runtimeRegion=String(context?.server?.region||process.env.AWS_REGION||process.env.AWS_DEFAULT_REGION||'UNKNOWN').trim();
  return Response.json({
    contract:'data-sovereignty-runtime-observation-v4',
    provider:'netlify',
    runtimeRegion,
    runtimeRegionObservation:true,
    functionsRegionGuarantee:false,
    blobRegionGuarantee:false,
    euOnlyGuarantee:false,
    storageRegion:'PLATFORM_MANAGED_UNKNOWN',
    deployId:process.env.DEPLOY_ID||null,
    commitRef:process.env.COMMIT_REF||process.env.HEAD||null,
    verified:false,
    limitation:'De waargenomen Netlify runtime-regio is alleen een sample en geen residencygarantie. Deploymetadata heeft Functions in iad en Blobs in us-east-1 laten zien; deze laag blijft daarom niet-EU-bewezen totdat de provider/runtime aantoonbaar afdwingbare EU-residency levert.',
    observedAt:new Date().toISOString()
  },{headers:{'cache-control':'no-store'}});
};
export const config={path:'/api/data-sovereignty/runtime-proof'};
