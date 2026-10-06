import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{
  status,
  headers:{"content-type":"application/json","cache-control":"no-store"}
});

Deno.serve((req:Request)=>{
  if(req.method!=="GET")return json({ok:false,error:"GET_ONLY"},405);
  const url=new URL(req.url);
  if(url.searchParams.has("token"))return json({ok:false,error:"TOKEN_QUERY_FORBIDDEN"},400);
  return json({
    ok:false,
    state:"RETIRED",
    error:"RUNTIME_VERIFIER_RETIRED",
    reason:"Public database probes are not a production health authority.",
    authority:[
      "supabase-provider-logs",
      "supabase-management-api",
      "powerhouse-commercial-heartbeat-v1"
    ]
  },410);
});
