import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(()=>new Response(JSON.stringify({
  ok:true,
  retired:true,
  status:"RETIRED_DIAGNOSTIC",
  database_probe_performed:false,
  replacement:"commercial-heartbeat-and-runtime-readback"
}),{
  status:200,
  headers:{
    "content-type":"application/json",
    "cache-control":"public, max-age=3600"
  }
}));
