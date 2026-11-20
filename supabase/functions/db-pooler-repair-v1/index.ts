import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.7";
import { isAuthorizedRepairRequest } from "./security.mjs";
const REF="adhjwmvyoixzjtmiroln";
const NO_STORE={"Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8"};
function poolerUrl(){
  const raw=Deno.env.get("SUPABASE_DB_URL")||"";
  const u=new URL(raw);
  u.hostname="aws-0-eu-central-1.pooler.supabase.com";
  u.port="6543";
  u.username="postgres."+REF;
  return u.toString();
}
Deno.serve(async(request:Request)=>{
  // Fail closed before accessing DB connection strings, and never permit GET to
  // run a privileged maintenance command. Internal jobs must use POST+server key.
  if(request.method!=="POST")
    return Response.json({error:"method_not_allowed"},{status:405,headers:{...NO_STORE,Allow:"POST"}});
  if(!(await isAuthorizedRepairRequest(request,Deno.env)))
    return Response.json({error:"unauthorized"},{status:401,headers:NO_STORE});
  let sql:any=null;
  try{
    sql=postgres(poolerUrl(),{max:1,prepare:false,connect_timeout:6,idle_timeout:1});
    const rows=await sql.unsafe("select public.powerhouse_content_closed_loop_tick_v1(now()) as request_id");
    return Response.json({ok:true,request_id:rows?.[0]?.request_id||null},{headers:NO_STORE});
  }catch(_error){
    // Never echo Postgres hostnames, credential details or internal stack traces.
    return Response.json({ok:false,error:"maintenance_unavailable"},{status:503,headers:NO_STORE});
  }finally{
    try{if(sql)await sql.end({timeout:1})}catch{}
  }
});
