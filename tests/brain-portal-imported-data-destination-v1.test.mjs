import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseCsv} from '../portal-v2/data-import-parser.js';
import {analyzeImportTable,confirmImportContext} from '../portal-v2/data-import-semantics.js';
import {buildImportRecord} from '../portal-v2/data-import.js';
import {
 IMPORT_AREA_PAGE,IMPORT_CATALOG_PAGES,importDestinationPage,importPageUrl,
 importAppearsOnPage,confirmedImportedRecords,importSourceSummary,renderImportedDataOnPage
} from '../portal-v2/imported-data-pages.js';
import {findPage} from '../portal-v2/page-registry.js';

function sample(area,{personal=false,legacy=false}={}){
 const table=parseCsv('Factuurnummer;Datum;Bedrag\nF-1;2026-11-22;0\nF-2;2026-11-23;125');
 const fingerprint='a'.repeat(64);
 const analysis=analyzeImportTable(table,{fileName:'facturen.csv'});
 const context=legacy?null:confirmImportContext(analysis,{
  kind:personal?'customers':'invoices',area,grain:'invoice',purpose:'Betaalgedrag en openstaande posten volgen',
  sourceSystem:'Exact',mappings:analysis.columnMappings.map(({column,role})=>({column,role})),
  confirmed:true,personalAuthorized:false
 });
 return buildImportRecord({name:'facturen.csv',size:200},table,fingerprint,context);
}
const envelope=(records,owner='tenant-one')=>({
 mode:'authenticated',user:{id:owner},state:{portal:{dataImports:{datasets:records}}}
});
const auth=(snap,owner='tenant-one',pageId='waarde-financiering',isDemo=false)=>confirmedImportedRecords({
 snapshot:snap,identity:{id:owner},isDemo,pageId
});
test('every supported data domain maps to an EXISTING canonical destination page, not a new menu',()=>{
 assert.equal(importDestinationPage('metrics'),'cijfers-maatstaven');
 assert.equal(importDestinationPage('finance'),'waarde-financiering');
 assert.equal(importDestinationPage('customers'),'sales-intelligence');
 assert.equal(importDestinationPage('service'),'data-ai');
 assert.equal(importDestinationPage('inventory'),'data-ai');
 assert.equal(importDestinationPage('people'),'mensen');
 assert.equal(importDestinationPage('marketing'),'andere-data');
 assert.equal(importDestinationPage('energy'),'csrd-impact');
 assert.equal(importDestinationPage('projects'),'roadmap');
 assert.equal(importDestinationPage('research'),'onderzoek');
 assert.equal(importDestinationPage('garbled'),'data-ai');
 for(const page of Object.values(IMPORT_AREA_PAGE))assert.ok(findPage(page),page);
 assert.equal(importPageUrl('waarde-financiering'),
  'https://www.bedrijfsgeheugen.nl/portal-v2/?page=waarde-financiering');
 assert.equal(importPageUrl('<script>'),'https://www.bedrijfsgeheugen.nl/portal-v2/?page=data-ai');
});
test('the real saved rows appear ONLY on the reviewed destination page and central catalogs',()=>{
 const record=sample('finance'),snap=envelope([record]);
 assert.equal(auth(snap).length,1);
 assert.deepEqual(auth(snap)[0].rows,record.rows);
 assert.equal(auth(snap)[0].rows[0][2],'0');
 assert.equal(auth(snap,'tenant-one','sales-intelligence').length,0);
 assert.equal(auth(snap,'tenant-one','cijfers-maatstaven').length,0);
 for(const page of IMPORT_CATALOG_PAGES)assert.equal(auth(snap,'tenant-one',page).length,1,page);
 assert.equal(auth(snap,'tenant-one','overzicht').length,0);
 assert.equal(importAppearsOnPage(record,'waarde-financiering'),true);
 assert.equal(importAppearsOnPage(record,'mensen'),false);
});
test('legacy imports without verified semantic destination are visible only in the central source catalog',()=>{
 const old=sample('finance',{legacy:true}),snap=envelope([old]);
 assert.equal(auth(snap).length,0);
 assert.equal(auth(snap,'tenant-one','data-ai').length,1);
 assert.equal(auth(snap,'tenant-one','datahubstatus').length,1);
 assert.equal(importSourceSummary(old).reviewed,false);
 assert.equal(importSourceSummary(old).purpose,'Zakelijk doel nog niet vastgelegd');
});
test('cross-tenant, anonymous, demo and failed reads never leak source rows',()=>{
 const record=sample('finance'),snap=envelope([record]);
 assert.equal(auth(snap,'tenant-two').length,0);
 assert.equal(auth(snap,'tenant-one','waarde-financiering',true).length,0);
 assert.equal(auth({...snap,mode:'preview'}).length,0);
 assert.equal(auth({...snap,mode:'error'}).length,0);
 assert.equal(auth({...snap,user:{id:'tenant-two'}}).length,0);
 assert.equal(auth({...snap,state:{}}).length,0);
 assert.equal(auth({...snap,mode:'empty'}).length,1);
});
test('invalid or tampered persisted objects do not render as trusted source datasets',()=>{
 const record=sample('finance'),snapshot=envelope([
  {...record,id:'hacked-file'},
  {...record,fingerprint:'bad'},
  {...record,rows:'not-a-table'},
  record
 ]);
 assert.deepEqual(auth(snapshot),[record]);
 assert.equal(importSourceSummary(record).status,'Brongegevens · niet automatisch verwerkt in KPI’s');
 assert.equal(importSourceSummary(record).destinationName,'Waarde en financiering');
});
class E{
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attributes={};this.events={};
  this.className='';this._text='';this.value='';this.type='';this.disabled=false;}
 set textContent(value){this.children=[];this._text=String(value);}
 get textContent(){return this._text+this.children.map(e=>e.textContent).join('');}
 append(...items){for(const item of items){item.parent=this;this.children.push(item);}}
 prepend(...items){for(const item of [...items].reverse()){item.parent=this;this.children.unshift(item);}}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}
 replaceWith(node){const p=this.parent;if(p){p.children[p.children.indexOf(this)]=node;node.parent=p;}}
 replaceChildren(...items){this.children=[];this._text='';this.append(...items);}
 after(node){const p=this.parent;if(p){const at=p.children.indexOf(this);node.parent=p;p.children.splice(at+1,0,node);}}
 setAttribute(k,v){this.attributes[k]=v;}
 addEventListener(type,fn){this.events[type]=fn;}
 querySelector(selector){
  if(selector==='[data-bg-imported-page-data]')return traverse(this,x=>!!x.dataset.bgImportedPageData)[0]||null;
  return null;
 }
}
function traverse(node,predicate){
 return [node,...node.children.flatMap(child=>traverse(child,predicate))].filter(predicate);
}
test('actual imported values render as a pageable, searchable table on the destination and clear after logout',()=>{
 const columns=['Factuurnummer','Datum','Bedrag'];
 const rows=Array.from({length:25},(_,i)=>['F-'+(i+1),'2026-11-22',i===0?'0':String(i)]);
 const record={...sample('finance'),columns,rows,rowCount:25};
 const doc={createElement:tag=>new E(tag)},native=new E('main');
 let snap=envelope([record]);
 const client={getSnapshot:()=>snap,currentUser:()=>({id:'tenant-one'}),isDemo:()=>false};
 renderImportedDataOnPage(native,{pageId:'waarde-financiering',stateClient:client,documentRef:doc});
 const section=native.querySelector('[data-bg-imported-page-data]');
 assert.ok(section);
 assert.match(section.textContent,/Factuurnummer/);
 assert.match(section.textContent,/F-1/);
 assert.match(section.textContent,/0/);
 assert.doesNotMatch(section.textContent,/F-25/);
 const inputs=traverse(section,x=>x.tag==='input'&&x.type==='search');
 assert.equal(inputs.length,1);
 inputs[0].value='F-25';inputs[0].events.input();
 assert.match(section.textContent,/F-25/);
 assert.doesNotMatch(section.textContent,/F-1\s/);
 snap={mode:'preview',user:null,state:{}};
 renderImportedDataOnPage(native,{pageId:'waarde-financiering',stateClient:client,documentRef:doc});
 assert.equal(native.querySelector('[data-bg-imported-page-data]'),null);
});
test('source UI preserves canonical writer, signed-in snapshot and original route',async()=>{
 const shell=await readFile(new URL('../portal-v2/page-shell.js',import.meta.url),'utf8');
 const app=await readFile(new URL('../portal-v2/app.js',import.meta.url),'utf8');
 const importUi=await readFile(new URL('../portal-v2/data-import.js',import.meta.url),'utf8');
 const index=await readFile(new URL('../portal-v2/index.html',import.meta.url),'utf8');
 const src=await readFile(new URL('../portal-v2/imported-data-pages.js',import.meta.url),'utf8');
 assert.match(shell,/renderImportedDataOnPage\(native,\{pageId,stateClient:portalContext\.stateClient/);
 assert.match(app,/refreshConfirmedImportedPage/);
 assert.match(app,/portalStateClient\.subscribe\(snap=>\{\s*refreshConfirmedImportedPage/);
 assert.match(importUi,/stateClient\.load\(\)/);
 assert.match(importUi,/importDestinationPage\(record\.semantic\?\.area\)/);
 assert.match(importUi,/navigatePortal\(page\)/);
 assert.match(index,/imported-data-pages\.css/);
 assert.doesNotMatch(src,/localStorage|sessionStorage|\.patch\(|\.write\(|fetch\(|innerHTML|eval\(/);
 assert.doesNotMatch(src,/new MutationObserver|setInterval\(|service_role/);
});
