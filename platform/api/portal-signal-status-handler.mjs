import {resolveIdentityTenant} from '../read-models/portal-server-state.mjs';

const respond=(body,status=200)=>Response.json(body,{status,headers:{
  'cache-control':'private, no-store','vary':'authorization, cookie',
  'x-content-type-options':'nosniff'
}});
export function createPortalSignalStatusHandler({getUser,storeFactory,resolveTenant=resolveIdentityTenant}={}){
  if(typeof getUser!=='function'||typeof storeFactory!=='function')throw new TypeError('PORTAL_MONITORING_HANDLER_DEPENDENCIES_REQUIRED');
  return async function handle(request){
    if(request.method!=='GET')return respond({error:'METHOD_NOT_ALLOWED'},405);
    let user;try{user=await getUser()}catch{return respond({error:'UNAUTHORIZED'},401)}
    if(!user?.id)return respond({error:'UNAUTHORIZED'},401);
    const tenantId=resolveTenant(user);
    if(!tenantId)return respond({error:'FORBIDDEN'},403);
    try{
      const store=storeFactory();
      if(typeof store?.getSignalObservations!=='function')throw Error('MONITORING_STORE_UNAVAILABLE');
      // Server-side principal-derived identity is the only tenant authority.
      // Ignore request URL params, JSON body or user_metadata values.
      const data=await store.getSignalObservations(tenantId);
      if(data?.tenantId!==tenantId||data.contract!=='portal-signal-tenant-readback-v1'
        ||!Array.isArray(data.events)||data.events.length>50)
        throw Error('PORTAL_MONITORING_TENANT_OR_CONTRACT_MISMATCH');
      return respond({
        contract:data.contract,
        checkedAt:data.checkedAt||null,
        lastOriginalHeartbeatAt:data.lastOriginalHeartbeatAt||null,
        lastTenantScanAt:data.lastTenantScanAt||null,
        lastTenantTriggerAt:data.lastTenantTriggerAt||null,
        events:data.events,
        eventsTruncated:data.eventsTruncated===true,
        alertsDelivered:0,
        autonomousActionsVerified:0,
        measurementFreshnessVerified:false,
        explanation:'Originele waarnemingen zijn nog geen bezorgde meldingen of uitgevoerde acties.'
      });
    }catch{
      return respond({error:'PORTAL_MONITORING_EVIDENCE_UNAVAILABLE'},503);
    }
  };
}
