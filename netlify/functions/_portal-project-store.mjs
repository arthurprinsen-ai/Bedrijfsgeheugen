const required=(value,label)=>{if(!value)throw new Error(`Portal project store configuration missing: ${label}`);return value};
const safeUuid=value=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||''))?String(value):'';
const cleanEmail=value=>String(value||'').trim().toLowerCase();

export function createPortalProjectStore({
  fetchFn=globalThis.fetch,
  baseUrl=process.env.SUPABASE_URL||process.env.BG_PORTAL_EU_SUPABASE_URL,
  serviceToken=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.BG_PORTAL_EU_SERVICE_TOKEN
}={}){
  required(fetchFn,'fetch');required(baseUrl,'baseUrl');required(serviceToken,'serviceToken');
  const root=String(baseUrl).replace(/\/$/,'').replace(/\/functions\/v1$/,'');
  const headers={apikey:serviceToken,authorization:`Bearer ${serviceToken}`,'content-type':'application/json'};
  async function select(path){
    const response=await fetchFn(`${root}/rest/v1/${path}`,{headers});
    if(!response.ok)throw new Error(`Portal project store read failed (${response.status})`);
    const data=await response.json().catch(()=>[]);
    return Array.isArray(data)?data:[];
  }
  return Object.freeze({
    async resolveTenant(user){
      const email=cleanEmail(user?.email);
      if(!email)return null;
      const invites=await select(`uitnodigingen?email=ilike.${encodeURIComponent(email)}&gebruikt_op=not.is.null&select=organisatie_id,gebruikt_op&order=gebruikt_op.desc&limit=10`);
      const tenants=[...new Set(invites.map(row=>safeUuid(row?.organisatie_id)).filter(Boolean))];
      return tenants.length===1?tenants[0]:null;
    },
    async get(tenantId){
      const organizationId=safeUuid(tenantId);
      if(!organizationId)return null;
      const customers=await select(`klanten?organisatie_id=eq.${encodeURIComponent(organizationId)}&select=id,naam,organisatie_id&order=bijgewerkt_op.desc&limit=1`);
      const customer=customers[0];
      if(!customer?.id)return null;
      const quotes=await select(`offertes?organisatie_id=eq.${encodeURIComponent(organizationId)}&klant_id=eq.${encodeURIComponent(customer.id)}&select=id,nummer,titel,status,bedrag,geldig_tot,inhoud,aangemaakt_op,bijgewerkt_op&order=bijgewerkt_op.desc&limit=1`);
      const quote=quotes[0];
      if(!quote)return null;
      return {customer:{id:customer.id,name:customer.naam||''},quote,runtime:null};
    }
  });
}
