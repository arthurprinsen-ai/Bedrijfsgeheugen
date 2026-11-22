// Read-only live data panel within ORIGINAL Portal V2 native page shell.
// The server's authenticated per-tenant source readback is the sole authority.
import {CONNECTOR_PORTAL_PAGES} from '../assets/js/koppelingen/portal-routing.js';
const allowed=new Set(CONNECTOR_PORTAL_PAGES.map(x=>x.id));
const create=(name,text='',cls='')=>{
 const e=document.createElement(name);e.textContent=String(text);if(cls)e.className=cls;return e;
};
export function verifiedConnectorRecord(item){
 if(!item||item.truth!=='ACTUAL_TENANT_SOURCE_RECORDS'||item.proofLevel!=='PROVIDER_VERIFIED'
  ||item.provider!=='afas'||typeof item.id!=='string'
  ||!Array.isArray(item.columns)||item.columns.length<1||item.columns.length>40
  ||!Array.isArray(item.rows)||item.rows.length>100||item.rows.length!==item.recordCount
  ||!/^[0-9a-f]{64}$/.test(String(item.sourceHash||'')))return null;
 const cell=v=>v===null||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v)
  ||typeof v==='string'&&v.length<=2000;
 if(item.columns.some(name=>typeof name!=='string'||name.length>80)
  ||item.rows.some(row=>!Array.isArray(row)||row.length!==item.columns.length||row.some(v=>!cell(v))))return null;
 return item;
}
function sourceTable(record){
 const box=create('details','','bg-real-source');box.open=true;
 box.append(create('summary',record.name+' · '+record.recordCount+' bronrijen'));
 const body=create('div','','bg-real-source-body');
 body.append(create('p','AFAS GetConnector '+record.sourceName+' · ingelezen '+String(record.capturedAt||'').slice(0,19)
  +' · providerbewijs en serverreadback. Dit zijn brongegevens, geen automatisch berekende KPI’s.','bg-real-source-note'));
 const wrapper=create('div','','bg-real-source-scroll'),table=create('table');
 table.setAttribute('aria-label','AFAS bronrecords '+record.name);
 const head=create('thead'),headrow=create('tr');
 for(const name of record.columns)headrow.append(create('th',name));
 head.append(headrow);table.append(head);
 const bodyEl=create('tbody');table.append(bodyEl);wrapper.append(table);body.append(wrapper);
 const controls=create('div','','bg-real-source-controls');
 const search=create('input');search.type='search';search.placeholder='Zoek in deze bron';
 search.setAttribute('aria-label','Zoek in '+record.name);
 const prev=create('button','Vorige'),next=create('button','Volgende'),count=create('span');
 prev.type='button';next.type='button';controls.append(search,prev,count,next);body.append(controls);
 let offset=0;const countPerPage=20;
 function paint(){
  const query=search.value.trim().toLocaleLowerCase('nl');
  const rows=query?record.rows.filter(row=>row.some(x=>String(x??'').toLocaleLowerCase('nl').includes(query))):record.rows;
  offset=Math.max(0,Math.min(offset,Math.max(0,Math.ceil(rows.length/countPerPage)-1)*countPerPage));
  bodyEl.replaceChildren();
  for(const item of rows.slice(offset,offset+countPerPage)){
   const tr=create('tr');for(const value of item)tr.append(create('td',value===null?'':String(value)));bodyEl.append(tr);
  }
  if(!rows.length){const tr=create('tr'),td=create('td','Geen rijen gevonden');td.colSpan=record.columns.length;tr.append(td);bodyEl.append(tr);}
  count.textContent=rows.length?(offset+1)+'–'+Math.min(offset+countPerPage,rows.length)+' van '+rows.length:'0 van 0';
  prev.disabled=offset===0;next.disabled=offset+countPerPage>=rows.length;
 }
 search.addEventListener('input',()=>{offset=0;paint();});
 prev.addEventListener('click',()=>{offset-=countPerPage;paint();});
 next.addEventListener('click',()=>{offset+=countPerPage;paint();});
 paint();box.append(body);return box;
}
export async function mountVerifiedConnectorData(container,{pageId,fetchFn=globalThis.fetch}={}){
 if(!container||!allowed.has(pageId)||typeof fetchFn!=='function')return null;
 const url='/api/connectors/page-records?page='+encodeURIComponent(pageId);
 let response,payload;
 try{
  response=await fetchFn(url,{credentials:'same-origin',cache:'no-store',headers:{accept:'application/json'}});
  if(!response?.ok||!container.isConnected)return null;
  payload=await response.json();
 }catch{return null;}
 if(!container.isConnected||payload?.truth!=='ACTUAL_TENANT_SOURCE_RECORDS'||payload?.pageId!==pageId
  ||!Array.isArray(payload.items))return null;
 const records=payload.items.map(verifiedConnectorRecord).filter(Boolean).slice(0,25);
 if(!records.length)return null;
 const root=create('section','','bg-real-source-panel');
 root.dataset.connectorLiveRows='v1';root.setAttribute('aria-label','Echte gegevens uit gekoppelde systemen');
 root.append(create('span','ECHT INGELADEN · GECONTROLEERDE BRON','bg-real-source-kicker'),
  create('h3','Gegevens uit mijn gekoppelde systemen'),
  create('p','Deze rijen komen uit geautoriseerde leveranciersbronnen en zijn teruggelezen uit de organisatiegebonden opslag. Zonder een KPI-definitie worden ze niet als omzet, marge of gerealiseerd effect geteld.'));
 for(const record of records)root.append(sourceTable(record));
 container.prepend(root);
 const boundary=()=>{root.remove();document.removeEventListener('bg:portal-identity-boundary',boundary);};
 document.addEventListener('bg:portal-identity-boundary',boundary,{once:true});
 return root;
}
