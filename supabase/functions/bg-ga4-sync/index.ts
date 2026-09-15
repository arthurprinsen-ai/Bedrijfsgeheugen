// Legacy GA4 route permanently disabled. Canonical collector: bg-analytics-sync-composio.
const json=(body:unknown,status=410)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
Deno.serve(async(req:Request)=>{
  if(req.method!=='POST') return json({ok:false,error:'POST_ONLY'},405);
  return json({ok:false,error:'DEPRECATED',canonical_collector:'bg-analytics-sync-composio',contract:'powerhouse-data-intake-learning-spine-v1'},410);
});
