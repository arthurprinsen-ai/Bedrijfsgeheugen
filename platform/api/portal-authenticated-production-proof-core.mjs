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
    one_loop_assurance_proof:'UNVERIFIED',
    one_loop_assurance_admin_verified:false,
    one_loop_assurance_nonadmin_denied:false,
    one_loop_assurance_unauthenticated_denied:false,
    one_loop_assurance_counts:null,
    one_loop_assurance_failure_code:'NOT_EXECUTED',
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
  // One original deploySucceeded proof, three independent auth outcomes:
  // ephemeral signed admin, normal synthetic tenant and anonymous caller.
  // Never serialize Identity tokens, private forecasts or raw loop rows.
  const assurance={admin:false,nonadmin:false,anonymous:false,counts:null,failure:'NOT_EXECUTED'};
  const oneLoopUrl=`${immutableUrl}/api/powerhouse-one-loop-assurance`;

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
      // Privilege only the ephemeral synthetic 'a' identity using admin-owned
      // app_metadata. The other synthetic tenant remains strictly non-admin.
      const proofRoles=slot==='a'?['powerhouse-admin']:[];
      const email=`bg-portal-proof-${slot}-${deployId}@proof.invalid`;
      const user=await identityAdmin.createUser({
        email,password,
        data:{
          app_metadata:{tenantId,roles:proofRoles},
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
      const originalRoles=Array.isArray(storedMetadata.roles)?storedMetadata.roles:[];
      if(clean(storedMetadata.tenantId)!==tenantId||
         (slot==='a'&&!originalRoles.includes('powerhouse-admin'))||
         (slot==='b'&&originalRoles.some(r=>['admin','owner','powerhouse-admin','powerhouse_admin'].includes(r)))){
        await identityAdmin.updateUser(user.id,{
          app_metadata:{...storedMetadata,tenantId,roles:proofRoles},
        });
        const updatedUser=await identityAdmin.getUser(user.id);
        const updatedMetadata=updatedUser?.appMetadata||updatedUser?.app_metadata||{};
        if(clean(updatedMetadata.tenantId)!==tenantId){
          throw fail('IDENTITY_ADMIN_TENANT_METADATA_NOT_PERSISTED');
        }
        const confirmedRoles=Array.isArray(updatedMetadata.roles)?updatedMetadata.roles:[];
        if(slot==='a'&&!confirmedRoles.includes('powerhouse-admin'))
          throw fail('IDENTITY_SYNTHETIC_ADMIN_ROLE_NOT_PERSISTED');
        if(slot==='b'&&confirmedRoles.some(r=>['admin','owner','powerhouse-admin','powerhouse_admin'].includes(r)))
          throw fail('IDENTITY_SYNTHETIC_NONADMIN_ROLE_OVERGRANTED');
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
      const signedRoles=Array.isArray(claims?.app_metadata?.roles)?claims.app_metadata.roles:[];
      if(slot==='a'&&!signedRoles.includes('powerhouse-admin'))
        throw fail('SIGNED_SYNTHETIC_ADMIN_ROLE_MISSING');
      if(slot==='b'&&signedRoles.some(r=>['admin','owner','powerhouse-admin','powerhouse_admin'].includes(r)))
        throw fail('SIGNED_SYNTHETIC_NONADMIN_ROLE_OVERGRANTED');

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
      // Probe the exact immutable deploy, never the public alias or a mock.
      // Failed provider readback is a separate evidence gap, not proof of RED
      // or a reason to bypass existing auth/tenant protection.
      try{
        const response=await fetchImpl(oneLoopUrl,{
          method:'GET',
          headers:{accept:'application/json',authorization:`Bearer ${accessToken}`,'cache-control':'no-cache'},
        });
        if(slot==='a'){
          const projection=response?.status===200?await response.json().catch(()=>null):null;
          const count=projection?.counts;
          const valid=projection?.contract==='one-brain-original-loop-assurance-readback-v1'&&
            projection?.status==='READBACK_COMPLETE'&&projection?.source==='public.powerhouse_loop_assurance_state_v1'&&
            Number(count?.total)===15&&
            Number(count?.green)+Number(count?.amber)+Number(count?.red)===15&&
            Array.isArray(projection.loops)&&projection.loops.length===15&&
            ['RED','AMBER','GREEN'].includes(projection.overallStatus);
          if(valid){
            assurance.admin=true;
            assurance.counts={total:15,green:count.green,amber:count.amber,red:count.red,
              overallStatus:projection.overallStatus};
            assurance.failure=null;
          }else assurance.failure='ORIGINAL_ASSURANCE_ADMIN_READBACK_UNVERIFIED';
        }else{
          const body=response?.status===403?await response.json().catch(()=>null):null;
          assurance.nonadmin=response?.status===403&&body?.error==='POWERHOUSE_ADMIN_REQUIRED';
          if(!assurance.nonadmin)assurance.failure='ORIGINAL_ASSURANCE_NONADMIN_NOT_DENIED';
        }
      }catch{
        assurance.failure='ORIGINAL_ASSURANCE_ROUTE_HTTP_UNVERIFIED';
      }
    }
    crossTenantScopeVerified=
      observations.length===2&&
      observations[0].tenantId!==observations[1].tenantId&&
      observations.every(o=>o.httpStatus===200&&o.validShape);
    try{
      const response=await fetchImpl(oneLoopUrl,{method:'GET',
        headers:{accept:'application/json','cache-control':'no-cache'}});
      const body=response?.status===401?await response.json().catch(()=>null):null;
      assurance.anonymous=response?.status===401&&body?.error==='UNAUTHENTICATED';
      if(!assurance.anonymous)assurance.failure='ORIGINAL_ASSURANCE_ANONYMOUS_NOT_DENIED';
    }catch{assurance.failure='ORIGINAL_ASSURANCE_ANONYMOUS_HTTP_UNVERIFIED';}
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
    one_loop_assurance_proof:!failureCode&&cleanup==='DELETED'&&assurance.admin&&
      assurance.nonadmin&&assurance.anonymous?'PROVEN':'UNVERIFIED',
    one_loop_assurance_admin_verified:assurance.admin&&cleanup==='DELETED',
    one_loop_assurance_nonadmin_denied:assurance.nonadmin,
    one_loop_assurance_unauthenticated_denied:assurance.anonymous,
    one_loop_assurance_counts:assurance.admin&&cleanup==='DELETED'?assurance.counts:null,
    one_loop_assurance_failure_code:assurance.admin&&assurance.nonadmin&&assurance.anonymous&&
      cleanup==='DELETED'&&!failureCode?null:assurance.failure||failureCode||'PROOF_INCOMPLETE',
  };
}

export const PORTAL_AUTH_PROOF_CONTRACT=CONTRACT;


/**
 * Original Production Release Readback's terminal assurance gate.
 * The generic signed two-tenant portal proof is intentionally independent.
 * Fail closed if the exact deploy's admin-only original 15-loop proof is due.
 * This never changes source RED/AMBER flags or implies business outcomes.
 */
export function assertOneLoopProductionReleaseProof(proof){
  if(proof?.one_loop_assurance_proof!=='PROVEN')throw fail('ONE_LOOP_ADMIN_PROOF_NOT_PROVEN');
  if(proof?.one_loop_assurance_admin_verified!==true)
    throw fail('ONE_LOOP_ADMIN_READBACK_NOT_VERIFIED');
  if(proof?.one_loop_assurance_nonadmin_denied!==true)
    throw fail('ONE_LOOP_NONADMIN_BOUNDARY_NOT_VERIFIED');
  if(proof?.one_loop_assurance_unauthenticated_denied!==true)
    throw fail('ONE_LOOP_ANONYMOUS_BOUNDARY_NOT_VERIFIED');
  if(proof?.synthetic_user_cleanup!=='DELETED')
    throw fail('ONE_LOOP_SYNTHETIC_CLEANUP_NOT_VERIFIED');
  if(proof?.one_loop_assurance_failure_code!==null)
    throw fail('ONE_LOOP_SOURCE_FAILURE_NOT_RESOLVED');
  const counts=proof?.one_loop_assurance_counts;
  if(!counts||!Number.isInteger(counts.total)||counts.total!==15||
    !['green','amber','red'].every(k=>Number.isInteger(counts[k])&&counts[k]>=0)||
    counts.green+counts.amber+counts.red!==15)
    throw fail('ONE_LOOP_CANONICAL_15_COUNT_INCONSISTENT');
  const expectedStatus=counts.red>0?'RED':counts.amber>0?'AMBER':'GREEN';
  if(counts.overallStatus!==expectedStatus)
    throw fail('ONE_LOOP_CANONICAL_OVERALL_STATUS_CONFLICT');
  return Object.freeze({
    contract:'one-brain-original-loop-assurance-readback-v1',
    status:'PROVEN',
    count:15,
    green:counts.green,
    amber:counts.amber,
    red:counts.red,
    overallStatus:counts.overallStatus,
    nonadminDenied:true,
    unauthenticatedDenied:true,
    cleanup:'DELETED'
  });
}
