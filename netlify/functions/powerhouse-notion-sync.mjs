import { textFromProperty } from '../../platform/linkedin-revenue-cockpit.mjs';
import { ingestPowerhouseEvent } from './_powerhouse-core-client.mjs';

const NOTION_VERSION='2025-09-03';
const CONNECTIONS_SOURCE=process.env.POWERHOUSE_NOTION_CONNECTIONS_SOURCE||'3b2da36a-ac8a-80f1-a78d-000b4766fd4c';

async function queryConnections(token,fetchFn=globalThis.fetch){
  const response=await fetchFn(`https://api.notion.com/v1/data_sources/${CONNECTIONS_SOURCE}/query`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json','Notion-Version':NOTION_VERSION},body:JSON.stringify({page_size:100,filter:{and:[{property:'Prioriteit',select:{equals:'1 — Nu'}},{property:'Bal ligt bij',select:{equals:'Nog niet benaderd'}}]}}),signal:AbortSignal.timeout(9000)});
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(`NOTION_${body?.code||response.status}`);
  return Array.isArray(body.results)?body.results:[];
}

export function notionConnectionToCoreEvent(page={}){
  const p=page.properties||{};
  const name=textFromProperty(p['Naam']);
  const profileUrl=textFromProperty(p['LinkedIn']);
  if(!name||!profileUrl)return null;
  const company=textFromProperty(p['Bedrijf']);
  const role=textFromProperty(p['Functie']);
  const email=textFromProperty(p['E-mail']);
  const phone=textFromProperty(p['Telefoon'])||textFromProperty(p['Mobiel']);
  const reason=textFromProperty(p['Powerhouse reden'])||textFromProperty(p['Waarom nu'])||`${name}${company?` bij ${company}`:''} staat op Prioriteit 1 — Nu.`;
  const expectedValue=Number(textFromProperty(p['Omzetkans'])??textFromProperty(p['Verwachte waarde €'])??0)||0;
  return {
    eventType:'connection_activated',
    source:'notion-connections',
    dedupeKey:`notion:connection:${page.id}:${textFromProperty(p['Laatst contact'])||'current'}`,
    subjectKey:profileUrl,
    personKey:profileUrl,
    personName:name,
    companyKey:company||null,
    company,
    role,
    profileUrl,
    email:email||null,
    phone:phone||null,
    whatsappAllowed:textFromProperty(p['WhatsApp toegestaan'])===true,
    priority:90,
    expectedValue,
    salesStatus:textFromProperty(p['Salesstatus'])||'Te doen',
    powerhouseReason:reason,
    occurredAt:new Date().toISOString(),
    dataQuality:'OBSERVED',
    confidence:0.85,
    evidence:{notionPageId:page.id,priority:'1 — Nu',balance:'Nog niet benaderd',role,company},
  };
}

export async function runNotionSync({token=process.env.NOTION_TOKEN,fetchFn=globalThis.fetch,coreOptions={}}={}){
  if(!token)throw new Error('NOTION_TOKEN_REQUIRED');
  const rows=await queryConnections(token,fetchFn);
  let ingested=0,skipped=0;
  for(const row of rows){
    const event=notionConnectionToCoreEvent(row);
    if(!event){skipped++;continue;}
    await ingestPowerhouseEvent(event,{...coreOptions,fetchFn});
    ingested++;
  }
  return {ok:true,source:'notion',rows:rows.length,ingested,skipped};
}

export default async function handler(input={}){
  const dependencyInjection=input&&typeof input==='object'&&!(input instanceof Request)&&('token' in input||'coreOptions' in input||'fetchFn' in input);
  try{return Response.json(await runNotionSync(dependencyInjection?input:{}),{status:200,headers:{'cache-control':'no-store'}});}catch(error){return Response.json({ok:false,state:'degraded',error:'POWERHOUSE_NOTION_SYNC_FAILED',message:String(error?.message||error)},{status:503,headers:{'cache-control':'no-store'}});}
}

export const config={schedule:'20 */4 * * *'};
