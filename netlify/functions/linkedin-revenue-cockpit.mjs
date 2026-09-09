import { basicAuthMatches } from '../../platform/linkedin-revenue-cockpit.mjs';
import { getPowerhouseActions, getPowerhouseLearning, getPowerhouseHealth } from './_powerhouse-core-client.mjs';
import { buildPowerhouseProjection } from './powerhouse-current-projection.mjs';

const secureHeaders={
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'private, no-store, max-age=0',
  'Pragma':'no-cache',
  'X-Robots-Tag':'noindex, nofollow, noarchive',
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'DENY',
  'Referrer-Policy':'no-referrer'
};
const response=(statusCode,payload,extraHeaders={})=>({statusCode,headers:{...secureHeaders,...extraHeaders},body:JSON.stringify(payload)});

function learningToRecommendations(items=[]){
  return items
    .filter(item=>item?.topic_key&&item?.status!=='rejected')
    .map(item=>({
      id:item.learning_id,
      topicKey:item.topic_key,
      contentKey:item.content_key||'',
      targetChannel:item.channel||'cross-channel',
      priority:Math.max(0,Math.min(100,50+Number(item?.effect?.priority_delta||0)*Number(item.confidence||0))),
      reason:item.hypothesis||'',
      evidence:item.evidence||{},
      confidence:Number(item.confidence||0),
      sampleSize:Number(item.sample_size||1),
    }))
    .sort((a,b)=>b.priority-a.priority)
    .slice(0,10);
}

function legacyLaneShape(projection){
  const compact=item=>({
    id:item.id,
    actionId:item.actionId,
    person:item.personKey,
    company:item.companyKey,
    linkedinUrl:item.sourceUrl,
    sourceUrl:item.sourceUrl,
    channel:item.channel,
    whyNow:item.whyNow,
    nextAction:item.nextAction,
    readyText:item.readyText,
    contextState:item.readyText?'ready':'context_required',
    score:item.priority,
    confidence:Number(item?.evidence?.confidence||0),
    expectedValue:item.expectedValue,
    source:'powerhouse-core',
    topicKey:item.topicKey,
    contentKey:item.contentKey,
  });
  const today=projection.today.map(compact);
  return {
    today,
    inbox:projection.dm.map(compact),
    connections:projection.connections.map(compact),
    posts:projection.feed.map(compact),
    followUp:today.filter(x=>!['LinkedIn DM','LinkedIn commentaar'].includes(x.channel)),
    revenue:today.filter(x=>x.expectedValue>0),
    content:projection.content,
    learning:projection.learning,
  };
}

export async function handler(event){
  if(event.httpMethod==='OPTIONS')return response(204,{});
  if(event.httpMethod!=='GET')return response(405,{status:'METHOD_NOT_ALLOWED'},{Allow:'GET'});

  const user=process.env.INTERN_GEBRUIKER||'';
  const password=process.env.INTERN_WACHTWOORD||'';
  const authorization=event.headers?.authorization||event.headers?.Authorization||'';
  if(!basicAuthMatches(authorization,user,password))return response(401,{status:'UNAUTHORIZED'},{'WWW-Authenticate':'Basic realm="Intern - Bedrijfsgeheugen", charset="UTF-8"'});

  try{
    const [healthResult,actionsResult,learningResult]=await Promise.all([
      getPowerhouseHealth(),
      getPowerhouseActions(15),
      getPowerhouseLearning(),
    ]);
    if(!healthResult?.ok||healthResult?.unifiedCore!==true||healthResult?.makeCriticalPath!==false)throw new Error('UNIFIED_CORE_NOT_HEALTHY');
    const actions=Array.isArray(actionsResult?.items)?actionsResult.items:[];
    const learning=Array.isArray(learningResult?.items)?learningResult.items:[];
    const projection=buildPowerhouseProjection({actions,recommendations:learningToRecommendations(learning),learning,health:healthResult});
    const lanes=legacyLaneShape(projection);
    return response(200,{
      schemaVersion:'linkedin-revenue-cockpit-v2-unified-core',
      generatedAt:new Date().toISOString(),
      status:'READY',
      runtime:'powerhouse-unified-revenue-growth-core',
      makeCriticalPath:false,
      maxActions:15,
      sourceHealth:{powerhouseCore:{ok:true},notion:{ok:true,mode:'adapter'},social:{ok:true,mode:'adapter'},blogSeo:{ok:true,mode:'adapter'}},
      summary:{today:projection.summary.today,waitingOnMe:projection.summary.dm,groundedPosts:projection.summary.feed,sendReady:projection.today.filter(x=>x.readyText).length,contextRequired:projection.today.filter(x=>!x.readyText).length,content:projection.summary.content},
      lanes,
      projection,
    });
  }catch(error){
    return response(503,{status:'UNIFIED_CORE_UNAVAILABLE',reason:String(error?.message||error),makeCriticalPath:false,sourceHealth:{powerhouseCore:{ok:false}}});
  }
}
