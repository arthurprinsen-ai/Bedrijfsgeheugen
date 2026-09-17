import { getUser } from '@netlify/identity';
import { createPortalBusinessInputHandler } from '../../platform/api/portal-business-input-handler.mjs';
import { createPortalProjectionStore } from './_portal-read-model-store.mjs';
import { createSupabasePortalProjectionStore } from './_portal-supabase-store.mjs';
import { createEuPrimaryPortalStore } from './_portal-eu-primary-store.mjs';

const fallbackStore=createPortalProjectionStore();
const euStore=createSupabasePortalProjectionStore();
const store=createEuPrimaryPortalStore({euStore,fallbackStore});
const handler=createPortalBusinessInputHandler({getUser,store});

export default async request=>handler(request);
export const config={path:'/api/portal-business-input'};
