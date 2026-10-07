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
    payload_shape_verified:false,
    synthetic_user_cleanup:'NOT_CREATED',
    failure_code:null,
  };
  if(!/^[0-9a-f]{40}$/.test(commitRef))return {...base,failure_code:'INVALID_COMMIT_REF'};
  if(!deployId)return {...base,failure_code:'DEPLOY_ID_MISSING'};
  if(!immutableUrl.startsWith('https://'))return {...base,failure_code:'IMMUTABLE_DEPLOY_URL_MISSING'};
  if(!identityAdmin?.createUser||!identityAdmin?.deleteUser)return {...base,failure_code:'IDENTITY_ADMIN_UNAVAILABLE'};
  if(typeof getIdentityConfigFn!=='function')return {...base,failure_code:'IDENTITY_CONFIG_UNAVAILABLE'};

  const password=clean(randomPassword?.());
  if(password.length<24)return {...base,failure_code:'SYNTHETIC_PASSWORD_UNAVAILABLE'};

  const email=`bg-portal-proof-${deployId}@proof.invalid`;
  const requestedTenant=`proof:${deployId}`;
  let user=null;
  let httpStatus=null;
  let tenantScopeVerified=false;
  let payloadShapeVerified=false;
  let cleanup='NOT_CREATED';
  let failureCode=null;

  try{
    const identity=getIdentityConfigFn();
    const identityUrl=clean(identity?.url).replace(/\/$/,'');
    if(!identityUrl.startsWith('https://'))throw fail('IDENTITY_CONFIG_MISSING');

    user=await identityAdmin.createUser({
      email,
      password,
      data:{
        app_metadata:{tenantId:requestedTenant},
        user_metadata:{full_name:'Bedrijfsgeheugen production proof'},
      },
    });
    if(!user?.id)throw fail('SYNTHETIC_USER_CREATE_FAILED');

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
    const expectedTenant=clean(claims?.app_metadata?.tenantId)||`user:${clean(claims?.sub)}`;
    if(!expectedTenant)throw fail('IDENTITY_TENANT_CLAIM_MISSING');

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
    tenantScopeVerified=clean(body?.scope?.authenticatedTenant)===expectedTenant;
    if(!tenantScopeVerified)throw fail('AUTHENTICATED_TENANT_SCOPE_MISMATCH');

    payloadShapeVerified=
      Array.isArray(body?.sources)&&
      Array.isArray(body?.publications)&&
      Array.isArray(body?.signals)&&
      typeof body?.intelligence==='object'&&body.intelligence!==null&&
      typeof body?.stats==='object'&&body.stats!==null&&
      Boolean(clean(body?.stats?.generatedAt));
    if(!payloadShapeVerified)throw fail('AUTHENTICATED_PORTAL_PAYLOAD_INVALID');
  }catch(error){
    failureCode=safeCode(error);
  }finally{
    if(user?.id){
      try{
        await identityAdmin.deleteUser(user.id);
        cleanup='DELETED';
      }catch{
        cleanup='FAILED';
        failureCode='SYNTHETIC_USER_CLEANUP_FAILED';
      }
    }
  }

  return {
    ...base,
    status:!failureCode&&httpStatus===200&&tenantScopeVerified&&payloadShapeVerified&&cleanup==='DELETED'?'PROVEN':'FAILED',
    http_status:httpStatus,
    tenant_scope_verified:tenantScopeVerified,
    payload_shape_verified:payloadShapeVerified,
    synthetic_user_cleanup:cleanup,
    failure_code:failureCode,
  };
}

export const PORTAL_AUTH_PROOF_CONTRACT=CONTRACT;
