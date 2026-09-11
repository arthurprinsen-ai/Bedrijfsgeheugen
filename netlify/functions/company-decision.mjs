import {getUser} from '@netlify/identity';
import adapterContract from '../../config/brain-platform-adapters.json' with {type:'json'};
import {createOperatingLoopStore} from '../../brain/operating-loop/store.mjs';
import {createRemoteRecordAdapter} from '../../brain/operating-loop/remote-record-adapter.mjs';
import {createCompanyDecisionHandler} from '../../platform/api/company-decision-handler.mjs';

const authorityUrl=()=>String(Netlify.env.get('BRAIN_OPERATING_AUTHORITY_URL')||'').trim();

export default async request=>{
  const authorization=request.headers.get('authorization')||'';
  if(!/^Bearer\s+.+/i.test(authorization)) return Response.json({error:'UNAUTHENTICATED'},{status:401,headers:{'cache-control':'private, no-store'}});
  let store;
  try{
    store=createOperatingLoopStore(createRemoteRecordAdapter({baseUrl:authorityUrl(),authorization}),{adapterContract});
  }catch(error){
    return Response.json({error:error?.message||'BRAIN_OPERATING_AUTHORITY_UNAVAILABLE'},{status:503,headers:{'cache-control':'private, no-store'}});
  }
  return createCompanyDecisionHandler({getUser:()=>getUser(),store})(request);
};

export const config={path:'/api/company-decision'};
