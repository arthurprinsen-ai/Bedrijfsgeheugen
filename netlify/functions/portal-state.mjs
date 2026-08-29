import { getUser } from '@netlify/identity';
import { createPortalStateHandler } from '../../platform/api/portal-state-handler.mjs';
import { createPortalProjectionStore } from './_portal-read-model-store.mjs';

const handler=createPortalStateHandler({getUser,store:createPortalProjectionStore()});
export default async request=>handler(request);
export const config={path:'/api/portal-state'};
