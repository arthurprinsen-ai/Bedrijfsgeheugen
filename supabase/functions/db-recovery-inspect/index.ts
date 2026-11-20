// INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1
// Security incidents and failed recovery operations must remain in the existing
// canonical Brain/Powerhouse incident lineage; never disclose credentials in logs.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.7";
import { isAuthorizedRepairRequest, matchesPrivateRecoveryToken } from "./security.mjs";
const REF="adhjwmvyoixzjtmiroln", POOLER="aws-0-eu-central-1.pooler.supabase.com";
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});
Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return json({ok:false,error:"METHOD_NOT_ALLOWED"},405);
  if(!(await isAuthorizedRepairRequest(req,Deno.env)) && !(await matchesPrivateRecoveryToken(req.headers.get("x-recovery-token")||"",Deno.env))) return json({ok:false,error:"UNAUTHORIZED"},401);
  const direct=Deno.env.get("SUPABASE_DB_URL")||""; let password=""; try{password=decodeURIComponent(new URL(direct).password)}catch{}
  if(!password)return json({ok:false,error:"DB_PASSWORD_MISSING"},500);
  const body=await req.json().catch(()=>({})); const action=String(body?.action||"inspect");
  const sql=postgres({host:POOLER,port:5432,database:"postgres",username:"postgres."+REF,password,ssl:"require",max:1,prepare:false,connect_timeout:30,idle_timeout:1,max_lifetime:60});
  try{
    const before=await sql`
      select pid,usename,application_name,state,wait_event_type,wait_event,backend_start,query_start,
             extract(epoch from(now()-coalesce(query_start,backend_start)))::int age_seconds
      from pg_stat_activity
      where application_name like 'PostgREST%'
      order by backend_start
    `;
    if(action!=="recycle_postgrest") return json({ok:true,action,before});
    const terminated=await sql`
      select pid, pg_terminate_backend(pid) as terminated
      from pg_stat_activity
      where application_name like 'PostgREST%' and pid<>pg_backend_pid()
    `;
    await sql`select pg_notify('pgrst','reload config')`;
    return json({ok:true,action,before,terminated,reload_notified:true});
  }catch(e){return json({ok:false,error:"POSTGREST_RECOVERY_FAILED"},503)}
  finally{try{await sql.end({timeout:1})}catch{}}
});