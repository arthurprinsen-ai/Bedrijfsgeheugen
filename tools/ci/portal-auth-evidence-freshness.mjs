import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

export const AUTH_RUNTIME_PATHS=[
  'netlify/functions/portal-ondernemersdata.mjs',
  'netlify/functions/_portal-supabase-store.mjs',
  'netlify/functions/portal-authenticated-production-proof.mjs',
  'netlify/functions/portal-authenticated-production-proof-readback.mjs',
  'platform/api/portal-authenticated-production-proof-core.mjs',
  'supabase/functions/portal-state-eu/index.ts',
];
export const LEARNING_PATHS=[
  'brain/learning/2026-10-07-portal-authenticated-production-503-serverless-env-v1.json',
  'brain/learning/2026-10-08-portal-authenticated-production-supabase-edge-gateway-v1.json',
];
const shaPattern=/^[a-f0-9]{40}$/;
export function evaluatePortalAuthEvidence({record,changedPaths,headSha}){
  const proof=record?.production_readback;
  const changed=changedPaths.filter(p=>AUTH_RUNTIME_PATHS.includes(p));
  const claimsCurrent=record?.status==='ACTIVE'&&record?.production_claim==='LIVE_PROVEN';
  if(!claimsCurrent)return {ok:true,state:'NOT_CLAIMED',changed};
  const correct=proof?.contract==='PORTAL_AUTHENTICATED_PRODUCTION_PROOF_V1'
    &&proof?.proof_status==='PROVEN'&&proof?.http_status===200
    &&proof?.tenant_scope_verified===true&&proof?.payload_shape_verified===true
    &&proof?.synthetic_user_cleanup==='DELETED'
    &&shaPattern.test(proof?.protected_runtime_sha||'')
    &&typeof proof?.netlify_deploy_id==='string'&&proof.netlify_deploy_id.length>0;
  if(!correct)return {ok:false,state:'INVALID_PRODUCTION_EVIDENCE',changed};
  if(changed.length)return {ok:false,state:'STALE_RUNTIME_PROOF',changed,evidenceSha:proof.protected_runtime_sha,headSha};
  return {ok:true,state:'FRESH_RUNTIME_PROOF',changed,evidenceSha:proof.protected_runtime_sha,headSha};
}
function git(args){return execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();}
function main(){
  const head=git(['rev-parse','HEAD']);
  let failed=false;
  for(const path of LEARNING_PATHS){
    const record=JSON.parse(readFileSync(path,'utf8'));
    const proofSha=record?.production_readback?.protected_runtime_sha;
    let changedPaths=[];
    if(proofSha&&shaPattern.test(proofSha)){
      // Fail closed if the evidence commit is missing or not in this HEAD's ancestry.
      const ancestor=(()=>{try{git(['merge-base','--is-ancestor',proofSha,head]);return true;}catch{return false;}})();
      changedPaths=ancestor?git(['diff','--name-only',proofSha,head,'--',...AUTH_RUNTIME_PATHS]).split('\n').filter(Boolean):[...AUTH_RUNTIME_PATHS];
    }else changedPaths=[...AUTH_RUNTIME_PATHS];
    const result=evaluatePortalAuthEvidence({record,changedPaths,headSha:head});
    process.stdout.write(JSON.stringify({record:path,...result})+'\n');
    if(!result.ok)failed=true;
  }
  if(failed){console.error('Portal authenticated evidence is stale: downgrade ACTIVE/LIVE_PROVEN to a pending state in the same runtime-changing PR; restore only after exact production deploy and authenticated readback.');process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href)main();
