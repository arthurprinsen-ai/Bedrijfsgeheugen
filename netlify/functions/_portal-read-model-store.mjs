import { getStore } from '@netlify/blobs';
import { shouldReplaceProjection } from '../../platform/read-models/portal-server-state.mjs';

const STORE_NAME='brain-read-models';
const keyFor=tenantId=>`${encodeURIComponent(tenantId)}/portal-state`;
export function createPortalProjectionStore(store=getStore({name:STORE_NAME,consistency:'strong'})){
 return Object.freeze({
   async get(tenantId){return await store.get(keyFor(tenantId),{type:'json',consistency:'strong'});},
   async put(tenantId,next){
     const key=keyFor(tenantId);
     for(let attempt=0;attempt<3;attempt++){
       const meta=await store.getWithMetadata(key,{type:'json',consistency:'strong'});
       const current=meta?.data||null;
       if(!shouldReplaceProjection(current,next)) return {stored:false,stale:true,record:current};
       const options=meta?.etag?{onlyIfMatch:meta.etag}:{onlyIfNew:true};
       const result=await store.setJSON(key,next,options);
       if(result.modified) return {stored:true,stale:false,record:next};
     }
     const current=await store.get(key,{type:'json',consistency:'strong'});
     return {stored:false,stale:!shouldReplaceProjection(current,next),record:current};
   }
 });
}
