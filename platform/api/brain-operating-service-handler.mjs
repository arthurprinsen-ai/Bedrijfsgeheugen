import {createHash,timingSafeEqual} from 'node:crypto';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store'}});
const sha256=v=>createHash('sha256').update(v).digest();
export function createServiceIngestHandler({store,credentials=[]}={}){
  if(!store?.append) throw new TypeError('operating loop store is required');
  const parsed=credentials.map(c=>({serviceId:String(c.serviceId||''),tenantId:String(c.tenantId||''),hash:Buffer.from(String(c.tokenSha256||''),'hex')})).filter(c=>c.serviceId&&c.tenantId&&c.hash.length===32);
  return async request=>{
    if(request.method!=='POST') return new Response('Method Not Allowed',{status:405,headers:{allow:'POST'}});
    const auth=request.headers.get('authorization')||'';const match=/^Bearer\s+(.+)$/i.exec(auth);if(!match) return reply({error:'UNAUTHENTICATED'},401);
    const presented=sha256(match[1]);const credential=parsed.find(c=>c.hash.length===presented.length&&timingSafeEqual(c.hash,presented));if(!credential) return reply({error:'UNAUTHENTICATED'},401);
    let body;try{body=await request.json();}catch{return reply({error:'INVALID_JSON'},400);}
    try{const result=await store.append({...body,tenantId:credential.tenantId,serviceId:credential.serviceId});return reply(result,result.duplicate?200:201);}catch(error){if(error?.code==='BRAIN_RECORD_CONFLICT') return reply({error:error.code},409);if(error instanceof TypeError) return reply({error:'INVALID_RECORD',message:error.message},400);throw error;}
  };
}
