const API='https://api.notion.com';
const rich=value=>({rich_text:[{type:'text',text:{content:String(value??'')}}]});
const title=value=>({title:[{type:'text',text:{content:String(value??'')}}]});
const select=value=>value?{select:{name:String(value)}}:{select:null};
const number=value=>({number:Number.isFinite(Number(value))?Number(value):null});
const date=value=>value?{date:{start:String(value)}}:{date:null};

function properties(row){
  return {
    Naam:title(row.title||row.decisionId),
    Fingerprint:rich(row.fingerprint),
    BesluitId:rich(row.decisionId),
    Tenant:rich(row.tenantId),
    Bronwaarheid:select(row.sourceOfTruth),
    Prioriteit:select(row.portfolioBucket),
    Status:select(row.status),
    Eigenaar:rich(row.owner||''),
    Rang:number(row.rank),
    Score:number(row.score),
    Vertrouwen:number(row.confidence),
    VolgendeActie:rich(row.nextAction||''),
    VerwachteWaarde:number(row.expectedValue),
    VerwachteKosten:number(row.expectedCost),
    GerealiseerdeWaarde:number(row.realizedValue),
    GerealiseerdeWinst:number(row.realizedProfit),
    Valuta:select(row.currency),
    Goedkeuring:select(row.approvalState),
    GoedgekeurdDoor:rich(row.approvedBy||''),
    GoedkeuringOp:date(row.approvalOccurredAt),
    LaatsteGebeurtenis:rich(row.lastEvent?.id||''),
    LaatsteGebeurtenisType:select(row.lastEvent?.type||null),
    LaatsteGebeurtenisOp:date(row.lastEvent?.occurredAt||row.lastEvent?.observedAt||null),
    BewijsIds:rich((row.evidenceIds||[]).join(', '))
  };
}

async function parse(response,label){
  if(response.ok) return response.json();
  let detail='';
  try{const body=await response.json();detail=body?.message||body?.code||'';}catch{}
  throw new Error(`${label} failed (${response.status})${detail?`: ${detail}`:''}`);
}

function readFingerprint(page){
  const parts=page?.properties?.Fingerprint?.rich_text;
  if(!Array.isArray(parts))return '';
  return parts.map(part=>String(part?.plain_text??part?.text?.content??'')).join('').trim();
}

function chunks(values,size){
  const out=[];
  for(let index=0;index<values.length;index+=size)out.push(values.slice(index,index+size));
  return out;
}

export function createNotionCompanyWriter({
  token,
  databaseId,
  fetchImpl=globalThis.fetch,
  notionVersion='2022-06-28',
  sleepImpl=ms=>new Promise(resolve=>setTimeout(resolve,ms)),
  maxRetries=2,
  baseRetryMs=250,
  prefetchBatchSize=25,
  prefetchConcurrency=2,
}={}){
  if(!token) throw new TypeError('NOTION_TOKEN is required');
  if(!databaseId) throw new TypeError('NOTION_DATABASE_ID is required');
  if(typeof fetchImpl!=='function') throw new TypeError('fetch implementation is required');
  if(typeof sleepImpl!=='function') throw new TypeError('sleep implementation is required');
  const headers={Authorization:`Bearer ${token}`,'Notion-Version':notionVersion,'Content-Type':'application/json'};
  const retryLimit=Math.max(0,Math.min(4,Number.isFinite(Number(maxRetries))?Math.floor(Number(maxRetries)):2));
  const retryBase=Math.max(50,Number.isFinite(Number(baseRetryMs))?Number(baseRetryMs):250);
  const batchSize=Math.max(1,Math.min(50,Number.isFinite(Number(prefetchBatchSize))?Math.floor(Number(prefetchBatchSize)):25));
  const batchConcurrency=Math.max(1,Math.min(3,Number.isFinite(Number(prefetchConcurrency))?Math.floor(Number(prefetchConcurrency)):2));

  const request=async(url,options,label)=>{
    let response;
    for(let attempt=0;attempt<=retryLimit;attempt++){
      response=await fetchImpl(url,options);
      if(response.ok)return response;
      const retryable=[429,503,529].includes(Number(response.status));
      if(!retryable||attempt===retryLimit)return response;
      const retryAfter=Number(response.headers?.get?.('retry-after'));
      const delay=Number.isFinite(retryAfter)&&retryAfter>0?retryAfter*1000:retryBase*(2**attempt);
      await sleepImpl(delay);
    }
    return response;
  };

  const queryByFingerprint=async fingerprint=>{
    const response=await request(`${API}/v1/databases/${encodeURIComponent(databaseId)}/query`,{
      method:'POST',headers,body:JSON.stringify({filter:{property:'Fingerprint',rich_text:{equals:fingerprint}},page_size:1})
    },'Notion query');
    return parse(response,'Notion query');
  };

  return Object.freeze({
    async prefetch(fingerprints){
      const wanted=[...new Set((fingerprints||[]).map(value=>String(value??'').trim()).filter(Boolean))];
      if(!wanted.length)return new Map();
      const groups=chunks(wanted,batchSize);
      const found=new Map();
      let cursor=0;

      async function worker(){
        while(true){
          const index=cursor++;
          if(index>=groups.length)return;
          const group=groups[index];
          const filters=group.map(fingerprint=>({property:'Fingerprint',rich_text:{equals:fingerprint}}));
          const response=await request(`${API}/v1/databases/${encodeURIComponent(databaseId)}/query`,{
            method:'POST',
            headers,
            body:JSON.stringify({filter:filters.length===1?filters[0]:{or:filters},page_size:100})
          },'Notion prefetch');
          const body=await parse(response,'Notion prefetch');
          for(const page of body?.results||[]){
            const fingerprint=readFingerprint(page);
            if(fingerprint&&group.includes(fingerprint)&&page?.id)found.set(fingerprint,page.id);
          }
        }
      }

      await Promise.all(Array.from({length:Math.min(batchConcurrency,groups.length)},()=>worker()));
      return found;
    },

    async upsert(row,{pageId=null}={}){
      if(!row?.fingerprint||!row?.decisionId) throw new TypeError('Notion row requires fingerprint and decisionId');
      let resolvedPageId=String(pageId||'').trim()||null;
      if(!resolvedPageId){
        const query=await queryByFingerprint(row.fingerprint);
        resolvedPageId=query?.results?.[0]?.id||null;
      }
      const pageProperties=properties(row);
      if(resolvedPageId){
        const updateResponse=await request(`${API}/v1/pages/${encodeURIComponent(resolvedPageId)}`,{method:'PATCH',headers,body:JSON.stringify({properties:pageProperties})},'Notion update');
        const updated=await parse(updateResponse,'Notion update');
        return {ok:true,id:updated.id||resolvedPageId,action:'updated',fingerprint:row.fingerprint};
      }
      const createResponse=await request(`${API}/v1/pages`,{method:'POST',headers,body:JSON.stringify({parent:{database_id:databaseId},properties:pageProperties})},'Notion create');
      const created=await parse(createResponse,'Notion create');
      return {ok:true,id:created.id,action:'created',fingerprint:row.fingerprint};
    }
  });
}
