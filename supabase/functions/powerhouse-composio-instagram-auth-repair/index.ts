// INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1
// Failures belong to the existing canonical Security Operations incident and learning lineage;
// never log credentials, provider configuration, access tokens or stack details.
// SECURITY: server-only authorization must precede ALL provider and database access.
// This recovery inspector was formerly guarded by a static literal in the request header.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { isAuthorizedRepairRequest } from "./security.mjs";

const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const json=(payload:unknown,status=200,more:Record<string,string>={})=>Response.json(payload,{status,headers:{...headers,...more}});

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return json({ok:false,error:"METHOD_NOT_ALLOWED"},405,{allow:"POST"});
  // The legacy fixed x-repair-key is intentionally no longer accepted.
  if(!(await isAuthorizedRepairRequest(req,Deno.env)))return json({ok:false,error:"UNAUTHORIZED"},401);
  try{
    const url=Deno.env.get("SUPABASE_URL")||"";
    const svc=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
    if(!url||!svc)return json({ok:false,error:"SERVICE_UNAVAILABLE"},503);
    const db=createClient(url,svc,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:keyData,error}=await db.rpc("bg_geheim",{p_naam:"COMPOSIO_API_KEY"});
    const key=typeof keyData==="string"?keyData.trim():"";
    if(error||!key)return json({ok:false,error:"SERVICE_UNAVAILABLE"},503);
    const provider=await fetch("https://backend.composio.dev/api/v3.1/toolkits/instagram",{
      headers:{"x-api-key":key,accept:"application/json"},
      signal:AbortSignal.timeout(9000)
    });
    if(!provider.ok)return json({ok:false,status:provider.status,error:"UPSTREAM_UNAVAILABLE"},502);
    const response=await provider.json().catch(()=>null);
    const details=response?.auth_config_details||response?.data?.auth_config_details||response?.toolkit?.auth_config_details||[];
    // Do not return provider credential settings, auth config objects or internal errors.
    return json({ok:true,status:provider.status,auth_config_count:Array.isArray(details)?Math.min(details.length,1000):0});
  }catch{
    return json({ok:false,error:"UPSTREAM_UNAVAILABLE"},503);
  }
});
