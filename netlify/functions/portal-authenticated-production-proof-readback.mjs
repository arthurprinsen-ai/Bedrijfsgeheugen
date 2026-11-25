import {getStore} from '@netlify/blobs';
import {
  PORTAL_AUTH_PROOF_STORE,
  portalAuthProofKey,
} from '../../platform/api/portal-authenticated-production-proof-core.mjs';

const json=(body,status=200)=>Response.json(body,{
  status,
  headers:{
    'cache-control':'no-store, max-age=0',
    'content-type':'application/json; charset=utf-8',
  },
});

export default async request=>{
  if(request.method!=='GET')return json({error:'METHOD_NOT_ALLOWED'},405);
  const sha=String(new URL(request.url).searchParams.get('sha')||'').trim().toLowerCase();
  if(!/^[0-9a-f]{40}$/.test(sha))return json({error:'INVALID_COMMIT_REF'},400);

  const store=getStore(PORTAL_AUTH_PROOF_STORE);
  const proof=await store.get(portalAuthProofKey(sha),{type:'json',consistency:'strong'});
  if(!proof)return json({error:'PROOF_NOT_FOUND',commit_ref:sha},404);
  return json(proof,200);
};

export const config={
  path:'/api/portal-authenticated-production-proof',
  method:'GET',
};
