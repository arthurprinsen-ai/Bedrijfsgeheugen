import { aggregateContentPerformance } from '../../tools/content-growth/aggregate.mjs';
import { buildLearningContext } from '../../tools/content-growth/learning.mjs';
import policy from '../../config/content-growth-policy.json' with { type: 'json' };

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'public, max-age=300, s-maxage=300','content-type':'application/json; charset=utf-8'}});
function env(name){return Netlify.env.get(name)||'';}

async function fetchOpportunityContext(){
  const core=env('POWERHOUSE_CORE_URL').replace(/\/$/,'');
  const token=env('POWERHOUSE_CONTENT_CONTEXT_TOKEN');
  if(!core||!token)return{items:[],state:'unconfigured'};
  try{
    const response=await fetch(`${core}/opportunities?status=open&limit=25`,{headers:{'x-powerhouse-token':token},signal:AbortSignal.timeout(5000)});
    if(!response.ok)return{items:[],state:`http_${response.status}`};
    const payload=await response.json();
    return{items:Array.isArray(payload?.items)?payload.items:[],state:'fresh'};
  }catch(error){return{items:[],state:String(error?.name||'failed')};}
}

export default async function handler(request){
  if(request.method!=='GET')return new Response('Method Not Allowed',{status:405,headers:{allow:'GET','cache-control':'no-store'}});
  const base=env('BG_PORTAL_EU_SUPABASE_URL').replace(/\/$/,'');
  const token=env('BG_PORTAL_EU_SERVICE_TOKEN');
  if(!base||!token)return json({error:'CONTENT_LEARNING_UNCONFIGURED'},503);
  try{
    const [response,opportunities]=await Promise.all([
      fetch(`${base}/functions/v1/growth-datahub-ingest`,{method:'POST',headers:{'content-type':'application/json','x-bg-service-token':token},body:JSON.stringify({action:'learning_export',limit:5000}),signal:AbortSignal.timeout(5000)}),
      fetchOpportunityContext()
    ]);
    if(!response.ok)return json({error:'CONTENT_LEARNING_SOURCE_FAILED',status:response.status},502);
    const source=await response.json();
    const performance=aggregateContentPerformance(Array.isArray(source?.events)?source.events:[],policy);
    const learning=buildLearningContext({performance,now:new Date(),policy});
    return json({...learning,opportunity_candidates:opportunities.items,opportunity_state:opportunities.state,source_counts:source?.counts||{},source_system:'supabase:growth-datahub+powerhouse-opportunities'});
  }catch(error){return json({error:'CONTENT_LEARNING_FAILED',detail:String(error?.name||'error')},502);}
}

export const config={path:'/api/content-learning'};