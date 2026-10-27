import {getUser} from '@netlify/identity';
import {createPortalForecastHandler} from '../../platform/api/portal-forecast-handler.mjs';
import {createSupabasePortalProjectionStore} from './_portal-supabase-store.mjs';
const store=createSupabasePortalProjectionStore();
const handler=createPortalForecastHandler({getUser,getCanonical:tenantId=>store.getValidatedFinancialForecasts(tenantId)});
export default async request=>handler(request);
export const config={path:'/api/portal-forecasts'};
