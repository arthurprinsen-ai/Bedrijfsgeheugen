/* Verify GitHub Actions OIDC without shared long-lived ingestion secrets.
 * Only the existing main-branch Security Operations workflow can write a
 * coarse security heartbeat. The bearer JWT and raw findings are never logged.
 */
import {createPublicKey,verify as verifySignature} from 'node:crypto';

const ISS='https://token.actions.githubusercontent.com';
const REPO='arthurprinsen-ai/Bedrijfsgeheugen';
// GitHub provider readback: use_default=true, use_immutable_subject=true.
// Pin immutable repository and owner identity as well as the existing workflow/ref.
const OWNER_ID='236997948';
const REPO_ID='1303700955';
const SUBJECT='repo:arthurprinsen-ai@'+OWNER_ID+'/Bedrijfsgeheugen@'+REPO_ID+':ref:refs/heads/main';
const WF=REPO+'/.github/workflows/security-operations-proof.yml@refs/heads/main';
const AUD='https://www.bedrijfsgeheugen.nl/api/security-guardian-ingest';
const B64=s=>Buffer.from(s,'base64url');
const parse=s=>JSON.parse(B64(s).toString('utf8'));
export function assertGitHubClaims(claim,now=Math.floor(Date.now()/1000)){
 if(claim?.iss!==ISS||claim?.aud!==AUD||claim?.repository!==REPO||claim?.workflow_ref!==WF||
 claim?.ref!=='refs/heads/main'||!['schedule','workflow_dispatch','push'].includes(claim?.event_name)||
 !/^[0-9]+$/.test(String(claim?.run_id||''))||
 typeof claim.exp!=='number'||claim.exp<now||claim.exp>now+600||
 typeof claim.iat!=='number'||claim.iat>now+60||now-claim.iat>600||
 String(claim.repository_id||'')!==REPO_ID||String(claim.repository_owner_id||'')!==OWNER_ID||
 claim.sub!==SUBJECT)
 throw Error('UNAUTHORIZED_GITHUB_WORKFLOW');
 return Object.freeze({runId:String(claim.run_id),repository:REPO,issuedAt:claim.iat});
}
export async function verifyGitHubActionsOidc(authorization,{fetchFn=fetch,now=Math.floor(Date.now()/1000)}={}){
 const token=String(authorization||'').replace(/^Bearer /i,'');
 if(token.length<200||token.length>12000||token.split('.').length!==3)throw Error('INVALID_OIDC_TOKEN');
 const [h,p,s]=token.split('.');
 let header,claims;
 try{header=parse(h);claims=parse(p)}catch{throw Error('INVALID_OIDC_ENCODING');}
 if(header?.alg!=='RS256'||typeof header.kid!=='string'||header.kid.length>200||header.typ&&header.typ!=='JWT')
  throw Error('UNSUPPORTED_OIDC_HEADER');
 const output=assertGitHubClaims(claims,now);
 const res=await fetchFn(ISS+'/.well-known/jwks',{method:'GET',redirect:'error',signal:AbortSignal.timeout(6500),cache:'no-store'});
 if(!res.ok)throw Error('OIDC_JWKS_UNAVAILABLE');
 const jwks=await res.json(),key=Array.isArray(jwks.keys)?jwks.keys.find(k=>k.kid===header.kid&&k.kty==='RSA'&&(!k.use||k.use==='sig')):null;
 if(!key)throw Error('OIDC_SIGNING_KEY_NOT_FOUND');
 const pub=createPublicKey({key,format:'jwk'});
 if(!verifySignature('RSA-SHA256',Buffer.from(h+'.'+p),pub,B64(s)))throw Error('INVALID_OIDC_SIGNATURE');
 return output;
}
export const OIDC_AUDIENCE=AUD;
