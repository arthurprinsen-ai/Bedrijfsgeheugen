import {getUser} from '@netlify/identity';
import {createPortalProjectHandler} from '../../platform/api/portal-project-handler.mjs';
import {createPortalProjectStore} from './_portal-project-store.mjs';

export default createPortalProjectHandler({getUser,store:createPortalProjectStore()});
export const config={path:'/api/portal-project'};
