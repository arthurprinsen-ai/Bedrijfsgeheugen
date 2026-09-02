import { PORTAL_LAYERS } from '../../platform/read-models/portal-projection-layers.mjs';

export function createEuPrimaryPortalStore({euStore,fallbackStore}={}){
  if(!euStore?.get||!euStore?.put)throw new TypeError('euStore get/put are required');
  return Object.freeze({
    async get(tenantId){
      const primary=await euStore.get(tenantId);
      if(primary)return primary;
      if(!fallbackStore?.get)return null;
      const fallback=await fallbackStore.get(tenantId);
      if(!fallback)return null;
      try{
        if(fallbackStore.getLayer){
          const [legacy,canonical]=await Promise.all([
            fallbackStore.getLayer(tenantId,PORTAL_LAYERS.LEGACY),
            fallbackStore.getLayer(tenantId,PORTAL_LAYERS.CANONICAL)
          ]);
          if(legacy)await euStore.putLegacy(tenantId,legacy);
          if(canonical)await euStore.putCanonical(tenantId,canonical);
          const migrated=await euStore.get(tenantId);
          if(migrated)return migrated;
        }
      }catch{}
      return fallback;
    },
    put:(tenantId,next)=>euStore.put(tenantId,next),
    putLegacy:(tenantId,next)=>euStore.putLegacy(tenantId,next),
    putCanonical:(tenantId,next)=>euStore.putCanonical(tenantId,next),
    getLayer:(tenantId,layer)=>euStore.getLayer?.(tenantId,layer)
  });
}
