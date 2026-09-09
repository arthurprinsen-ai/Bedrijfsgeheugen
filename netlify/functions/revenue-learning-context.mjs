import {timingSafeEqual} from 'node:crypto';
import {createRevenueLearningStore} from './_revenue-learning-store.mjs';

const match=(a,b)=>{if(!a||!b)return false;const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);};
const json=(body,status=200,headers={})=>Response.json(body,{status,headers:{'cache-control':'no-store',...headers}});

export function createRevenueLearningContextHandler({store,serviceToken=process.env.BG_SOCIAL_LEARNING_SERVICE_TOKEN||process.env.BG_PORTAL_EU_SERVICE_TOKEN,now=()=>new Date()}={}){
  return async request=>{
    if(!match(request.headers.get('x-bg-service-token'),serviceToken))return json({error:'UNAUTHORIZED'},401);
    const active=store||createRevenueLearningStore();
    if(request.method==='GET'){
      try{
        const all=await active.listCurrentLearnings();
        const learnings=all.filter(l=>l.status==='PROVEN').sort((a,b)=>(Number(b.confidence||0)*Math.abs(Number(b.effectSize||0)))-(Number(a.confidence||0)*Math.abs(Number(a.effectSize||0)))).slice(0,8);
        const projection={version:`revenue-${now().toISOString()}`,generatedAt:now().toISOString(),learnings};
        await active.putProjection(projection);return json(projection);
      }catch(error){
        const fallback=await active.getProjection().catch(()=>null);if(fallback)return json(fallback,200,{'x-bg-projection-stale':'true'});
        return json({error:'REVENUE_LEARNING_CONTEXT_UNAVAILABLE',message:String(error?.message||error)},503);
      }
    }
    if(request.method==='POST'){
      let body;try{body=await request.json();}catch{return json({error:'INVALID_JSON'},400);}
      if(!body?.decisionId||!body?.contentId)return json({error:'INVALID_DECISION'},400);
      const decision={...body,recordedAt:body.recordedAt||now().toISOString()};await active.recordDecision(decision);
      for(const learningId of body.appliedLearningIds||[])await active.recordApplication({applicationId:`${body.decisionId}:${learningId}`,contentId:body.contentId,channel:body.channel||null,learningId,decisionId:body.decisionId,appliedAt:decision.recordedAt,applicationRole:'PRIMARY',verificationStatus:'PENDING'});
      return json({accepted:true,decisionId:body.decisionId,applications:(body.appliedLearningIds||[]).length},202);
    }
    return new Response('Method Not Allowed',{status:405,headers:{allow:'GET, POST'}});
  };
}

export default async request=>createRevenueLearningContextHandler()(request);
export const config={path:'/api/revenue-learning-context'};
