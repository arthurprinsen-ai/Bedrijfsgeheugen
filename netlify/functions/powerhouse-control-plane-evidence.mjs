import { createPublicKey, verify as verifySignature } from 'node:crypto';

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

async function supabaseRequest(path,{method='GET',body,prefer=''}={}){
  const base=env('BG_PORTAL_EU_SUPABASE_URL').replace(/\/$/,'');
  const token=env('BG_PORTAL_EU_SERVICE_TOKEN');
  if(!base||!token) throw new Error('CONTROL_PLANE_SUPABASE_UNCONFIGURED');
  const response=await fetch(`${base}/rest/v1/${path}`,{
    method,
    headers:{
      apikey:token,
      authorization:`Bearer ${token}`,
      'content-type':'application/json',
      accept:'application/json',
      ...(prefer?{prefer}:{}),
    },
    body:body===undefined?undefined:JSON.stringify(body),
    signal:AbortSignal.timeout(10000),
  });
  const text=await response.text();
  const payload=text?JSON.parse(text):null;
  if(!response.ok) throw new Error(`SUPABASE_${method}_FAILED:${response.status}:${text.slice(0,500)}`);
  return payload;
}
async function rpc(name,args){return supabaseRequest(`rpc/${name}`,{method:'POST',body:args});}
function sha256Like(value){return /^[0-9a-f]{64}$/i.test(String(value||''));}
function sha40(value){return /^[0-9a-f]{40}$/i.test(String(value||''));}
function requiredString(value,name){
  const v=String(value||'').trim();
  if(!v) throw new Error(`${name}_MISSING`);
  return v;
}
function row(value){return Array.isArray(value)?value[0]:value;}

export async function persistTerminalEvidence(input,claims={}){
  const obligationKey=requiredString(input.obligation_id,'OBLIGATION_ID');
  const candidateSha=requiredString(input.candidate_head_sha,'CANDIDATE_HEAD_SHA').toLowerCase();
  const mainSha=requiredString(input.main_sha,'MAIN_SHA').toLowerCase();
  if(!sha40(candidateSha)||!sha40(mainSha)) throw new Error('SHA_INVALID');
  const productionRunId=Number(input.production_readback_run_id);
  if(!Number.isInteger(productionRunId)||productionRunId<1) throw new Error('PRODUCTION_READBACK_RUN_INVALID');
  const projectionRequired=input.skill_projection_required===true;
  const projectionRunId=input.skill_projection_run_id==null?null:Number(input.skill_projection_run_id);
  if(projectionRequired&&(!Number.isInteger(projectionRunId)||projectionRunId<1)) throw new Error('SKILL_PROJECTION_RUN_INVALID');
  if(input.outcome_verified!==true) throw new Error('OUTCOME_NOT_VERIFIED');
  const learningStatus=requiredString(input.learning_status,'LEARNING_STATUS');
  if(!['APPLIED','NOT_APPLICABLE'].includes(learningStatus)) throw new Error('LEARNING_STATUS_INVALID');
  if(projectionRequired&&learningStatus!=='APPLIED') throw new Error('LEARNING_PROJECTION_MISMATCH');
  const policyVersion=requiredString(input.policy_version,'POLICY_VERSION');
  const skillVersion=requiredString(input.skill_version,'SKILL_VERSION');
  const actor=String(claims.actor||claims.actor_id||'github-actions');
  const obligationPayloadHash=Buffer.from(obligationKey).toString('hex').padEnd(64,'0').slice(0,64);
  const terminalPayloadHash=Buffer.from(`${obligationKey}|${candidateSha}|${mainSha}|${productionRunId}|${projectionRunId||''}`).toString('hex').padEnd(64,'0').slice(0,64);
  if(!sha256Like(obligationPayloadHash)||!sha256Like(terminalPayloadHash)) throw new Error('PAYLOAD_HASH_DERIVATION_FAILED');

  let obligation=row(await rpc('brain_create_obligation',{
    p_obligation_type:'CONTROL_PLANE_DELIVERY',
    p_capability_id:'powerhouse.control-plane',
    p_business_entity:obligationKey,
    p_business_period:'canonical-v1',
    p_business_timezone:'Europe/Amsterdam',
    p_payload_sha256:obligationPayloadHash,
    p_change_id:mainSha,
    p_owner:actor,
  }));
  if(!obligation?.id) throw new Error('OBLIGATION_CREATE_READBACK_MISSING');

  const baseEvidence={
    contract:'powerhouse-control-plane-vertical-slice-v1',
    obligation_id:obligationKey,
    candidate_head_sha:candidateSha,
    main_sha:mainSha,
    production_readback_run_id:productionRunId,
    skill_projection_required:projectionRequired,
    skill_projection_run_id:projectionRunId,
    learning_status:learningStatus,
    policy_version:policyVersion,
    skill_version:skillVersion,
    outcome_verified:true,
    github_workflow_run_id:Number(input.github_workflow_run_id||0)||null,
    oidc_repository:claims.repository||null,
    oidc_workflow_ref:claims.workflow_ref||null,
    actor,
    recorded_at:new Date().toISOString(),
  };

  if(!['RUNNING','FULFILLED'].includes(obligation.state)){
    obligation=row(await rpc('brain_transition_obligation',{
      p_obligation_id:obligation.id,
      p_expected_version:Number(obligation.version),
      p_state:'RUNNING',
      p_owner:actor,
      p_evidence:{...(obligation.evidence||{}),...baseEvidence,state:'RUNNING'},
    }));
  }

  let operation=row(await rpc('brain_create_operation',{
    p_capability_id:'agent:powerhouse-control-plane',
    p_operation_type:'TERMINALIZE',
    p_idempotency_key:`${obligationKey}:${mainSha}`,
    p_payload_sha256:terminalPayloadHash,
    p_change_id:mainSha,
    p_correlation_id:obligationKey,
  }));
  if(!operation?.id) throw new Error('OPERATION_CREATE_READBACK_MISSING');
  if(operation.status!=='VERIFIED'){
    operation=row(await rpc('brain_transition_operation',{
      p_operation_id:operation.id,
      p_expected_version:Number(operation.version),
      p_status:'VERIFIED',
      p_dispatch_generation:null,
      p_remote_ref:`github-run:${productionRunId}`,
      p_evidence:{...(operation.evidence||{}),...baseEvidence,terminal_verification:'VERIFIED'},
    }));
  }

  const idempotencyKey=`control-plane-terminal:${obligationKey}:${mainSha}`;
  await supabaseRequest(`brain_delivery_evidence?on_conflict=idempotency_key`,{
    method:'POST',
    prefer:'resolution=ignore-duplicates,return=minimal',
    body:{
      idempotency_key:idempotencyKey,
      change_id:mainSha,
      component_id:'powerhouse-control-plane',
      target:'supabase',
      status:'GREEN',
      error_class:null,
      remote_status:200,
      remote_ref:`github-run:${productionRunId}`,
      candidate_identity:candidateSha,
      tested_identity:mainSha,
      payload_sha256:terminalPayloadHash,
      evidence:baseEvidence,
    },
  });
  const evidenceRows=await supabaseRequest(`brain_delivery_evidence?idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&select=*`);
  const evidence=row(evidenceRows);
  if(!evidence||evidence.candidate_identity!==candidateSha||evidence.tested_identity!==mainSha||evidence.status!=='GREEN') throw new Error('TERMINAL_EVIDENCE_READBACK_MISMATCH');

  if(obligation.state!=='FULFILLED'){
    obligation=row(await rpc('brain_transition_obligation',{
      p_obligation_id:obligation.id,
      p_expected_version:Number(obligation.version),
      p_state:'FULFILLED',
      p_owner:actor,
      p_evidence:{...(obligation.evidence||{}),...baseEvidence,state:'FULFILLED',delivery_evidence_id:evidence.id,operation_id:operation.id},
    }));
  }
  const readbackRows=await supabaseRequest(`brain_obligations?id=eq.${encodeURIComponent(obligation.id)}&select=id,state,version,evidence`);
  const readback=row(readbackRows);
  if(readback?.state!=='FULFILLED'||readback?.evidence?.main_sha!==mainSha) throw new Error('OBLIGATION_TERMINAL_READBACK_MISMATCH');

  return {
    ok:true,
    terminal_state:'FULFILLED',
    obligation_id:obligationKey,
    obligation_record_id:obligation.id,
    operation_id:operation.id,
    delivery_evidence_id:evidence.id,
    candidate_head_sha:candidateSha,
    main_sha:mainSha,
    production_readback_run_id:productionRunId,
    skill_projection_run_id:projectionRunId,
    learning_status:learningStatus,
    durable_readback_verified:true,
  };
}

export default async function handler(request){
  if(request.method!=='POST') return json({error:'method-not-allowed'},405);
  const auth=request.headers.get('authorization')||'';
  const token=auth.startsWith('Bearer ')?auth.slice(7):'';
  try{
    const claims=await verifyGitHubOidcToken(token);
    const input=await request.json();
    const result=await persistTerminalEvidence(input,claims);
    return json(result,200);
  }catch(error){
    const message=String(error?.message||error);
    const authError=/^OIDC_|TOKEN/.test(message);
    return json({ok:false,error:message},authError?401:422);
  }
}

export const config={path:'/api/powerhouse/control-plane/evidence'};
