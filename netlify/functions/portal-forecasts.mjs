import {getUser} from '@netlify/identity';
import {createPortalForecastHandler} from '../../platform/api/portal-forecast-handler.mjs';
import {createSupabasePortalProjectionStore} from './_portal-supabase-store.mjs';
import {PORTAL_LAYERS} from '../../platform/read-models/portal-projection-layers.mjs';
const store=createSupabasePortalProjectionStore();
const handler=createPortalForecastHandler({getUser,getCanonical:tenantId=>store.getLayer(tenantId,PORTAL_LAYERS.CANONICAL)});
export default async request=>handler(request);
export const config={path:'/api/portal-forecasts'};
