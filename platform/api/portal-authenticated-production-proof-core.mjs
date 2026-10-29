const CONTRACT='PORTAL_AUTHENTICATED_PRODUCTION_PROOF_V1';
export const PORTAL_AUTH_PROOF_STORE='portal-authenticated-production-proof-v1';

const clean=value=>String(value||'').trim();
const fail=code=>Object.assign(new Error(code),{code});
const safeCode=error=>{
  const code=clean(error?.code||error?.message).toUpperCase().replace(/[^A-Z0-9_:-]/g,'_');
  return code&&code.length<=96?code:'UNEXPECTED_PROOF_FAILURE';
};

export const portalAuthProofKey=commitRef=>{
  const sha=clean(commitRef).toLowerCase();
  if(!/^[0-9a-f]{40}$/.test(sha))throw fail('INVALID_COMMIT_REF');
  return `commits/${sha}.json`;
};

export function decodeJwtPayload(token){
  const raw=clean(token);
  const parts=raw.split('.');
  if(parts.length<2)throw fail('IDENTITY_ACCESS_TOKEN_INVALID');
  try{
    const json=Buffer.from(parts[1],'base64url').toString('utf8');
    const payload=JSON.parse(json);
    if(!payload?.sub)throw fail('IDENTITY_ACCESS_TOKEN_SUBJECT_MISSING');
    return payload;
  }catch(error){
    if(error?.code)throw error;
    throw fail('IDENTITY_ACCESS_TOKEN_INVALID');
  }
}

export async function runPortalAuthenticatedProductionProof({
  deploy,
  identityAdmin,
  getIdentityConfigFn,
  fetchImpl=fetch,
  now=()=>new Date().toISOString(),
  randomPassword,
}={}){
  const commitRef=clean(deploy?.commitRef).toLowerCase();
  const deployId=clean(deploy?.id);
  const immutableUrl=clean(deploy?.permalinkUrl||deploy?.sslUrl||deploy?.url).replace(/\/$/,'');
  const base={
    contract:CONTRACT,
    status:'FAILED',
    commit_ref:commitRef||null,
    deploy_id:deployId||null,
    checked_at:now(),
    http_status:null,
    identity_transport:'netlify-identity-jwt',
    tenant_scope_verified:false,
    cross_tenant_scope_verified:false,
    tenant_count_verified:0,
    payload_shape_verified:false,
    synthetic_user_cleanup:'NOT_CREATED',
    failure_code:null,
  };
  if(!/^[0-9a-f]{40}$/.test(commitRef))return {...base,failure_code:'INVALID_COMMIT_REF'};
  if(!deployId)return {...base,failure_code:'DEPLOY_ID_MISSING'};
  if(!immutableUrl.startsWith('https://'))return {...base,failure_code:'IMMUTABLE_DEPLOY_URL_MISSING'};
  if(!identityAdmin?.createUser||!identityAdmin?.getUser||!identityAdmin?.updateUser||!identityAdmin?.deleteUser)return {...base,failure_code:'IDENTITY_ADMIN_UNAVAILABLE'};
  if(typeof getIdentityConfigFn!=='function')return {...base,failure_code:'IDENTITY_CONFIG_UNAVAILABLE'};

  const createdUsers=[];
  const observations=[];
  let httpStatus=null;
  let cleanup='NOT_CREATED';
  let failureCode=null;
  let crossTenantScopeVerified=false;

  try{
    const identity=getIdentityConfigFn();
    const identityUrl=clean(identity?.url).replace(/\/$/,'');
    if(!identityUrl.startsWith('https://'))throw fail('IDENTITY_CONFIG_MISSING');

    // Distinct real authenticated requests, never a shared session or a mocked
    // tenant header. Synthetic accounts are removed even when one probe fails.
    for(const slot of ['a','b']){
      const password=clean(randomPassword?.());
      if(password.length<24)throw fail('SYNTHETIC_PASSWORD_UNAVAILABLE');
      const tenantId=`proof:${deployId}:${slot}`;
      const email=`bg-portal-proof-${slot}-${deployId}@proof.invalid`;
      const user=await identityAdmin.createUser({
        email,password,
        data:{
          app_metadata:{tenantId},
          user_metadata:{full_name:'Bedrijfsgeheugen production proof'},
        },
      });
      if(!user?.id)throw fail('SYNTHETIC_USER_CREATE_FAILED');
      createdUsers.push(user.id);

      // Netlify Identity may omit custom app_metadata at initial user creation.
      // Read back the admin-owned tenant claim and, only for this new synthetic
      // user, repair it through the official admin API before token exchange.
      // Do not change the signed-JWT gate or accept user-controlled metadata.
      const storedUser=await identityAdmin.getUser(user.id);
      const storedMetadata=storedUser?.appMetadata||storedUser?.app_metadata||{};
      if(clean(storedMetadata.tenantId)!==tenantId){
        await identityAdmin.updateUser(user.id,{
          app_metadata:{...storedMetadata,tenantId},
        });
        const updatedUser=await identityAdmin.getUser(user.id);
        const updatedMetadata=updatedUser?.appMetadata||updatedUser?.app_metadata||{};
        if(clean(updatedMetadata.tenantId)!==tenantId){
          throw fail('IDENTITY_ADMIN_TENANT_METADATA_NOT_PERSISTED');
        }
      }

      const tokenResponse=await fetchImpl(`${identityUrl}/token`,{
        method:'POST',
        headers:{'content-type':'application/x-www-form-urlencoded','cache-control':'no-store'},
        body:new URLSearchParams({grant_type:'password',username:email,password}).toString(),
      });
      if(!tokenResponse?.ok)throw fail(`IDENTITY_TOKEN_EXCHANGE_HTTP_${Number(tokenResponse?.status)||0}`);
      const tokenBody=await tokenResponse.json();
      const accessToken=clean(tokenBody?.access_token);
      if(!accessToken)throw fail('IDENTITY_ACCESS_TOKEN_MISSING');
      const claims=decodeJwtPayload(accessToken);
      if(clean(claims?.sub)!==clean(user.id))throw fail('IDENTITY_SUBJECT_MISMATCH');
      if(clean(claims?.app_metadata?.tenantId)!==tenantId)throw fail('IDENTITY_TENANT_CLAIM_MISMATCH');

      const apiResponse=await fetchImpl(`${immutableUrl}/api/portal-ondernemersdata`,{
        method:'GET',
        headers:{
          accept:'application/json',
          authorization:`Bearer ${accessToken}`,
          'cache-control':'no-cache',
        },
      });
      httpStatus=Number(apiResponse?.status)||0;
      if(!apiResponse?.ok)throw fail(`AUTHENTICATED_PORTAL_API_HTTP_${httpStatus}`);
      const body=await apiResponse.json();
      if(clean(body?.scope?.authenticatedTenant)!==tenantId)throw fail('AUTHENTICATED_TENANT_SCOPE_MISMATCH');
      const validShape=
        Array.isArray(body?.sources)&&
        Array.isArray(body?.publications)&&
        Array.isArray(body?.signals)&&
        typeof body?.intelligence==='object'&&body.intelligence!==null&&
        typeof body?.stats==='object'&&body.stats!==null&&
        Boolean(clean(body?.stats?.generatedAt));
      if(!validShape)throw fail('AUTHENTICATED_PORTAL_PAYLOAD_INVALID');
      const otherSlot=slot==='a'?'b':'a';
      if(JSON.stringify(body).includes(`proof:${deployId}:${otherSlot}`)){
        throw fail('CROSS_TENANT_PAYLOAD_LEAK');
      }
      observations.push({tenantId,httpStatus,validShape});
    }
    crossTenantScopeVerified=
      observations.length===2&&
      observations[0].tenantId!==observations[1].tenantId&&
      observations.every(o=>o.httpStatus===200&&o.validShape);
  }catch(error){
    failureCode=safeCode(error);
  }finally{
    if(createdUsers.length){
      cleanup='DELETED';
      // Never retain credentials or tenant payloads in proof artifacts/logs.
      for(const id of [...createdUsers].reverse()){
        try{await identityAdmin.deleteUser(id);}
        catch{
          cleanup='FAILED';
          failureCode='SYNTHETIC_USER_CLEANUP_FAILED';
        }
      }
    }
  }

  const tenantScopeVerified=crossTenantScopeVerified;
  const payloadShapeVerified=crossTenantScopeVerified;
  return {
    ...base,
    status:!failureCode&&tenantScopeVerified&&payloadShapeVerified&&cleanup==='DELETED'?'PROVEN':'FAILED',
    http_status:httpStatus,
    tenant_scope_verified:tenantScopeVerified,
    cross_tenant_scope_verified:crossTenantScopeVerified,
    tenant_count_verified:observations.length,
    payload_shape_verified:payloadShapeVerified,
    synthetic_user_cleanup:cleanup,
    failure_code:failureCode,
  };
}

export const PORTAL_AUTH_PROOF_CONTRACT=CONTRACT;
