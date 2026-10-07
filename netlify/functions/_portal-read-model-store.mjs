import { getStore } from '@netlify/blobs';
import { shouldReplaceProjection } from '../../platform/read-models/portal-server-state.mjs';
import { composePortalProjectionLayers,PORTAL_LAYERS } from '../../platform/read-models/portal-projection-layers.mjs';

const STORE_NAME='brain-read-models';
const legacyCompatKey=tenantId=>`${encodeURIComponent(tenantId)}/portal-state`;
const keyFor=(tenantId,layer)=>`${encodeURIComponent(tenantId)}/portal-state/${layer}`;
async function conditionalPut(store,key,next){
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
export function createPortalProjectionStore(store=getStore({name:STORE_NAME,consistency:'strong'})){
 async function getLayer(tenantId,layer){
   const direct=await store.get(keyFor(tenantId,layer),{type:'json',consistency:'strong'});
   if(direct||layer!==PORTAL_LAYERS.LEGACY)return direct;
   return await store.get(legacyCompatKey(tenantId),{type:'json',consistency:'strong'});
 }
 return Object.freeze({
   async getLayer(tenantId,layer){return getLayer(tenantId,layer);},
   async get(tenantId){
     const [legacy,canonical]=await Promise.all([getLayer(tenantId,PORTAL_LAYERS.LEGACY),getLayer(tenantId,PORTAL_LAYERS.CANONICAL)]);
     if(!legacy&&!canonical)return null;
     const data=composePortalProjectionLayers({legacy,canonical});
     const sourceUpdatedAt=data.sourceMeta?.updatedAt||canonical?.sourceUpdatedAt||legacy?.sourceUpdatedAt||'';
     return{schemaVersion:2,tenantId,origin:canonical?'composed':'legacy-migration',sourceUpdatedAt,updatedAt:sourceUpdatedAt,data};
   },
   async put(tenantId,next){return conditionalPut(store,keyFor(tenantId,PORTAL_LAYERS.LEGACY),{...next,origin:PORTAL_LAYERS.LEGACY});},
   async putLegacy(tenantId,next){return conditionalPut(store,keyFor(tenantId,PORTAL_LAYERS.LEGACY),{...next,origin:PORTAL_LAYERS.LEGACY});},
   async putCanonical(tenantId,next){return conditionalPut(store,keyFor(tenantId,PORTAL_LAYERS.CANONICAL),{...next,origin:PORTAL_LAYERS.CANONICAL});}
 });
}
