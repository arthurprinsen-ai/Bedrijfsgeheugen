import { aggregateContentPerformance } from '../../tools/content-growth/aggregate.mjs';
import { buildLearningContext } from '../../tools/content-growth/learning.mjs';
import policy from '../../config/content-growth-policy.json' with { type: 'json' };

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'public, max-age=300, s-maxage=300','content-type':'application/json; charset=utf-8'}});
function env(name){return Netlify.env.get(name)||'';}

async function fetchStore(base,token,action){
  const response=await fetch(`${base}/functions/v1/revenue-learning-store`,{method:'POST',headers:{'content-type':'application/json','x-bg-service-token':token},body:JSON.stringify({action,tenantId:'canonical'}),signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw new Error(`REVENUE_LEARNING_SOURCE_${response.status}`);
  return response.json();
}

export default async function handler(request){
  if(request.method!=='GET')return new Response('Method Not Allowed',{status:405,headers:{allow:'GET','cache-control':'no-store'}});
  const base=env('BG_PORTAL_EU_SUPABASE_URL').replace(/\/$/,'');
  const token=env('BG_PORTAL_EU_SERVICE_TOKEN');
  if(!base||!token)return json({error:'CONTENT_LEARNING_UNCONFIGURED'},503);
  try{
    const [growthResponse,revenue]=await Promise.all([
      fetch(`${base}/functions/v1/growth-datahub-ingest`,{method:'POST',headers:{'content-type':'application/json','x-bg-service-token':token},body:JSON.stringify({action:'learning_export',limit:5000}),signal:AbortSignal.timeout(5000)}),
      fetchStore(base,token,'list_current_learnings')
    ]);
    if(!growthResponse.ok)return json({error:'CONTENT_LEARNING_SOURCE_FAILED',status:growthResponse.status},502);
    const source=await growthResponse.json();
    const performance=aggregateContentPerformance(Array.isArray(source?.events)?source.events:[],policy);
    const learning=buildLearningContext({performance,now:new Date(),policy});
    const revenueLearnings=(Array.isArray(revenue?.learnings)?revenue.learnings:[]).filter(x=>String(x?.status||'').toUpperCase()==='PROVEN');
    return json({...learning,revenue_learnings:revenueLearnings,source_counts:source?.counts||{},source_system:'supabase:growth-datahub+revenue-learning'});
  }catch(error){return json({error:'CONTENT_LEARNING_FAILED',detail:String(error?.message||error?.name||'error')},502);}
}

export const config={path:'/api/content-learning'};
