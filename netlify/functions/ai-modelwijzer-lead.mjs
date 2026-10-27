import { captureCommercialLead } from './_commercial-lead.mjs';

function clean(value,max=160){return String(value||'').replace(/[\r\n\t]/g,' ').trim().slice(0,max);}
export default async (req)=>{
  if(req.method!=='POST') return new Response(JSON.stringify({ok:false,error:'method-not-allowed'}),{status:405,headers:{'content-type':'application/json'}});
  let body={}; try{body=await req.json();}catch{return new Response(JSON.stringify({ok:false,error:'invalid-json'}),{status:400,headers:{'content-type':'application/json'}});}
  const email=clean(body.email,254).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return new Response(JSON.stringify({ok:false,error:'invalid-email'}),{status:400,headers:{'content-type':'application/json'}});
  const model=clean(body.model,80).replace(/[^a-zA-Z0-9._-]/g,'');
  const goal=clean(body.goal,120);
  const key=clean(body.idempotencyKey,120)||`ai-modelwijzer:${email}:${model}`;
  const result=await captureCommercialLead({
    email,
    idempotencyKey:key,
    attributionRootKey:key,
    source:`ai-modelwijzer:${model||'unknown'}`,
    canonical:'https://www.bedrijfsgeheugen.nl/ai-modelwijzer'
  });
  return new Response(JSON.stringify({ok:result.captured,lead_id:result.lead_id||null,deduped:result.deduped||false,goal_received:Boolean(goal)}),{status:result.captured?200:502,headers:{'content-type':'application/json','cache-control':'no-store'}});
};
export const config={path:'/api/ai-modelwijzer-lead'};
