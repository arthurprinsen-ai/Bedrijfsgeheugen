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

export function createNotionCompanyWriter({token,databaseId,fetchImpl=globalThis.fetch,notionVersion='2022-06-28'}={}){
  if(!token) throw new TypeError('NOTION_TOKEN is required');
  if(!databaseId) throw new TypeError('NOTION_DATABASE_ID is required');
  if(typeof fetchImpl!=='function') throw new TypeError('fetch implementation is required');
  const headers={Authorization:`Bearer ${token}`,'Notion-Version':notionVersion,'Content-Type':'application/json'};

  return Object.freeze({
    async upsert(row){
      if(!row?.fingerprint||!row?.decisionId) throw new TypeError('Notion row requires fingerprint and decisionId');
      const queryResponse=await fetchImpl(`${API}/v1/databases/${encodeURIComponent(databaseId)}/query`,{
        method:'POST',headers,body:JSON.stringify({filter:{property:'Fingerprint',rich_text:{equals:row.fingerprint}},page_size:1})
      });
      const query=await parse(queryResponse,'Notion query');
      const pageId=query?.results?.[0]?.id||null;
      const pageProperties=properties(row);
      if(pageId){
        const updateResponse=await fetchImpl(`${API}/v1/pages/${encodeURIComponent(pageId)}`,{method:'PATCH',headers,body:JSON.stringify({properties:pageProperties})});
        const updated=await parse(updateResponse,'Notion update');
        return {ok:true,id:updated.id||pageId,action:'updated',fingerprint:row.fingerprint};
      }
      const createResponse=await fetchImpl(`${API}/v1/pages`,{method:'POST',headers,body:JSON.stringify({parent:{database_id:databaseId},properties:pageProperties})});
      const created=await parse(createResponse,'Notion create');
      return {ok:true,id:created.id,action:'created',fingerprint:row.fingerprint};
    }
  });
}
