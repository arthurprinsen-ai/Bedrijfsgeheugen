import { getUser } from '@netlify/identity';
import { getStore } from '@netlify/blobs';
import { randomUUID } from 'node:crypto';
import { createPortalFeedbackHandler } from '../../platform/api/portal-feedback-handler.mjs';

const store=getStore({name:'portal-feedback',consistency:'strong'});
const handler=createPortalFeedbackHandler({getUser,store,uuid:()=>randomUUID()});
export default async request=>handler(request);
export const config={path:'/api/portal-feedback'};
