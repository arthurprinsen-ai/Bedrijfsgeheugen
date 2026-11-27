import {getUser} from '@netlify/identity';
import {createSupabasePortalProjectionStore} from './_portal-supabase-store.mjs';
import {createPortalSignalStatusHandler} from '../../platform/api/portal-signal-status-handler.mjs';

// Read-only, authenticated, derived-tenant projection of original Heartbeat
// observations. This route cannot send messages or execute customer actions.
export const config={path:'/api/portal-signal-status'};
export default createPortalSignalStatusHandler({
  getUser,storeFactory:()=>createSupabasePortalProjectionStore()
});
