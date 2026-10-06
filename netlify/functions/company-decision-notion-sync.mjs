import {getUser} from '@netlify/identity';
import adapterContract from '../../config/brain-platform-adapters.json' with {type:'json'};
import {resolveIdentityTenant} from '../../platform/read-models/portal-server-state.mjs';
import {createOperatingLoopStore} from '../../brain/operating-loop/store.mjs';
import {createRemoteRecordAdapter} from '../../brain/operating-loop/remote-record-adapter.mjs';
import {createNotionCompanyWriter} from '../../brain/adapters/notion-company-writer.mjs';
import {syncCompanyDecisionsToNotion} from '../../brain/adapters/company-decision-notion.mjs';
import {createNotionCompanySyncHandler} from '../../platform/api/notion-company-sync-handler.mjs';

const env=name=>String(Netlify.env.get(name)||'').trim();
const boundedInt=(name,fallback,min,max)=>{
  const value=Number(env(name));
  return Math.max(min,Math.min(max,Number.isFinite(value)?Math.floor(value):fallback));
};
const authorityUrl=()=>env('BRAIN_OPERATING_AUTHORITY_URL');

export default async request=>{
  const authorization=request.headers.get('authorization')||'';
  if(!/^Bearer\s+.+/i.test(authorization)) return Response.json({status:'UNAUTHENTICATED',error:'UNAUTHENTICATED'},{status:401,headers:{'cache-control':'private, no-store'}});
  let store;
  try{
    store=createOperatingLoopStore(createRemoteRecordAdapter({baseUrl:authorityUrl(),authorization}),{adapterContract});
  }catch(error){
    return Response.json({status:'BLOCKED',error:error?.message||'BRAIN_OPERATING_AUTHORITY_UNAVAILABLE'},{status:503,headers:{'cache-control':'private, no-store'}});
  }
  const sync=async projection=>{
    const writer=createNotionCompanyWriter({
      token:env('NOTION_TOKEN'),
      databaseId:env('NOTION_COMPANY_DECISIONS_DATABASE_ID')||env('NOTION_DATABASE_ID'),
      notionVersion:env('NOTION_API_VERSION')||'2022-06-28',
      maxRetries:boundedInt('NOTION_RETRY_ATTEMPTS',2,0,4),
      prefetchBatchSize:boundedInt('NOTION_PREFETCH_BATCH_SIZE',25,1,50),
      prefetchConcurrency:boundedInt('NOTION_PREFETCH_CONCURRENCY',2,1,3)
    });
    return syncCompanyDecisionsToNotion(projection,{writer,concurrency:boundedInt('NOTION_SYNC_CONCURRENCY',3,1,6)});
  };
  const handler=createNotionCompanySyncHandler({getUser:()=>getUser(),resolveTenant:resolveIdentityTenant,store,sync});
  return handler(request);
};

export const config={path:'/api/company-decision-notion-sync'};
