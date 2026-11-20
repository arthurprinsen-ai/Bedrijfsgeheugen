
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SITE_ID="fd527056-493a-4d8a-8125-d00370104fa3";
import { isAuthorizedRepairRequest } from "./security.mjs";

async function proxyBase(){
  const url=Deno.env.get("SUPABASE_URL")||"";
  const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(!url||!key) throw new Error("supabase auth unavailable");
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await db.rpc("get_netlify_mcp_proxy_bridge");
  if(error||typeof data!=="string"||!data.startsWith("https://netlify-mcp.netlify.app/proxy/")) throw new Error("netlify proxy unavailable");
  return data.replace(/\/$/,"");
}
async function raw(proxy,path){
  const endpoint=proxy+"/api/v1/sites/"+SITE_ID+"/files/"+path.split("/").map(encodeURIComponent).join("/");
  const res=await fetch(endpoint,{headers:{"Accept":"application/vnd.bitballoon.v1.raw","user-agent":"bg-live-repair-inspector/1"}});
  return {status:res.status,body:await res.text()};
}
Deno.serve(async(req)=>{
  if(req.method!=="POST") return new Response("method not allowed",{status:405});
  if(!(await isAuthorizedRepairRequest(req,Deno.env))) return Response.json({error:"unauthorized"},{status:401,headers:{"Cache-Control":"no-store"}});
  try{
    const proxy=await proxyBase();
    const listRes=await fetch(proxy+"/api/v1/sites/"+SITE_ID+"/files",{headers:{"user-agent":"bg-live-repair-inspector/1"}});
    const files=await listRes.json();
    const wanted=["assets/js/i18n.js","prijzen.html","en/prijzen.html","en/prijzen/index.html","_redirects"];
    const out={list_status:listRes.status,matches:files.filter((f:any)=>wanted.includes(String(f.path||"").replace(/^\//,""))).map((f:any)=>({path:f.path,size:f.size,sha:f.sha})),raw:{} as Record<string,unknown>};
    for(const p of wanted){
      if(out.matches.some((m:any)=>String(m.path||"").replace(/^\//,"")===p)){
        const r=await raw(proxy,p);
        out.raw[p]={status:r.status,body:r.body.slice(0,200000)};
      }
    }
    return Response.json(out,{headers:{"Cache-Control":"no-store"}});
  }catch(e){
    return Response.json({error:"inspection_unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});
  }
});
