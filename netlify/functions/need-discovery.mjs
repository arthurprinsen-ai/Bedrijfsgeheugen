import { captureCommercialLead } from './_commercial-lead.mjs';
import { buildNeedDiscoveryContext } from '../../brain/revenue/need-discovery.mjs';

const clean=(value,max=500)=>String(value??'').replace(/[\r\n\t]+/g,' ').trim().slice(0,max);
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});

export default async req=>{
  if(req.method!=='POST')return json({ok:false,error:'method-not-allowed'},405);
  let body={};try{body=await req.json();}catch{return json({ok:false,error:'invalid-json'},400)}
  const email=clean(body.email,254).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({ok:false,error:'invalid-email'},400);
  const context=buildNeedDiscoveryContext({
    desired_result:clean(body.desired_result),
    current_approach:clean(body.current_approach),
    problem_example:clean(body.problem_example),
    business_impact:clean(body.business_impact),
    urgency:clean(body.urgency),
    success_metric:clean(body.success_metric),
    decision_process:clean(body.decision_process),
    employee_count:body.employee_count,
    solution_cadence:clean(body.solution_cadence,20)
  },'website');
  const key=clean(body.idempotencyKey,160)||`need-discovery:${email}:${new Date().toISOString().slice(0,10)}`;
  const result=await captureCommercialLead({
    email,idempotencyKey:key,attributionRootKey:key,source:'website-need-discovery',
    canonical:'https://www.bedrijfsgeheugen.nl/behoeftecheck',metadata:{need_discovery:context}
  });
  return json({ok:result.captured,lead_id:result.lead_id||null,deduped:Boolean(result.deduped),profile:{
    stage:context.stage,stageLabel:context.stageLabel,nextQuestion:context.nextQuestion,
    offerEligibility:context.offerEligibility,recommendedOffer:context.recommendedOffer,mayPitch:context.mayPitch
  }},result.captured?200:502);
};
export const config={path:'/api/need-discovery'};
