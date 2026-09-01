import { getUser } from '@netlify/identity';
import adapterContract from '../../config/brain-platform-adapters.json' with { type: 'json' };
import { createOperatingLoopStore } from '../../brain/operating-loop/store.mjs';
import { createRemoteRecordAdapter } from '../../brain/operating-loop/remote-record-adapter.mjs';
import { createOperatingLoopHandler } from '../../platform/api/brain-operating-loop-handler.mjs';

const authorityUrl=()=>String(Netlify.env.get('BRAIN_OPERATING_AUTHORITY_URL')||'').trim();

export default async request=>{
  const authorization=request.headers.get('authorization')||'';
  let store;
  try{
    store=createOperatingLoopStore(createRemoteRecordAdapter({baseUrl:authorityUrl(),authorization}),{adapterContract});
  }catch(error){
    return Response.json({error:error?.message||'BRAIN_OPERATING_AUTHORITY_UNAVAILABLE'},{status:503,headers:{'cache-control':'private, no-store'}});
  }
  const handler=createOperatingLoopHandler({getUser:()=>getUser(),store});
  return handler(request);
};
export const config={path:'/api/brain-operating-loop'};
