import { timingSafeEqual } from 'node:crypto';
import { createSocialLearningStore } from './_social-learning-store.mjs';

const byValue=(a,b)=>(Number(b.confidence||0)*Math.abs(Number(b.effectSize||0)))-(Number(a.confidence||0)*Math.abs(Number(a.effectSize||0)));
const compact=l=>({learningId:l.learningId,claim:l.claim||'',componentScope:l.componentScope||'',effectMetric:l.effectMetric||'',effectSize:Number(l.effectSize||0),sampleSize:Number(l.sampleSize||0),confidence:Number(l.confidence||0),status:l.status,lastValidatedAt:l.lastValidatedAt||''});
function tokenMatches(actual,expected){if(!actual||!expected)return false;const a=Buffer.from(String(actual));const b=Buffer.from(String(expected));return a.length===b.length&&timingSafeEqual(a,b);}

export function createSocialLearningContextHandler({store,maxLearnings=6,serviceToken=process.env.BG_SOCIAL_LEARNING_SERVICE_TOKEN||process.env.BG_PORTAL_EU_SERVICE_TOKEN,defaultTenantId=process.env.BG_SOCIAL_LEARNING_TENANT_ID||'canonical'}={}){
  return async request=>{
    if(!tokenMatches(request.headers.get('x-bg-service-token'),serviceToken))return Response.json({error:'UNAUTHORIZED'},{status:401,headers:{'cache-control':'no-store'}});
    const activeStore=store||createSocialLearningStore({tenantId:defaultTenantId});
    if(request.method==='GET'){
      const tenantId=new URL(request.url).searchParams.get('tenantId')||defaultTenantId;
      try{
        const learnings=(await activeStore.listCurrentLearnings(tenantId)).filter(l=>l.status==='PROVEN'&&Number(l.confidence||0)>=0.75).sort(byValue).slice(0,maxLearnings).map(compact);
        const projection={version:`social-learning:${new Date().toISOString().slice(0,10)}`,tenantId,learnings};
        try{if(activeStore.putProjection)await activeStore.putProjection(projection);}catch{}
        return Response.json(projection,{headers:{'cache-control':'no-store'}});
      }catch(error){
        const fallback=activeStore.getProjection?await activeStore.getProjection(tenantId).catch(()=>null):null;
        if(fallback)return Response.json({...fallback,stale:true},{headers:{'cache-control':'no-store','x-bg-learning-projection':'last-known-good'}});
        return Response.json({error:'SOCIAL_LEARNING_CONTEXT_FAILED',message:error.message},{status:503,headers:{'cache-control':'no-store'}});
      }
    }
    if(request.method==='POST'){
      let body;try{body=await request.json();}catch{return Response.json({error:'INVALID_DECISION'},{status:400});}
      if(!body?.tenantId||!body?.decisionId||!body?.postId)return Response.json({error:'INVALID_DECISION'},{status:400});
      const saved=await activeStore.recordDecision({...body,recordedAt:new Date().toISOString()});
      if(Array.isArray(body.appliedLearningIds)&&activeStore.recordApplication){
        for(const learningId of body.appliedLearningIds){await activeStore.recordApplication({applicationId:`${body.postId}:${learningId}`,tenantId:body.tenantId,postId:body.postId,learningId,decisionId:body.decisionId,appliedAt:new Date().toISOString(),applicationRole:'PRIMARY',expectedEffect:body.expectedEffects?.[learningId]??null,actualEffect:null,verificationStatus:'PENDING'});}
      }
      return Response.json({accepted:true,decision:saved},{status:202,headers:{'cache-control':'no-store'}});
    }
    return new Response('Method Not Allowed',{status:405,headers:{allow:'GET, POST'}});
  };
}

export default async request=>createSocialLearningContextHandler()(request);
export const config={path:'/api/social-learning-context'};
