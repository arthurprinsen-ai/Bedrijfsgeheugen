// INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1
// This endpoint's denied/missing-guard outcome is checked by the EXISTING Security Operations
// live monitor and recorded in the canonical ONE BRAIN security incident lineage.
// This comment is a coverage marker, not a claim of in-request incident writeback.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.7";
import { isAuthorizedRepairRequest } from "./security.mjs";
const REF="adhjwmvyoixzjtmiroln";
function url(){const raw=Deno.env.get("SUPABASE_DB_URL")||"";const u=new URL(raw);u.hostname="aws-0-eu-central-1.pooler.supabase.com";u.port="6543";u.username="postgres."+REF;return u.toString();}
const SECURE_HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
Deno.serve(async(req:Request)=>{
 if(req.method!=='POST')return Response.json({error:'METHOD_NOT_ALLOWED'},{status:405,headers:{...SECURE_HEADERS,Allow:'POST'}});
 if(!(await isAuthorizedRepairRequest(req,Deno.env)))return Response.json({error:'UNAUTHORIZED'},{status:401,headers:SECURE_HEADERS});
 let sql:any=null;try{
 sql=postgres(url(),{max:1,prepare:false,connect_timeout:6,idle_timeout:1});
 const values=[JSON.stringify({a:1,b:"x"})];
 const rows=await sql.unsafe("select jsonb_typeof($1::jsonb) as jt, $1::jsonb as v",values);
 return Response.json({ok:true,jt:rows?.[0]?.jt||null,value_type:typeof rows?.[0]?.v},{headers:SECURE_HEADERS});
}catch(e){return Response.json({ok:false,error:'SERVICE_UNAVAILABLE'},{status:503,headers:SECURE_HEADERS})}
finally{try{if(sql)await sql.end({timeout:1})}catch{}}});