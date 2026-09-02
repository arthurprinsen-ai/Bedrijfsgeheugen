import { composePortalProjectionLayers,PORTAL_LAYERS } from '../../platform/read-models/portal-projection-layers.mjs';

const required=(value,label)=>{if(!value)throw new Error(`EU portal store configuration missing: ${label}`);return value};
const rowPayload=body=>Array.isArray(body)&&body[0]?body[0]:null;

export function createSupabasePortalProjectionStore({
  fetchFn=globalThis.fetch,
  baseUrl=process.env.BG_PORTAL_EU_SUPABASE_URL,
  anonKey=process.env.BG_PORTAL_EU_SUPABASE_ANON_KEY,
  serviceToken=process.env.BG_PORTAL_EU_SERVICE_TOKEN
}={}){
  required(fetchFn,'fetch');required(baseUrl,'baseUrl');required(anonKey,'anonKey');required(serviceToken,'serviceToken');
  const endpoint=name=>`${String(baseUrl).replace(/\/$/,'')}/rest/v1/rpc/${name}`;
  const headers={
    'content-type':'application/json',
    apikey:anonKey,
    authorization:`Bearer ${anonKey}`
  };
  async function rpc(name,body){
    const response=await fetchFn(endpoint(name),{method:'POST',headers,body:JSON.stringify(body)});
    const data=await response.json().catch(()=>null);
    if(!response.ok)throw new Error(`EU portal store RPC ${name} failed (${response.status})`);
    return data;
  }
  async function getLayer(tenantId,layer){
    const data=await rpc('bg_portal_state_get',{p_service_token:serviceToken,p_tenant_id:String(tenantId),p_layer:layer});
    return rowPayload(data)?.payload||null;
  }
  async function putLayer(tenantId,layer,next){
    const payload={...next,origin:layer};
    const data=await rpc('bg_portal_state_put',{p_service_token:serviceToken,p_tenant_id:String(tenantId),p_layer:layer,p_payload:payload});
    const row=rowPayload(data);
    if(!row)throw new Error('EU portal store RPC returned no write result');
    return {stored:Boolean(row.stored),stale:Boolean(row.stale),record:row.record||payload};
  }
  return Object.freeze({
    getLayer,
    async get(tenantId){
      const [legacy,canonical]=await Promise.all([getLayer(tenantId,PORTAL_LAYERS.LEGACY),getLayer(tenantId,PORTAL_LAYERS.CANONICAL)]);
      if(!legacy&&!canonical)return null;
      const data=composePortalProjectionLayers({legacy,canonical});
      const sourceUpdatedAt=data.sourceMeta?.updatedAt||canonical?.sourceUpdatedAt||legacy?.sourceUpdatedAt||'';
      return {schemaVersion:2,tenantId,origin:canonical?'composed':'legacy-migration',sourceUpdatedAt,updatedAt:sourceUpdatedAt,data};
    },
    put:(tenantId,next)=>putLayer(tenantId,PORTAL_LAYERS.LEGACY,next),
    putLegacy:(tenantId,next)=>putLayer(tenantId,PORTAL_LAYERS.LEGACY,next),
    putCanonical:(tenantId,next)=>putLayer(tenantId,PORTAL_LAYERS.CANONICAL,next)
  });
}
