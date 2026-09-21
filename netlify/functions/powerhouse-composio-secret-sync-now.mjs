import { syncComposioSecret } from './powerhouse-composio-secret-sync.mjs';

const EXPECTED_TOKEN_SHA256='b58427f8c5823bc93b35db9a1ad79d3546007e92f8a362fa6261cecd2f7f9289';
async function sha256(value){
  const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(value||'')));
  return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

export default async request=>{
  if(request.method!=='POST')return new Response('Method Not Allowed',{status:405,headers:{allow:'POST'}});
  const token=request.headers.get('x-powerhouse-token')||'';
  if(!token||await sha256(token)!==EXPECTED_TOKEN_SHA256){
    return Response.json({ok:false,error:'UNAUTHORIZED'},{status:401,headers:{'cache-control':'no-store'}});
  }
  return syncComposioSecret();
};

export const config={path:'/api/powerhouse-composio-secret-sync-now'};
