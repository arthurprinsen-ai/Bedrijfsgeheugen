import { composePortalProjectionLayers,PORTAL_LAYERS } from '../../platform/read-models/portal-projection-layers.mjs';

const required=(value,label)=>{if(!value)throw new Error(`EU portal store configuration missing: ${label}`);return value};

export function createSupabasePortalProjectionStore({
  fetchFn=globalThis.fetch,
  baseUrl=process.env.BG_PORTAL_EU_SUPABASE_URL,
  serviceToken=process.env.BG_PORTAL_EU_SERVICE_TOKEN,
  entrepreneurTimeoutMs=23000
}={}){
  required(fetchFn,'fetch');required(baseUrl,'baseUrl');required(serviceToken,'serviceToken');
  const endpoint=`${String(baseUrl).replace(/\/$/,'')}/functions/v1/portal-state-eu`;
  const headers={'content-type':'application/json','x-bg-service-token':serviceToken,'x-region':'eu-central-1'};
  if(!Number.isInteger(entrepreneurTimeoutMs)||entrepreneurTimeoutMs<20||entrepreneurTimeoutMs>25000)
    throw new RangeError('PORTAL_INTELLIGENCE_TIMEOUT_INVALID');
  async function gateway(body,{timeoutMs=0}={}){
    const controller=timeoutMs>0?new AbortController():null;
    let deadlineTimer;
    const run=async()=>{
      const response=await fetchFn(endpoint,{
        method:'POST',headers,body:JSON.stringify(body),
        ...(controller?{signal:controller.signal}:{})
      });
      const data=await response.json().catch(()=>null);
      if(!response.ok)throw new Error(`EU portal store gateway failed (${response.status})`);
      return data||{};
    };
    if(!controller)return run();
    // Abort the native fetch and enforce the response deadline even if the
    // transport's promise does not settle after receiving an abort signal.
    const deadline=new Promise((_,reject)=>{
      deadlineTimer=setTimeout(()=>{
        controller.abort();
        reject(new Error('PORTAL_INTELLIGENCE_UPSTREAM_TIMEOUT'));
      },timeoutMs);
    });
    try{return await Promise.race([run(),deadline])}
    catch(error){
      if(controller.signal.aborted)throw new Error('PORTAL_INTELLIGENCE_UPSTREAM_TIMEOUT');
      throw error;
    }finally{clearTimeout(deadlineTimer)}
  }
  async function getLayer(tenantId,layer){
    const data=await gateway({action:'get',tenantId:String(tenantId),layer});
    return data.payload||null;
  }
  async function getGovernance(tenantId){
    const data=await gateway({action:'governance',tenantId:String(tenantId)});
    return Array.isArray(data.governance)?data.governance:[];
  }
  async function getResourceBusinessValue(tenantId){
    const data=await gateway({action:'resource_business_value',tenantId:String(tenantId)});
    return data.resourceBusinessValue||null;
  }
  async function getEntrepreneurIntelligence(tenantId){
    const expectedTenant=String(tenantId);
    const data=await gateway({action:'entrepreneur_intelligence',tenantId:expectedTenant},{timeoutMs:entrepreneurTimeoutMs});
    if(!data?.scope||typeof data.scope.authenticatedTenant!=='string')throw new Error('EU portal intelligence response shape invalid');
    if(data.scope.authenticatedTenant!==expectedTenant)throw new Error('EU portal intelligence tenant scope mismatch');
    return data;
  }
  async function getValidatedFinancialForecasts(tenantId){
    const expectedTenant=String(tenantId);
    if(!expectedTenant.trim())throw new Error('EU financial forecast tenant required');
    const data=await gateway({action:'financial_forecasts',tenantId:expectedTenant});
    if(data?.tenantId!==expectedTenant||!Array.isArray(data?.forecasts)||
       data.forecasts.some(row=>row?.tenantId!==expectedTenant))
      throw new Error('EU financial forecast tenant scope mismatch');
    return {forecasts:data.forecasts};
  }
  async function putLayer(tenantId,layer,next){
    const payload={...next,origin:layer};
    const data=await gateway({action:'put',tenantId:String(tenantId),layer,payload});
    return {stored:Boolean(data.stored),stale:Boolean(data.stale),record:data.record||payload};
  }
  return Object.freeze({
    getLayer,getGovernance,getResourceBusinessValue,getEntrepreneurIntelligence,getValidatedFinancialForecasts,
    async get(tenantId){
      const [legacy,canonical,aiGovernance,resourceBusinessValue]=await Promise.all([
        getLayer(tenantId,PORTAL_LAYERS.LEGACY),
        getLayer(tenantId,PORTAL_LAYERS.CANONICAL),
        getGovernance(tenantId),
        getResourceBusinessValue(tenantId)
      ]);
      if(!legacy&&!canonical)return null;
      const data={...composePortalProjectionLayers({legacy,canonical}),aiGovernance,resourceBusinessValue};
      const sourceUpdatedAt=data.sourceMeta?.updatedAt||canonical?.sourceUpdatedAt||legacy?.sourceUpdatedAt||resourceBusinessValue?.latest_observed_at||'';
      return {schemaVersion:2,tenantId,origin:canonical?'composed':'legacy-migration',sourceUpdatedAt,updatedAt:sourceUpdatedAt,data};
    },
    put:(tenantId,next)=>putLayer(tenantId,PORTAL_LAYERS.LEGACY,next),
    putLegacy:(tenantId,next)=>putLayer(tenantId,PORTAL_LAYERS.LEGACY,next),
    putCanonical:(tenantId,next)=>putLayer(tenantId,PORTAL_LAYERS.CANONICAL,next)
  });
}
