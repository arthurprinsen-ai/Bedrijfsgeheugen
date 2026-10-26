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
      const configured=safeUuid(user?.appMetadata?.tenantId||user?.app_metadata?.tenantId);
      if(configured)return configured;
      const email=cleanEmail(user?.email);
      if(!email)return null;
      const invites=await select(`uitnodigingen?email=ilike.${encodeURIComponent(email)}&gebruikt_op=not.is.null&select=organisatie_id,gebruikt_op&order=gebruikt_op.desc&limit=10`);
      const tenants=[...new Set(invites.map(row=>safeUuid(row?.organisatie_id)).filter(Boolean))];
      return tenants.length===1?tenants[0]:null;
    },
    async resolvePaidInvitation(user){
      const mail=cleanEmail(user?.email);if(!mail||!user?.confirmedAt)return null;
      const invites=await select(`uitnodigingen?email=eq.${encodeURIComponent(mail)}&select=organisatie_id&limit=100`);
      const tenants=[...new Set(invites.map(row=>safeUuid(row.organisatie_id)).filter(Boolean))];
      if(tenants.length!==1)return null;
      const subscriptions=await select(`saas_subscriptions?organisation_id=eq.${tenants[0]}&provider=eq.stripe&status=in.(active,trialing,past_due)&select=id&limit=1`);
      return subscriptions.length?tenants[0]:null;
    },
    async hasPersonalPortalState(userId){
      const rows=await select(`portal_state_layers?tenant_id=eq.${encodeURIComponent('user:'+userId)}&select=tenant_id&limit=1`);
      return rows.length>0;
    },
    async recordCheckoutOutcome(event){
      await mutate('powerhouse_runtime_events?on_conflict=dedupe_key',{body:event,prefer:'resolution=ignore-duplicates,return=representation'});
      const rows=await select(`powerhouse_runtime_events?dedupe_key=eq.${encodeURIComponent(event.dedupe_key)}&select=id&limit=1`);
      if(!rows[0]?.id)throw new Error('CHECKOUT_EVENT_NOT_STORED');return rows[0];
    },
    async getPlan(code){const key=String(code||'').trim().toLowerCase();if(!key)return null;const rows=await select(`saas_plans?code=eq.${encodeURIComponent(key)}&active=eq.true&select=*&limit=1`);return rows[0]||null;},
    async ensureCheckoutIntent(row){
      const id=safeUuid(row.id);if(!id)throw new Error('INVALID_CHECKOUT_ID');
      await mutate('saas_checkout_intents?on_conflict=id',{body:row,prefer:'resolution=ignore-duplicates,return=representation'});
      const rows=await select(`saas_checkout_intents?id=eq.${id}&select=*&limit=1`);return rows[0]||null;
    },
    async openCheckoutIntent(id,sessionId){
      const key=safeUuid(id);if(!key)throw new Error('INVALID_CHECKOUT_ID');
      const rows=await mutate(`saas_checkout_intents?id=eq.${key}&state=in.(created,checkout_open)`,{method:'PATCH',body:{provider_session_id:sessionId,state:'checkout_open',updated_at:new Date().toISOString()}});
      if(rows[0])return rows[0];
      const existing=await select(`saas_checkout_intents?id=eq.${key}&provider_session_id=eq.${encodeURIComponent(sessionId)}&select=*&limit=1`);return existing[0]||null;
    },
    async completeCheckoutIntent(row){
      if(row.id){
        const id=safeUuid(row.id);if(!id)throw new Error('INVALID_CHECKOUT_ID');
        const rows=await mutate(`saas_checkout_intents?id=eq.${id}&or=(provider_session_id.is.null,provider_session_id.eq.${encodeURIComponent(row.provider_session_id)})`,{method:'PATCH',body:row});
        if(!rows[0])throw new Error('CHECKOUT_INTENT_NOT_FOUND');return rows[0];
      }
      // A signed legacy checkout can predate intent persistence. Keep its real
      // provider receipt without inventing a second purchase or organisation.
      const rows=await mutate('saas_checkout_intents?on_conflict=provider_session_id',{body:row,prefer:'resolution=merge-duplicates,return=representation'});return rows[0]||null;
    },
    async ensureCheckoutOrganisation(name,slug){
      await mutate('organisaties?on_conflict=slug',{body:{naam:name,slug},prefer:'resolution=ignore-duplicates,return=representation'});
      const rows=await select(`organisaties?slug=eq.${encodeURIComponent(slug)}&select=id,slug&limit=1`);return rows[0]||null;
    },
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
