import { composePortalProjectionLayers,PORTAL_LAYERS } from '../../platform/read-models/portal-projection-layers.mjs';

const required=(value,label)=>{if(!value)throw new Error(`EU portal store configuration missing: ${label}`);return value};

export function createSupabasePortalProjectionStore({
  fetchFn=globalThis.fetch,
  baseUrl=process.env.BG_PORTAL_EU_SUPABASE_URL,
  serviceToken=process.env.BG_PORTAL_EU_SERVICE_TOKEN
}={}){
  required(fetchFn,'fetch');required(baseUrl,'baseUrl');required(serviceToken,'serviceToken');
  const endpoint=`${String(baseUrl).replace(/\/$/,'')}/functions/v1/portal-state-eu`;
  const headers={'content-type':'application/json','x-bg-service-token':serviceToken};
  async function gateway(body){
    const response=await fetchFn(endpoint,{method:'POST',headers,body:JSON.stringify(body)});
    const data=await response.json().catch(()=>null);
    if(!response.ok)throw new Error(`EU portal store gateway failed (${response.status})`);
    return data||{};
  }
  async function getLayer(tenantId,layer){
    const data=await gateway({action:'get',tenantId:String(tenantId),layer});
    return data.payload||null;
  }
  async function getGovernance(tenantId){
    const data=await gateway({action:'governance',tenantId:String(tenantId)});
    return Array.isArray(data.governance)?data.governance:[];
  }
  async function putLayer(tenantId,layer,next){
    const payload={...next,origin:layer};
    const data=await gateway({action:'put',tenantId:String(tenantId),layer,payload});
    return {stored:Boolean(data.stored),stale:Boolean(data.stale),record:data.record||payload};
  }
  return Object.freeze({
    getLayer,getGovernance,
    async get(tenantId){
      const [legacy,canonical,aiGovernance]=await Promise.all([
        getLayer(tenantId,PORTAL_LAYERS.LEGACY),
        getLayer(tenantId,PORTAL_LAYERS.CANONICAL),
        getGovernance(tenantId)
      ]);
      if(!legacy&&!canonical)return null;
      const data={...composePortalProjectionLayers({legacy,canonical}),aiGovernance};
      const sourceUpdatedAt=data.sourceMeta?.updatedAt||canonical?.sourceUpdatedAt||legacy?.sourceUpdatedAt||'';
      return {schemaVersion:2,tenantId,origin:canonical?'composed':'legacy-migration',sourceUpdatedAt,updatedAt:sourceUpdatedAt,data};
    },
    put:(tenantId,next)=>putLayer(tenantId,PORTAL_LAYERS.LEGACY,next),
    putLegacy:(tenantId,next)=>putLayer(tenantId,PORTAL_LAYERS.LEGACY,next),
    putCanonical:(tenantId,next)=>putLayer(tenantId,PORTAL_LAYERS.CANONICAL,next)
  });
}
