import { projectCanonicalObject,PORTAL_LAYERS } from './portal-projection-layers.mjs';
import { sanitizePortalProjection } from './portal-server-state.mjs';

export function createCanonicalPortalProjector({store,actorId='brain-projector',now=()=>new Date().toISOString()}={}){
 if(!store?.getLayer||!store?.putCanonical)throw new TypeError('canonical projector requires layered store');
 return Object.freeze({
   async project(canonicalObject){
     if(!canonicalObject?.tenantId)throw new TypeError('canonical object tenantId is required');
     const current=await store.getLayer(canonicalObject.tenantId,PORTAL_LAYERS.CANONICAL);
     const data=projectCanonicalObject(current?.data||{},canonicalObject);
     const projection=sanitizePortalProjection(data,{tenantId:canonicalObject.tenantId,userId:actorId,origin:PORTAL_LAYERS.CANONICAL,now});
     const result=await store.putCanonical(canonicalObject.tenantId,projection);
     return Object.freeze({objectId:canonicalObject.id,tenantId:canonicalObject.tenantId,stored:Boolean(result?.stored),stale:Boolean(result?.stale),sourceUpdatedAt:(result?.record||projection).sourceUpdatedAt});
   }
 });
}
