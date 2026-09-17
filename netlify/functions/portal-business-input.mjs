import { getUser } from '@netlify/identity';
import { createPortalBusinessInputHandler } from '../../platform/api/portal-business-input-handler.mjs';
import { createPortalProjectionStore } from './_portal-read-model-store.mjs';
import { createSupabasePortalProjectionStore } from './_portal-supabase-store.mjs';
import { createEuPrimaryPortalStore } from './_portal-eu-primary-store.mjs';

const required=(value,label)=>{const text=String(value??'').trim();if(!text)throw new Error(`Portal business input configuration missing: ${label}`);return text};
function createBrainAuthorityClient({fetchFn=globalThis.fetch,baseUrl=process.env.BG_PORTAL_EU_SUPABASE_URL}={}){
  const endpoint=`${required(baseUrl,'BG_PORTAL_EU_SUPABASE_URL').replace(/\/$/,'')}/functions/v1/brain-operating-authority`;
  return Object.freeze({
    async append({record,idempotencyKey,sourceRevision,request}){
      const authorization=request?.headers?.get('authorization')||'';
      if(!/^Bearer\s+.+/i.test(authorization))throw new Error('Identity bearer token is required for canonical Brain authority');
      const response=await fetchFn(endpoint,{method:'POST',headers:{authorization,'content-type':'application/json','accept':'application/json'},body:JSON.stringify({record,idempotencyKey,sourceRevision})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(payload?.error||`Canonical Brain authority failed (${response.status})`);
      return payload;
    }
  });
}

const fallbackStore=createPortalProjectionStore();
const euStore=createSupabasePortalProjectionStore();
const store=createEuPrimaryPortalStore({euStore,fallbackStore});
const authority=createBrainAuthorityClient();
const handler=createPortalBusinessInputHandler({getUser,store,authority});

export default async request=>handler(request);
export const config={path:'/api/portal-business-input'};
