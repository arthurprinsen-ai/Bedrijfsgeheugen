import {readLegacyPortalStateForUser} from './legacy-state-migration.js';

const DEFAULT_ENDPOINT='/api/portal-business-input';

function identityBearer(identity=globalThis.netlifyIdentity){
  const token=identity?.currentUser?.()?.token?.access_token;
  return token?`Bearer ${token}`:'';
}

export async function savePortalBusinessInput(input,{fetchFn=globalThis.fetch,endpoint=DEFAULT_ENDPOINT,authorization=identityBearer()}={}){
  if(typeof fetchFn!=='function')throw new TypeError('fetch is required');
  const headers={'content-type':'application/json','accept':'application/json'};
  if(authorization)headers.authorization=authorization;
  const response=await fetchFn(endpoint,{method:'POST',credentials:'same-origin',headers,body:JSON.stringify(input)});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(payload?.message||payload?.error||`Portal input save failed (${response.status})`);
  // HTTP success alone is not proof of a persisted canonical/Brain input.
  const acknowledged=payload?.stored===true
    && payload?.stale!==true
    && payload?.authorityStored===true
    && payload?.powerhouseFeedStored===true
    && payload?.organismImpactStored===true
    && [payload?.sourceRevision,payload?.brainRecordId,payload?.currentStateRecordId,payload?.organismImpactRecordId]
      .every(value=>typeof value==='string'&&value.length>0);
  if(!acknowledged)throw new Error(payload?.error||'PORTAL_BUSINESS_INPUT_ACK_INCOMPLETE');
  return payload;
}

// The caller must supply the current authenticated identity. Never scan the
// browser cache: shared devices can retain other customers' bg_portaal_* keys.
// The existing legacy-state reader is the sole exact-key source authority.
export function readLegacyPortalBusinessInputs(storage=globalThis.localStorage,user=null){
  const email=String(user?.email||'').trim().toLowerCase();
  if(!email)return [];
  const answers=readLegacyPortalStateForUser(storage,user);
  if(!answers||typeof answers!=='object'||Array.isArray(answers))return [];
  const key=`bg_portaal_${email}`;
  return [{inputType:'LegacyPortalState',modelId:key,instanceId:'primary',schemaVersion:1,answers,sourcePortal:'legacy-klantportaal',metadata:{legacyStorageKey:key}}];
}

export async function migrateLegacyPortalBusinessInputs({storage=globalThis.localStorage,fetchFn=globalThis.fetch,endpoint=DEFAULT_ENDPOINT,identity=globalThis.netlifyIdentity,user=identity?.currentUser?.(),authorization=identityBearer(identity)}={}){
  // This is an authenticated write: no tenant identity or bearer means no
  // side effects, even if another customer has left a legacy record behind.
  if(!authorization||!String(user?.email||'').trim())throw new Error('PORTAL_LEGACY_MIGRATION_AUTH_REQUIRED');
  const inputs=readLegacyPortalBusinessInputs(storage,user);
  const results=[];
  for(const input of inputs){
    try{results.push({modelId:input.modelId,ok:true,result:await savePortalBusinessInput(input,{fetchFn,endpoint,authorization})});}
    catch(error){results.push({modelId:input.modelId,ok:false,error:error instanceof Error?error.message:String(error)});}
  }
  return results;
}
