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
  async function mutate(path,{method='POST',body,prefer='return=representation'}={}){
    const response=await fetchFn(`${root}/rest/v1/${path}`,{method,headers:{...headers,prefer},body:JSON.stringify(body||{})});
    if(!response.ok)throw new Error(`Portal project store write failed (${response.status})`);
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
    async getPlan(code){const key=String(code||'').trim().toLowerCase();if(!key)return null;const rows=await select(`saas_plans?code=eq.${encodeURIComponent(key)}&active=eq.true&select=*&limit=1`);return rows[0]||null;},
    async findSubscription(providerSubscriptionId){const id=String(providerSubscriptionId||'').trim();if(!id)return null;const rows=await select(`saas_subscriptions?provider_subscription_id=eq.${encodeURIComponent(id)}&select=*&limit=1`);return rows[0]||null;},
    async createOrganisation(name,slug){const rows=await mutate('organisaties',{body:{naam:String(name||'').trim(),slug:String(slug||'').trim()}});return rows[0]||null;},
    async ensureCustomer(organisationId,name,email){const org=safeUuid(organisationId),mail=cleanEmail(email);if(!org||!mail)throw new Error('INVALID_CUSTOMER');const found=await select(`klanten?organisatie_id=eq.${org}&email=ilike.${encodeURIComponent(mail)}&select=*&limit=1`);if(found[0])return found[0];const rows=await mutate('klanten',{body:{organisatie_id:org,naam:String(name||'').trim(),email:mail}});return rows[0]||null;},
    async ensureInvitation(organisationId,email){const org=safeUuid(organisationId),mail=cleanEmail(email);if(!org||!mail)throw new Error('INVALID_INVITATION');const rows=await mutate('uitnodigingen?on_conflict=email,organisatie_id',{body:{organisatie_id:org,email:mail,rol:'eigenaar'},prefer:'resolution=merge-duplicates,return=representation'});return rows[0]||null;},
    async upsertSubscription(row){const rows=await mutate('saas_subscriptions?on_conflict=provider_subscription_id',{body:row,prefer:'resolution=merge-duplicates,return=representation'});return rows[0]||null;},
    async patchSubscription(providerSubscriptionId,patch){const id=String(providerSubscriptionId||'').trim();if(!id)return null;const rows=await mutate(`saas_subscriptions?provider_subscription_id=eq.${encodeURIComponent(id)}`,{method:'PATCH',body:{...patch,updated_at:new Date().toISOString()}});return rows[0]||null;},
    async getEntitlements(tenantId){const org=safeUuid(tenantId);if(!org)return null;const rows=await select(`saas_active_entitlements?organisation_id=eq.${org}&select=*&limit=1`);return rows[0]||null;},
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
