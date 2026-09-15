function env(name){return Netlify.env.get(name)||'';}
function endpoint(slug){const base=env('BG_PORTAL_EU_SUPABASE_URL').replace(/\/$/,'');return base?`${base}/functions/v1/${slug}`:'';}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function postEdge(payload){
  const url=endpoint('powerhouse-scan-ingest');const token=env('BG_PORTAL_EU_SERVICE_TOKEN');
  if(!url||!token) return json({error:'SERVER_CONFIG'},503);
  const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json','x-bg-service-token':token},body:JSON.stringify(payload)});
  const text=await response.text();
  return new Response(text,{status:response.status,headers:{'content-type':'application/json','cache-control':'no-store'}});
}
export default async request=>{
  if(request.method==='GET') return postEdge({action:'health'});
  if(request.method!=='POST') return json({error:'METHOD_NOT_ALLOWED'},405);
  const length=Number(request.headers.get('content-length')||0);if(length>131072)return json({error:'PAYLOAD_TOO_LARGE'},413);
  let body;try{body=await request.json()}catch{return json({error:'INVALID_JSON'},400)}
  if(body?.website) return json({ok:true,ignored:true});
  return postEdge(body);
};
export const config={path:'/api/powerhouse-scan-ingest'};
