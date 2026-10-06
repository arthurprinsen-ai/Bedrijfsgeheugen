import { createHash, createPublicKey, verify as verifySignature } from 'node:crypto';

const AUDIENCE='powerhouse-control-plane-v1';
const ISSUER='https://token.actions.githubusercontent.com';
const REPOSITORY='arthurprinsen-ai/Bedrijfsgeheugen';
const WORKFLOW_PATH='.github/workflows/obligation-terminal-closure.yml';
const JWKS_URL='https://token.actions.githubusercontent.com/.well-known/jwks';

function json(data,status=200){
  return Response.json(data,{status,headers:{'cache-control':'no-store','content-type':'application/json; charset=utf-8'}});
}
function env(name){
  return globalThis.Netlify?.env?.get?.(name) || process.env[name] || '';
}
function b64urlJson(part){
  return JSON.parse(Buffer.from(part,'base64url').toString('utf8'));
}
function includesAudience(aud,expected){
  return Array.isArray(aud) ? aud.includes(expected) : aud===expected;
}
export async function verifyGitHubOidcToken(token,{fetchImpl=fetch,now=Math.floor(Date.now()/1000)}={}){
  const parts=String(token||'').split('.');
  if(parts.length!==3) throw new Error('OIDC_TOKEN_MALFORMED');
  const [encodedHeader,encodedPayload,encodedSignature]=parts;
  const header=b64urlJson(encodedHeader);
  const claims=b64urlJson(encodedPayload);
  if(header.alg!=='RS256'||!header.kid) throw new Error('OIDC_ALGORITHM_REJECTED');
  if(claims.iss!==ISSUER) throw new Error('OIDC_ISSUER_REJECTED');
  if(!includesAudience(claims.aud,AUDIENCE)) throw new Error('OIDC_AUDIENCE_REJECTED');
  if(claims.repository!==REPOSITORY) throw new Error('OIDC_REPOSITORY_REJECTED');
  if(typeof claims.workflow_ref!=='string' || !claims.workflow_ref.includes(`${WORKFLOW_PATH}@refs/heads/main`)) throw new Error('OIDC_WORKFLOW_REJECTED');
  if(Number(claims.exp)<=now || (claims.nbf!=null && Number(claims.nbf)>now+30)) throw new Error('OIDC_TIME_REJECTED');
  const jwksResponse=await fetchImpl(JWKS_URL,{headers:{accept:'application/json'},signal:AbortSignal.timeout(5000)});
  if(!jwksResponse.ok) throw new Error('OIDC_JWKS_UNAVAILABLE');
  const jwks=await jwksResponse.json();
  const jwk=(jwks.keys||[]).find(key=>key.kid===header.kid&&key.kty==='RSA');
  if(!jwk) throw new Error('OIDC_KID_UNKNOWN');
  const key=createPublicKey({key:jwk,format:'jwk'});
  const signed=Buffer.from(`${encodedHeader}.${encodedPayload}`);
  const signature=Buffer.from(encodedSignature,'base64url');
  if(!verifySignature('RSA-SHA256',signed,key,signature)) throw new Error('OIDC_SIGNATURE_INVALID');
  return claims;
}

function sha40(value){return /^[0-9a-f]{40}$/i.test(String(value||''));}
function requiredString(value,name){
  const v=String(value||'').trim();
  if(!v) throw new Error(`${name}_MISSING`);
  return v;
}
async function recoverCommittedTerminalEvidence(input,{fetchImpl=fetch,attempts=5}={}){
  const obligationKey=requiredString(input.obligation_id,'OBLIGATION_ID');
  const candidateSha=requiredString(input.candidate_head_sha,'CANDIDATE_HEAD_SHA').toLowerCase();
  const mainSha=requiredString(input.main_sha,'MAIN_SHA').toLowerCase();
  if(!sha40(candidateSha)||!sha40(mainSha)) throw new Error('SHA_INVALID');
  if(input.provider_readback_required===true) return null;
  const base=env('BG_PORTAL_EU_SUPABASE_URL').replace(/\/$/,'');
  const token=env('BG_PORTAL_EU_SERVICE_TOKEN');
  if(!base||!token) return null;
  for(let attempt=1;attempt<=attempts;attempt+=1){
    try{
      const response=await fetchImpl(`${base}/functions/v1/portal-state-eu`,{
        method:'POST',
        headers:{'content-type':'application/json','x-bg-service-token':token},
        body:JSON.stringify({action:'control_plane_cockpit'}),
        signal:AbortSignal.timeout(5000),
      });
      if(response.ok){
        const payload=await response.json();
        const row=(payload?.obligations||[]).find(item=>String(item?.obligation_key||'')===obligationKey);
        const migrationOk=input.migration_readback_required!==true || row?.migration_readback_verified===true;
        const projectionOk=input.skill_projection_required!==true || (row?.skill_version && row.skill_version!=='NOT_APPLICABLE');
        if(row?.current_state==='FULFILLED'
          && row?.operation_status==='VERIFIED'
          && Number(row?.evidence_count||0)>0
          && Number(row?.red_evidence_count||0)===0
          && row?.outcome_verified===true
          && String(row?.production_observed_sha||'').toLowerCase()===mainSha
          && migrationOk
          && projectionOk){
          return {
            ok:true,
            terminal_state:'FULFILLED',
            obligation_id:obligationKey,
            obligation_record_id:row.obligation_id||null,
            operation_id:row.operation_id||null,
            delivery_evidence_id:null,
            candidate_head_sha:candidateSha,
            main_sha:mainSha,
            production_readback_mode:'durable_cockpit',
            production_readback_run_id:input.production_readback_run_id??null,
            production_observed_sha:String(row.production_observed_sha).toLowerCase(),
            production_deploy_id:input.production_deploy_id??null,
            production_readback_verified:true,
            skill_projection_run_id:input.skill_projection_run_id??null,
            learning_status:input.learning_status||null,
            migration_readback_required:input.migration_readback_required===true,
            migration_readback_verified:migrationOk,
            provider_readback_required:false,
            provider_readback_verified:true,
            provider_readbacks:[],
            durable_readback_verified:true,
            recovered_from_committed_terminal:true,
          };
        }
      }
    }catch{}
    if(attempt<attempts) await new Promise(resolve=>setTimeout(resolve,1000));
  }
  return null;
}

async function persistTerminalEvidence(input,claims={}){
  const obligationKey=requiredString(input.obligation_id,'OBLIGATION_ID');
  const candidateSha=requiredString(input.candidate_head_sha,'CANDIDATE_HEAD_SHA').toLowerCase();
  const mainSha=requiredString(input.main_sha,'MAIN_SHA').toLowerCase();
  if(!sha40(candidateSha)||!sha40(mainSha)) throw new Error('SHA_INVALID');
  const base=env('BG_PORTAL_EU_SUPABASE_URL').replace(/\/$/,'');
  const token=env('BG_PORTAL_EU_SERVICE_TOKEN');
  if(!base||!token) throw new Error('CONTROL_PLANE_SUPABASE_EDGE_UNCONFIGURED');
  const terminal={
    ...input,
    obligation_id:obligationKey,
    candidate_head_sha:candidateSha,
    main_sha:mainSha,
    actor:String(claims.actor||claims.actor_id||'github-actions'),
    oidc_repository:claims.repository||null,
    oidc_workflow_ref:claims.workflow_ref||null,
  };
  const response=await fetch(`${base}/functions/v1/growth-datahub-ingest`,{
    method:'POST',
    headers:{'content-type':'application/json','x-bg-service-token':token},
    body:JSON.stringify({action:'control_plane_terminal',terminal}),
    signal:AbortSignal.timeout(15000),
  });
  const text=await response.text();
  let payload=null;
  try{payload=text?JSON.parse(text):null;}catch{payload={error:'INVALID_EDGE_RESPONSE',detail:text.slice(0,500)}}
  if(!response.ok) throw new Error(`CONTROL_PLANE_EDGE_FAILED:${response.status}:${JSON.stringify(payload).slice(0,700)}`);
  const result=payload?.result;
  if(!result?.ok||result.terminal_state!=='FULFILLED'||result.durable_readback_verified!==true) throw new Error('CONTROL_PLANE_EDGE_READBACK_REJECTED');
  return result;
}

export default async function handler(request){
  if(request.method!=='POST') return json({error:'method-not-allowed'},405);
  const auth=request.headers.get('authorization')||'';
  const token=auth.startsWith('Bearer ')?auth.slice(7):'';
  try{
    const claims=await verifyGitHubOidcToken(token);
    const input=await request.json();
    try{
      const result=await persistTerminalEvidence(input,claims);
      return json(result,200);
    }catch(error){
      const message=String(error?.message||error);
      const recoverable=/aborted due to timeout|IDEMPOTENCY_PAYLOAD_CONFLICT/i.test(message);
      if(recoverable){
        const recovered=await recoverCommittedTerminalEvidence(input);
        if(recovered) return json(recovered,200);
      }
      throw error;
    }
  }catch(error){
    const message=String(error?.message||error);
    const authError=/^OIDC_|TOKEN/.test(message);
    return json({ok:false,error:message},authError?401:422);
  }
}

export const config={path:'/api/powerhouse/control-plane/evidence'};
