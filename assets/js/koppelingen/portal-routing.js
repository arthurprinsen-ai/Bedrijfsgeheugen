// Canonical allowlist of portal destinations. This is routing intent, NOT a data ingestion engine.
export const CONNECTOR_PORTAL_PAGES=Object.freeze([
  Object.freeze({id:'ondernemerscockpit',label:'Mijn overzicht',hint:'Bronstatus en besluitcontext'}),
  Object.freeze({id:'cijfers-maatstaven',label:'Cijfers & KPI’s',hint:'Omzet, kosten en prestaties'}),
  Object.freeze({id:'waarde-financiering',label:'Financiën',hint:'Waarde en financiële inzichten'}),
  Object.freeze({id:'sales-intelligence',label:'Klanten & verkoop',hint:'Leads, orders en klantontwikkeling'}),
  Object.freeze({id:'roadmap',label:'Projecten',hint:'Voortgang en uitvoering'}),
  Object.freeze({id:'datahubstatus',label:'Datahub',hint:'Datakwaliteit en verwerking'}),
  Object.freeze({id:'bronnenstatus',label:'Bronnen',hint:'Herkomst en betrouwbaarheid'}),
  Object.freeze({id:'compliance-governance',label:'Compliance',hint:'Risico en bewijs'}),
  Object.freeze({id:'brain-verwerking',label:'Brein & Powerhouse',hint:'Alleen na geverifieerde broninname en AI-toestemming'})
]);
const PAGE_SET=new Set(CONNECTOR_PORTAL_PAGES.map(page=>page.id));
const FIELD=/^[\p{L}_][\p{L}\p{N}_-]{0,79}$/u;
const fail=()=>{throw Object.assign(new TypeError('INVALID_CONNECTOR_ROUTING'),{code:'INVALID_CONNECTOR_ROUTING'});};
export function normalizeConnectorRouting(routing,documentSchema,dataUse){
 if(routing==null)return Object.freeze({portalPages:Object.freeze([]),selectedFields:Object.freeze([])});
 if(!routing||typeof routing!=='object'||Array.isArray(routing)||Object.keys(routing).some(k=>!['portalPages','selectedFields'].includes(k)))fail();
 const pages=routing.portalPages,fields=routing.selectedFields;
 if(!Array.isArray(pages)||!Array.isArray(fields)||pages.length>9||fields.length>100)fail();
 if(pages.some(id=>typeof id!=='string'||!PAGE_SET.has(id))||new Set(pages).size!==pages.length)fail();
 if(fields.some(id=>typeof id!=='string'||!FIELD.test(id))||new Set(fields).size!==fields.length)fail();
 const available=new Set((documentSchema?.fields||[]).map(field=>typeof field==='string'?field:field?.key).filter(Boolean));
 if(fields.some(field=>!available.has(field)))fail();
 if(dataUse?.mode==='CONNECTION_ONLY'&&pages.length)fail();
 return Object.freeze({portalPages:Object.freeze([...pages]),selectedFields:Object.freeze([...fields])});
}
export function connectorPortalSources(connectors,pageId){
 if(!PAGE_SET.has(pageId))return [];
 return (Array.isArray(connectors)?connectors:[])
  .filter(c=>c?.dataUse?.mode!=='CONNECTION_ONLY'&&Array.isArray(c?.routing?.portalPages)&&c.routing.portalPages.includes(pageId))
  .map(c=>Object.freeze({
    id:String(c.id||''),
    label:String(c.name||'Koppeling').slice(0,100),
    sourceType:String(c.source?.type||'onbekend').slice(0,50),
    state:['Active','Paused','Draft'].includes(c.state)?c.state:'Unknown',
    fields:(Array.isArray(c.routing.selectedFields)?c.routing.selectedFields:[]).filter(x=>typeof x==='string').slice(0,30),
    dataUse:c.dataUse?.mode==='PORTAL_AI'?'PORTAL_AI':'PORTAL_INSIGHTS',
    // Configuration and historical safe-tests are not authenticated actual data ingestion.
    dataStatus:'LIVE_RECORDS_NOT_VERIFIED',
    nextAction:'Echte broninname, opslag en onafhankelijk bronbewijs nodig voordat waarden zichtbaar worden.'
  }));
}
