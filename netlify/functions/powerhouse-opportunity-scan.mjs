import {defaultOpportunitySources,externalSignalFromItem,opportunitySourcesFromEnv,parseExternalFeed} from './_powerhouse-opportunity-sources.mjs';

const clean=value=>String(value??'').trim();
const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store'}});
const bounded=(value,min,max,fallback)=>Math.max(min,Math.min(max,Number.isFinite(Number(value))?Number(value):fallback));

async function fetchWithTimeout(url,timeoutMs=9000){
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{return await fetch(url,{headers:{accept:'application/rss+xml, application/xml, application/json, text/xml;q=0.9, */*;q=0.5','user-agent':'Bedrijfsgeheugen-Powerhouse-OpportunityScanner/1.0'},signal:controller.signal});}
  finally{clearTimeout(timer)}
}

function configuredSources(){
  const raw=clean(process.env.POWERHOUSE_OPPORTUNITY_SOURCES_JSON);
  return raw?opportunitySourcesFromEnv(raw):defaultOpportunitySources();
}

export function createOpportunityScanner({fetchImpl=fetch,now=()=>new Date(),sources=configuredSources()}={}){
  return async function run(){
    const coreUrl=clean(process.env.POWERHOUSE_CORE_URL).replace(/\/$/,'');
    const token=clean(process.env.POWERHOUSE_OPPORTUNITY_SCAN_TOKEN);
    if(!coreUrl||!token)return {ok:false,error:'OPPORTUNITY_SCANNER_NOT_CONFIGURED',sources:0,accepted:0,failed:0};
    const maxPerSource=bounded(process.env.POWERHOUSE_OPPORTUNITY_MAX_PER_SOURCE,1,12,6);
    const maxSignals=bounded(process.env.POWERHOUSE_OPPORTUNITY_MAX_SIGNALS,1,60,30);
    const sourceResults=[]; let accepted=0,failed=0,attempted=0;
    for(const source of sources){
      if(attempted>=maxSignals)break;
      if(!clean(source?.url)){sourceResults.push({id:source.id,mode:source.ingestMode||'native-event',skipped:true});continue;}
      try{
        const response=fetchImpl===fetch?await fetchWithTimeout(source.url):await fetchImpl(source.url);
        if(!response.ok)throw new Error(`SOURCE_HTTP_${response.status}`);
        const body=await response.text();
        const items=parseExternalFeed(body,response.headers?.get?.('content-type')||'').slice(0,maxPerSource);
        let sourceAccepted=0,sourceFailed=0;
        for(const item of items){
          if(attempted>=maxSignals)break; attempted++;
          const signal=externalSignalFromItem(item,source,now());
          if(!signal.topic){sourceFailed++;failed++;continue;}
          try{
            const ingest=await fetchImpl(`${coreUrl}/opportunity-signals`,{method:'POST',headers:{'content-type':'application/json','x-powerhouse-token':token},body:JSON.stringify({signal})});
            const payload=await ingest.json().catch(()=>({}));
            if(!ingest.ok||payload?.ok===false)throw new Error(`INGEST_HTTP_${ingest.status}:${payload?.error||'unknown'}`);
            sourceAccepted++;accepted++;
          }catch(error){sourceFailed++;failed++;}
        }
        sourceResults.push({id:source.id,type:source.type,items:items.length,accepted:sourceAccepted,failed:sourceFailed});
      }catch(error){failed++;sourceResults.push({id:source.id,type:source.type,accepted:0,failed:1,error:String(error?.message||error).slice(0,180)});}
    }
    return {ok:accepted>0||failed===0,at:now().toISOString(),sources:sourceResults.length,attempted,accepted,failed,sourceResults};
  };
}

export default async request=>{
  if(request?.method&&request.method!=='GET'&&request.method!=='POST')return new Response('Method Not Allowed',{status:405,headers:{allow:'GET, POST'}});
  const result=await createOpportunityScanner()();
  return json(result,result.ok?200:503);
};

export const config={schedule:'@hourly'};
