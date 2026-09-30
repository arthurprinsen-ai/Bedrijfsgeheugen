import { captureCommercialLead } from './_commercial-lead.mjs';
function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}})}
export default async (req)=>{
  if(req.method!=='POST')return json({ok:false,error:'method_not_allowed'},405);
  let body={};try{body=await req.json()}catch{return json({ok:false,error:'invalid_json'},400)}
  const email=String(body.email||'').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({ok:false,error:'invalid_email'},400);
  const raw=[body.goal,body.priority,body.eu,email].join('|');const bytes=new TextEncoder().encode(raw);
  const digest=await crypto.subtle.digest('SHA-256',bytes);const key=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,32);
  const result=await captureCommercialLead({email,idempotencyKey:'ai-modelwijzer:'+key,attributionRootKey:'ai-modelwijzer:'+key,source:'ai-modelwijzer',canonical:'https://www.bedrijfsgeheugen.nl/ai-modelwijzer'});
  return json({ok:result.captured,lead_id:result.lead_id||null,deduped:result.deduped||false},result.captured?200:503);
};
export const config={path:'/api/ai-model-advisor-lead'};