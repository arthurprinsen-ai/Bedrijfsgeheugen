import { admin, login, verifyRequestOrigin } from '@netlify/identity';
import { randomUUID, webcrypto } from 'node:crypto';

const ISSUER='https://token.actions.githubusercontent.com';
const JWKS_URL='https://token.actions.githubusercontent.com/.well-known/jwks';
const AUDIENCE='bedrijfsgeheugen-portal-production-canary-v1';
const REPOSITORY='arthurprinsen-ai/Bedrijfsgeheugen';
const REF='refs/heads/main';
const WORKFLOW_REF='arthurprinsen-ai/Bedrijfsgeheugen/.github/workflows/production-release-readback.yml@refs/heads/main';
const ORIGIN='https://www.bedrijfsgeheugen.nl';
const CANARY_PREFIX='portal-canary+';

const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store','content-type':'application/json; charset=utf-8'}});
const base64url=value=>Buffer.from(value.replace(/-/g,'+').replace(/_/g,'/'),'base64');
const decodeJson=value=>JSON.parse(base64url(value).toString('utf8'));

function bearer(request){
  const value=String(request.headers.get('authorization')||'');
  return value.startsWith('Bearer ')?value.slice(7).trim():'';
}

function audienceMatches(value){
  return Array.isArray(value)?value.includes(AUDIENCE):value===AUDIENCE;
}

async function verifyGithubActionsOidc(token){
  const parts=String(token||'').split('.');
  if(parts.length!==3) throw new Error('OIDC_TOKEN_SHAPE_INVALID');
  const [encodedHeader,encodedPayload,encodedSignature]=parts;
  const header=decodeJson(encodedHeader);
  const claims=decodeJson(encodedPayload);
  if(header.alg!=='RS256'||!header.kid) throw new Error('OIDC_HEADER_INVALID');

  const jwksResponse=await fetch(JWKS_URL,{headers:{accept:'application/json','cache-control':'no-cache'}});
  if(!jwksResponse.ok) throw new Error(`OIDC_JWKS_${jwksResponse.status}`);
  const jwks=await jwksResponse.json();
  const jwk=Array.isArray(jwks?.keys)?jwks.keys.find(item=>item.kid===header.kid):null;
  if(!jwk) throw new Error('OIDC_SIGNING_KEY_NOT_FOUND');

  const key=await webcrypto.subtle.importKey(
    'jwk',
    jwk,
    {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},
    false,
    ['verify']
  );
  const valid=await webcrypto.subtle.verify(
    {name:'RSASSA-PKCS1-v1_5'},
    key,
    base64url(encodedSignature),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );
  if(!valid) throw new Error('OIDC_SIGNATURE_INVALID');

  const now=Math.floor(Date.now()/1000);
  const exp=Number(claims.exp||0);
  const nbf=Number(claims.nbf||0);
  if(claims.iss!==ISSUER) throw new Error('OIDC_ISSUER_INVALID');
  if(!audienceMatches(claims.aud)) throw new Error('OIDC_AUDIENCE_INVALID');
  if(!exp||exp<now-30) throw new Error('OIDC_EXPIRED');
  if(nbf&&nbf>now+30) throw new Error('OIDC_NOT_YET_VALID');
  if(claims.repository!==REPOSITORY) throw new Error('OIDC_REPOSITORY_INVALID');
  if(claims.ref!==REF) throw new Error('OIDC_REF_INVALID');
  if(claims.workflow_ref!==WORKFLOW_REF) throw new Error('OIDC_WORKFLOW_INVALID');
  if(claims.sub!==`repo:${REPOSITORY}:ref:${REF}`) throw new Error('OIDC_SUBJECT_INVALID');
  if(!['push','workflow_dispatch'].includes(String(claims.event_name||''))) throw new Error('OIDC_EVENT_INVALID');
  if(!/^[0-9a-f]{40}$/i.test(String(claims.sha||''))) throw new Error('OIDC_SHA_INVALID');
  return claims;
}

function isCanary(user){
  return String(user?.email||'').startsWith(CANARY_PREFIX)
    && user?.appMetadata?.portalCanary===true;
}

async function deleteStaleCanaries(){
  const stale=[];
  for(let page=1;page<=10;page+=1){
    const users=await admin.listUsers({page,perPage:100});
    stale.push(...users.filter(isCanary));
    if(users.length<100) break;
  }
  await Promise.all(stale.map(user=>admin.deleteUser(user.id)));
  return stale.length;
}

export default async request=>{
  try{
    verifyRequestOrigin(request,{allowedOrigins:[ORIGIN]});
  }catch{
    return json({error:'ORIGIN_FORBIDDEN'},403);
  }

  let claims;
  try{
    claims=await verifyGithubActionsOidc(bearer(request));
  }catch(error){
    return json({error:'CANARY_OIDC_FORBIDDEN',reason:error?.message||String(error)},403);
  }

  if(request.method==='POST'){
    const staleDeleted=await deleteStaleCanaries();
    const suffix=`${String(claims.run_id||Date.now())}-${randomUUID()}`;
    const email=`${CANARY_PREFIX}${suffix}@bedrijfsgeheugen.nl`;
    const password=`BgCanary-${randomUUID()}-${randomUUID()}!`;
    const tenantId=`canary:${String(claims.sha)}:${String(claims.run_id||'run')}`;
    let created=null;
    try{
      created=await admin.createUser({
        email,
        password,
        data:{
          app_metadata:{tenantId,roles:['portal-canary'],portalCanary:true},
          user_metadata:{full_name:'Portal production canary',portalCanary:true}
        }
      });
      await login(email,password);
      return json({
        contract:'portal-authenticated-production-canary-v1',
        userId:created.id,
        tenantId,
        sourceSha:String(claims.sha),
        staleCanariesDeleted:staleDeleted,
        ephemeral:true
      });
    }catch(error){
      if(created?.id) await admin.deleteUser(created.id).catch(()=>{});
      return json({error:'CANARY_SESSION_CREATE_FAILED',reason:error?.message||String(error)},502);
    }
  }

  if(request.method==='DELETE'){
    let body={};
    try{ body=await request.json(); }catch{}
    const userId=String(body?.userId||'').trim();
    if(!userId) return json({error:'CANARY_USER_ID_REQUIRED'},400);
    try{
      const user=await admin.getUser(userId);
      if(!isCanary(user)) return json({error:'CANARY_USER_SCOPE_INVALID'},403);
      await admin.deleteUser(userId);
      return new Response(null,{status:204,headers:{'cache-control':'no-store'}});
    }catch(error){
      return json({error:'CANARY_CLEANUP_FAILED',reason:error?.message||String(error)},502);
    }
  }

  return json({error:'METHOD_NOT_ALLOWED'},405);
};

export const config={
  path:'/api/internal/portal-auth-canary-session',
  method:['POST','DELETE']
};
