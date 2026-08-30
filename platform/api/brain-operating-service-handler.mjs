import {createHash,timingSafeEqual} from 'node:crypto';
import {transformSourceRecord} from '../../brain/operating-loop/source-transformer.mjs';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store'}});
const sha256=v=>createHash('sha256').update(v).digest();
const transformErrors=new Set(['UNKNOWN_BRAIN_SOURCE','SOURCE_TYPE_NOT_ALLOWED','SOURCE_IDENTITY_INCOMPLETE']);
export function createServiceIngestHandler({store,credentials=[]}={}){
  if(!store?.append) throw new TypeError('operating loop store is required');
  const parsed=credentials.map(c=>({serviceId:String(c.serviceId||''),tenantId:String(c.tenantId||''),hash:Buffer.from(String(c.tokenSha256||''),'hex')})).filter(c=>c.serviceId&&c.tenantId&&c.hash.length===32);
  return async request=>{
    if(request.method!=='POST') return new Response('Method Not Allowed',{status:405,headers:{allow:'POST'}});
    const auth=request.headers.get('authorization')||'';const match=/^Bearer\s+(.+)$/i.exec(auth);if(!match) return reply({error:'UNAUTHENTICATED'},401);
    const presented=sha256(match[1]);const credential=parsed.find(c=>c.hash.length===presented.length&&timingSafeEqual(c.hash,presented));if(!credential) return reply({error:'UNAUTHENTICATED'},401);
    let body;try{body=await request.json();}catch{return reply({error:'INVALID_JSON'},400);}
    try{
      let record;
      if(body?.canonicalType&&body?.raw&&typeof body.raw==='object'){
        record=transformSourceRecord({...body,tenantId:credential.tenantId});
        if(record.source!==credential.serviceId) return reply({error:'SERVICE_SOURCE_MISMATCH'},403);
        record={...record,idempotencyKey:body.idempotencyKey,serviceId:credential.serviceId};
      }else{
        if(body?.source&&String(body.source)!==credential.serviceId) return reply({error:'SERVICE_SOURCE_MISMATCH'},403);
        record={...body,tenantId:credential.tenantId,serviceId:credential.serviceId};
      }
      const result=await store.append(record);return reply(result,result.duplicate?200:201);
    }catch(error){
      if(error?.code==='BRAIN_RECORD_CONFLICT') return reply({error:error.code},409);
      if(transformErrors.has(error?.code)||error instanceof TypeError) return reply({error:error?.code||'INVALID_RECORD',message:error.message},400);
      throw error;
    }
  };
}
