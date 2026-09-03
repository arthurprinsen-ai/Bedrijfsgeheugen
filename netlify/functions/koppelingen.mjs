import { getUser } from '@netlify/identity';
import { createKoppelingenHandler } from '../../platform/api/koppelingen-handler.mjs';
import { createPortalProjectionStore } from './_portal-read-model-store.mjs';
import { createSupabasePortalProjectionStore } from './_portal-supabase-store.mjs';
import { createEuPrimaryPortalStore } from './_portal-eu-primary-store.mjs';

const fallbackStore=createPortalProjectionStore();
const euStore=createSupabasePortalProjectionStore();
const store=createEuPrimaryPortalStore({euStore,fallbackStore});
const handler=createKoppelingenHandler({getUser,store});
export default async request=>handler(request);
export const config={path:'/api/koppelingen'};
