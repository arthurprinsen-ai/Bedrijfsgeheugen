// Canonical, read-only projection of confirmed customer CSV/XLSX source records.
// No second writer, metric calculation, or new store. A source's reviewed area
// determines where the ORIGINAL saved table appears in Portal V2.
import {findPage} from './page-registry.js';
import {IMPORT_AREAS,IMPORT_DATA_KINDS,IMPORT_ROLES} from './data-import-semantics.js';

export const IMPORT_AREA_PAGE=Object.freeze({
 metrics:'cijfers-maatstaven',
 finance:'waarde-financiering',
 customers:'sales-intelligence',
 service:'data-ai',
 inventory:'data-ai',
 people:'mensen',
 marketing:'andere-data',
 energy:'csrd-impact',
 projects:'roadmap',
 research:'onderzoek'
});
export const IMPORT_CATALOG_PAGES=Object.freeze(['data-ai','datahubstatus','ingevulde-gegevens']);
const CATALOG_SET=new Set(IMPORT_CATALOG_PAGES);
const label=(items,id,fallback)=>items.find(item=>item.id===id)?.label||fallback;
export function importDestinationPage(area){
  const page=IMPORT_AREA_PAGE[String(area||'')]||'data-ai';
  return findPage(page)?page:'data-ai';
}
export function importPageUrl(pageId){
  const target=findPage(pageId)?pageId:'data-ai';
  return 'https://www.bedrijfsgeheugen.nl/portal-v2/?page='+encodeURIComponent(target);
}
export function importAppearsOnPage(record,pageId){
  if(!record||!pageId||pageId==='overzicht')return false;
  // Older imports with no reviewed meaning remain visible ONLY in central catalogs.
  if(CATALOG_SET.has(pageId))return true;
  return !!record.semantic?.authorization?.humanReviewed
    &&importDestinationPage(record.semantic.area)===pageId;
}
export function confirmedImportedRecords({snapshot,identity,isDemo,pageId}={}){
  if(isDemo===true||!['authenticated','empty'].includes(snapshot?.mode))return [];
  const owner=String(identity?.id||'');
  if(!owner||owner!==String(snapshot?.user?.id||''))return [];
  const datasets=snapshot?.state?.portal?.dataImports?.datasets;
  if(!Array.isArray(datasets))return [];
  return datasets.filter(record=>
    typeof record?.id==='string'&&/^file-[a-f0-9]{32}$/.test(record.id)
    &&typeof record?.fingerprint==='string'&&/^[a-f0-9]{64}$/.test(record.fingerprint)
    &&Array.isArray(record.columns)&&Array.isArray(record.rows)
    &&importAppearsOnPage(record,pageId)
  ).slice(0,20);
}
export function importSourceSummary(record){
  const semantic=record?.semantic||{};
  const destination=importDestinationPage(semantic.area);
  const title=label(IMPORT_DATA_KINDS,semantic.kind,'Nog niet ingedeeld');
  return {
    name:String(record?.fileName||'Import').slice(0,180),
    kind:title,
    purpose:String(semantic.purpose||'Zakelijk doel nog niet vastgelegd').slice(0,180),
    system:String(semantic.sourceSystem||'Onbekende bronsysteem').slice(0,100),
    destinationPage:destination,
    destinationName:findPage(destination)?.label||'Data en AI',
    area:label(IMPORT_AREAS,semantic.area,'Niet ingedeeld'),
    grain:String(semantic.grain||'').slice(0,80),
    period:semantic.period&&typeof semantic.period.from==='string'&&typeof semantic.period.to==='string'
      ?semantic.period.from+' t/m '+semantic.period.to:null,
    importedAt:String(record?.importedAt||'').slice(0,10),
    rows:Number.isInteger(record?.rowCount)?record.rowCount:record?.rows?.length||0,
    columns:record?.columns?.length||0,
    reviewed:semantic.authorization?.humanReviewed===true,
    // A reviewed category is not a canonical KPI mapping or verified outcome.
    status:'Brongegevens · niet automatisch verwerkt in KPI’s',
    roles:Array.isArray(semantic.columnMappings)?semantic.columnMappings:[]
  };
}
const node=(documentRef,tag,text='',cls='')=>{
  const e=documentRef.createElement(tag);
  if(cls)e.className=cls;
  if(text!==null)e.textContent=String(text);
  return e;
};
function addDescription(documentRef,parent,key,value){
  const wrap=node(documentRef,'span','','bg-source-fact');
  wrap.append(node(documentRef,'small',key),node(documentRef,'strong',value));
  parent.append(wrap);
}
function renderDataTable(documentRef,container,record,summary){
  const tableWrap=node(documentRef,'div','','bg-source-table-wrap');
  const table=node(documentRef,'table');table.setAttribute('aria-label','Brongegevens uit '+summary.name);
  const header=node(documentRef,'thead'),headerRow=node(documentRef,'tr');
  const roleLabels=new Map(IMPORT_ROLES.map(item=>[item.id,item.label]));
  (record.columns||[]).slice(0,40).forEach((column,index)=>{
    const th=node(documentRef,'th',String(column||'').slice(0,100));
    const role=summary.roles[index]?.role;
    if(role&&roleLabels.has(role))th.append(node(documentRef,'small',roleLabels.get(role),'bg-source-role'));
    headerRow.append(th);
  });
  header.append(headerRow);table.append(header);
  const body=node(documentRef,'tbody');table.append(body);tableWrap.append(table);container.append(tableWrap);
  const controls=node(documentRef,'div','','bg-source-table-controls');
  const search=node(documentRef,'input');search.type='search';search.placeholder='Zoeken in dit bestand';
  search.setAttribute('aria-label','Zoeken in '+summary.name);
  const paging=node(documentRef,'div','','bg-source-pagination');
  const prev=node(documentRef,'button','Vorige');prev.type='button';
  const count=node(documentRef,'span','','bg-source-count');
  const next=node(documentRef,'button','Volgende');next.type='button';
  paging.append(prev,count,next);controls.append(search,paging);
  tableWrap.after(controls);
  const rows=Array.isArray(record.rows)?record.rows:[];
  let offset=0;const PAGE_SIZE=20;
  function paint(){
    const query=search.value.trim().toLocaleLowerCase('nl');
    const matched=query
      ?rows.filter(row=>Array.isArray(row)&&row.some(cell=>String(cell??'').toLocaleLowerCase('nl').includes(query)))
      :rows.filter(Array.isArray);
    offset=Math.max(0,Math.min(offset,Math.max(0,Math.ceil(matched.length/PAGE_SIZE)-1)*PAGE_SIZE));
    body.replaceChildren();
    matched.slice(offset,offset+PAGE_SIZE).forEach(values=>{
      const row=node(documentRef,'tr');
      record.columns.slice(0,40).forEach((_,i)=>row.append(node(documentRef,'td',String(values[i]??'').slice(0,2000))));
      body.append(row);
    });
    if(!matched.length){
      const row=node(documentRef,'tr'),cell=node(documentRef,'td','Geen regels gevonden.');
      cell.colSpan=record.columns.length;row.append(cell);body.append(row);
    }
    count.textContent=matched.length
      ?(offset+1)+'–'+Math.min(offset+PAGE_SIZE,matched.length)+' van '+matched.length
      :'0 van 0';
    prev.disabled=offset===0;next.disabled=offset+PAGE_SIZE>=matched.length;
  }
  search.addEventListener('input',()=>{offset=0;paint();});
  prev.addEventListener('click',()=>{offset-=PAGE_SIZE;paint();});
  next.addEventListener('click',()=>{offset+=PAGE_SIZE;paint();});
  paint();
}
function renderSourceCard(documentRef,record,index,pageId,openPage){
  const summary=importSourceSummary(record);
  const details=node(documentRef,'details','','bg-source-record');
  // First dataset opens immediately: actual values visible on the destination page.
  details.open=index===0;
  const heading=node(documentRef,'summary','','bg-source-record-summary');
  const labelWrap=node(documentRef,'span');
  labelWrap.append(node(documentRef,'strong',summary.name),node(documentRef,'small',summary.kind+' · '+summary.rows+' rijen'));
  heading.append(labelWrap);details.append(heading);
  const content=node(documentRef,'div','','bg-source-record-body');
  content.append(node(documentRef,'p',summary.status,'bg-source-trust'));
  const facts=node(documentRef,'div','','bg-source-facts');
  addDescription(documentRef,facts,'Doel',summary.purpose);
  addDescription(documentRef,facts,'Herkomst',summary.system);
  addDescription(documentRef,facts,'Bedrijfsdomein',summary.area);
  addDescription(documentRef,facts,'Datum import',summary.importedAt||'Niet beschikbaar');
  if(summary.period)addDescription(documentRef,facts,'Gegevensperiode',summary.period);
  content.append(facts);
  if(!summary.reviewed)content.append(node(documentRef,'p','Dit oudere bestand heeft nog geen gecontroleerde zakelijke bestemming. Het wordt daarom alleen in het centrale bronnenoverzicht getoond.','bg-source-unreviewed'));
  if(pageId!==summary.destinationPage&&summary.reviewed){
    const link=node(documentRef,'a','Open '+summary.destinationName+' ›','bg-source-destination-link');
    link.href=importPageUrl(summary.destinationPage);
    link.addEventListener('click',event=>{
      if(typeof openPage==='function'){event.preventDefault();openPage(summary.destinationPage);}
    });
    content.append(link);
  }
  content.append(node(documentRef,'h4','Gegevens uit het bestand'));
  renderDataTable(documentRef,content,record,summary);
  details.append(content);return details;
}
export function renderImportedDataOnPage(native,{pageId,stateClient,openPage,documentRef=globalThis.document}={}){
  if(!native||!documentRef)return null;
  const current=native.querySelector('[data-bg-imported-page-data]');
  const identity=stateClient?.currentUser?.();
  const snapshot=stateClient?.getSnapshot?.();
  const records=confirmedImportedRecords({
    snapshot,identity,isDemo:stateClient?.isDemo?.()===true,pageId
  });
  // A new principal, logout, invalid mode, or unrelated page must drop old rows.
  if(!records.length){
    current?.remove();
    return null;
  }
  const section=node(documentRef,'section','','bg-imported-page-data');
  section.dataset.bgImportedPageData='v1';section.dataset.forPage=pageId;
  section.setAttribute('aria-label','Geïmporteerde gegevens op deze pagina');
  const header=node(documentRef,'div','','bg-source-section-head');
  const heading=node(documentRef,'div');
  heading.append(node(documentRef,'span','EIGEN BEDRIJFSGEGEVENS','bg-source-kicker'),
    node(documentRef,'h3',CATALOG_SET.has(pageId)?'Geïmporteerde gegevens en bronnen':'Gegevens op deze pagina'),
    node(documentRef,'p',CATALOG_SET.has(pageId)
      ?'Alle opgeslagen bestanden, met hun inhoud en beoordeelde bestemming.'
      :'De opgeslagen brongegevens die aan dit onderdeel zijn toegewezen. De bestaande KPI’s worden niet stilzwijgend aangepast.'));
  header.append(heading,node(documentRef,'span',records.length+' '+(records.length===1?'bestand':'bestanden'),'bg-source-total'));
  section.append(header);
  records.slice().reverse().forEach((record,i)=>section.append(renderSourceCard(documentRef,record,i,pageId,openPage)));
  if(current)current.replaceWith(section);
  else native.prepend(section);
  return section;
}
