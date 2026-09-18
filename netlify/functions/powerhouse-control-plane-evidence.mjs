import { createPublicKey, verify as verifySignature } from 'node:crypto';

const AUDIENCE='powerhouse-control-plane-v1';
const ISSUER='https://token.actions.githubusercontent.com';
const REPOSITORY='arthurprinsen-ai/Bedrijfsgeheugen';
const WORKFLOW_PATH='.github/workflows/obligation-terminal-closure.yml';
const JWKS_URL='https://token.actions.githubusercontent.com/.well-known/jwks';

function json(data,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store','content-type':'application/json; charset=utf-8'}});}
function env(name){return Netlify.env.get(name)||'';}
function b64urlJson(part){return JSON.parse(Buffer.from(part,'base64url').toString('utf8'));}
function includesAudience(aud,expected){return Array.isArray(aud)?aud.includes(expected):aud===expected;}

export async function verifyGitHubOidcToken(token,{fetchImpl=fetch,now=Math.floor(Date.now()/1000)}={}){
  const parts=String(token||'').split('.');if(parts.length!==3)throw new Error('OIDC_TOKEN_MALFORMED');
  const [encodedHeader,encodedPayload,encodedSignature]=parts;
  const header=b64urlJson(encodedHeader);const claims=b64urlJson(encodedPayload);
  if(header.alg!=='RS256'||!header.kid)throw new Error('OIDC_ALGORITHM_REJECTED');
  if(claims.iss!==ISSUER)throw new Error('OIDC_ISSUER_REJECTED');
  if(!includesAudience(claims.aud,AUDIENCE))throw new Error('OIDC_AUDIENCE_REJECTED');
  if(claims.repository!==REPOSITORY)throw new Error('OIDC_REPOSITORY_REJECTED');
  if(typeof claims.workflow_ref!=='string'||!claims.workflow_ref.includes(`${WORKFLOW_PATH}@refs/heads/main`))throw new Error('OIDC_WORKFLOW_REJECTED');
  if(Number(claims.exp)<=now||(claims.nbf!=null&&Number(claims.nbf)>now+30))throw new Error('OIDC_TIME_REJECTED');
  const jwksResponse=await fetchImpl(JWKS_URL,{headers:{accept:'application/json'},signal:AbortSignal.timeout(5000)});
  if(!jwksResponse.ok)throw new Error('OIDC_JWKS_UNAVAILABLE');
  const jwks=await jwksResponse.json();const jwk=(jwks.keys||[]).find(key=>key.kid===header.kid&&key.kty==='RSA');
  if(!jwk)throw new Error('OIDC_KID_UNKNOWN');
  const key=createPublicKey({key:jwk,format:'jwk'});
  if(!verifySignature('RSA-SHA256',Buffer.from(`${encodedHeader}.${encodedPayload}`),key,Buffer.from(encodedSignature,'base64url')))throw new Error('OIDC_SIGNATURE_INVALID');
  return claims;
}

export async function persistTerminalEvidence(input,claims={},fetchImpl=fetch){
  const base=env('BG_PORTAL_EU_SUPABASE_URL').replace(/\/$/,'');const token=env('BG_PORTAL_EU_SERVICE_TOKEN');
  if(!base||!token)throw new Error('CONTROL_PLANE_GATEWAY_UNCONFIGURED');
  const response=await fetchImpl(`${base}/functions/v1/powerhouse-control-plane-evidence-eu`,{
    method:'POST',headers:{'content-type':'application/json','x-bg-service-token':token},
    body:JSON.stringify({...input,actor:String(claims.actor||claims.actor_id||'github-actions')}),
    signal:AbortSignal.timeout(15000)
  });
  const body=await response.json().catch(()=>({ok:false,error:'CONTROL_PLANE_GATEWAY_INVALID_JSON'}));
  if(!response.ok)throw new Error(`CONTROL_PLANE_GATEWAY_FAILED:${response.status}:${JSON.stringify(body).slice(0,900)}`);
  return body;
}

export default async function handler(request){
  if(request.method!=='POST')return json({error:'method-not-allowed'},405);
  const auth=request.headers.get('authorization')||'';const token=auth.startsWith('Bearer ')?auth.slice(7):'';
  try{
    const claims=await verifyGitHubOidcToken(token);const input=await request.json();
    const result=await persistTerminalEvidence(input,claims);return json(result,200);
  }catch(error){
    const message=String(error?.message||error);const authError=/^OIDC_|TOKEN/.test(message);
    return json({ok:false,error:message},authError?401:422);
  }
}

export const config={path:'/api/powerhouse/control-plane/evidence'};
