import "jsr:@supabase/functions-js/edge-runtime.d.ts";
Deno.serve(()=>Response.json({ok:false,retired:true,status:"RETIRED_DIAGNOSTIC",database_probe_performed:false},{status:410,headers:{"cache-control":"no-store"}}));
