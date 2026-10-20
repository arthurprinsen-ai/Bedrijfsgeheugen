/** Read-only context explorer for canonical Portal V2. No fabricated provenance or projections. */
import {navigatePortal} from './router.js';
export const INSIGHT_LENS_VERSION='2026-10-20-v1';
const SELECTOR='figure.v2visual,.pvvisual,.pfs-chart,[data-chart],.pvtablewrap,.table-wrap,#portalView table,.main table,[data-canvas],.roadmap-board,.strategy-board';
const state={host:null,selected:null,pins:[],returnFocus:null};
let dialog,shade,body,heading,closeButton,queued=false;
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
const clean=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim().slice(0,240);
const shown=el=>!!(el?.isConnected&&!el.closest('[hidden],[aria-hidden="true"],[data-portal-sample-only="true"]'));
const tableOf=el=>el?.matches('table')?el:el?.querySelector('table');
const nameOf=el=>clean(el?.querySelector('figcaption,h2,h3,[data-chart-title]'))||clean(el?.closest('article,section')?.querySelector('h2,h3'))||el?.getAttribute('aria-label')||'Bedrijfsinzicht';
function dataRows(host){
 const table=tableOf(host);if(!table)return [];
 const headers=[...table.querySelectorAll('thead th')].map(clean);
 const rows=[...(table.tBodies[0]||table).querySelectorAll('tr')].filter(r=>r.querySelector('td')).slice(0,60);
 return rows.map((row,i)=>({index:i,row,label:clean(row.querySelector('td'))||'Rij '+(i+1),
  values:[...row.querySelectorAll('td')].slice(0,12).map((c,j)=>({label:headers[j]||'Kolom '+(j+1),value:clean(c)}))}));
}
function evidence(host){
 const el=host.closest('[data-source],[data-evidence-ref],[data-evidence-id],[data-observed-at]')||
 host.querySelector('[data-source],[data-evidence-ref],[data-evidence-id],[data-observed-at]');
 const get=k=>el?.getAttribute(k)||'';
 return {source:get('data-source')||'Bron niet gespecificeerd bij deze visualisatie',
  ref:get('data-evidence-ref')||get('data-evidence-id'),at:get('data-observed-at')};
}
function fact(label,value){
 const el=make('div','bg-il-fact');el.append(make('dt','',label),make('dd','',value||'Niet bekend'));return el;
}
function draw(){
 if(!state.host)return;
 heading.textContent=nameOf(state.host);body.replaceChildren();
 const intro=make('section','bg-il-section');
 intro.append(make('h3','','Wat betekent dit?'),make('p','', 'Verken de zichtbare informatie. Alleen de bestaande brondata en berekeningen van dit portaal zijn leidend.'));
 if(state.selected){
  const card=make('div','bg-il-selected');card.append(make('span','bg-il-kicker','GESELECTEERD'),make('strong','',state.selected.label));
  if(state.selected.values?.length){
   const dl=make('dl','bg-il-grid');state.selected.values.forEach(v=>dl.append(fact(v.label,v.value)));card.append(dl);
  }
  const pin=make('button','bg-il-pin','Bewaar ter vergelijking');pin.type='button';
  pin.addEventListener('click',()=>{if(state.pins.length===2)state.pins.shift();state.pins.push({label:state.selected.label,title:nameOf(state.host)});draw()});
  card.append(pin);intro.append(card);
 }
 body.append(intro);
 const rows=dataRows(state.host);
 if(rows.length){
  const sec=make('section','bg-il-section');sec.append(make('h3','','Doorzoek de tabel'));
  const input=make('input','bg-il-search');input.type='search';input.placeholder='Filter zichtbare rijen';input.setAttribute('aria-label','Zoek in zichtbare tabelgegevens');
  const list=make('div','bg-il-list');
  function filter(){
   list.replaceChildren();const needle=input.value.toLocaleLowerCase('nl');
   const matching=rows.filter(row=>row.values.some(v=>(v.label+' '+v.value).toLocaleLowerCase('nl').includes(needle)));
   matching.slice(0,30).forEach(row=>{const b=make('button','bg-il-row',row.label);b.type='button';b.addEventListener('click',()=>{state.selected=row;draw()});list.append(b)});
   if(!matching.length)list.append(make('p','bg-il-muted','Geen overeenkomende rij.'));
   if(rows.length===60)list.append(make('p','bg-il-muted','De eerste 60 weergegeven rijen zijn doorzoekbaar. De hele tabel blijft op de pagina.'));
  }
  input.addEventListener('input',filter);sec.append(input,list);body.append(sec);filter();
 }
 const ev=evidence(state.host),proof=make('section','bg-il-section'),dl=make('dl','bg-il-grid');
 proof.append(make('h3','','Herkomst & zekerheid'));dl.append(fact('Bron',ev.source),fact('Bewijs',ev.ref?'Referentie aanwezig; niet onafhankelijk geverifieerd':'Geen bronreferentie bij dit onderdeel'));
 if(ev.ref)dl.append(fact('Bronreferentie',ev.ref));
 if(ev.at)dl.append(fact('Peildatum',ev.at));
 proof.append(dl,make('p','bg-il-muted','Ontbrekende broninformatie betekent niet dat het cijfer bewezen is. Een scenario is een aanname, geen uitkomst.'));
 body.append(proof);
 const path=make('section','bg-il-section');
 path.append(make('h3','','Consequentiekompas'),make('p','','Volg de beslisketen vanuit dit inzicht zonder automatisch causale gevolgen te veronderstellen.'));
 const steps=make('ol','bg-il-steps');
 ['Bekijk het signaal','Controleer bewijs en actualiteit','Onderzoek wat-als-scenario’s','Kies en registreer een actie','Meet het gerealiseerde effect'].forEach(t=>steps.append(make('li','',t)));
 path.append(steps);body.append(path);
 if(state.pins.length){
  const sec=make('section','bg-il-section');sec.append(make('h3','','Vergelijk inzichten'));
  const pair=make('div','bg-il-pair');
  state.pins.forEach((p,i)=>{const item=make('div','bg-il-snapshot');item.append(make('span','bg-il-kicker','POSITIE '+(i+1)),make('strong','',p.label),make('small','',p.title));pair.append(item)});
  const clear=make('button','bg-il-pin','Wis vergelijking');clear.type='button';clear.addEventListener('click',()=>{state.pins=[];draw()});sec.append(pair,clear);body.append(sec);
 }
}
export function closeInsightLens(restore=true){
 if(!dialog)return;dialog.hidden=true;shade.hidden=true;document.body.classList.remove('bg-il-open');
 state.host=null;state.selected=null;if(restore&&state.returnFocus?.isConnected)state.returnFocus.focus({preventScroll:true});
}
export function openInsightLens(host,selected=null,from=null){
 if(!shown(host))return false;
 ensureDialog();state.host=host;state.selected=selected;state.returnFocus=from||document.activeElement;
 draw();dialog.hidden=false;shade.hidden=false;document.body.classList.add('bg-il-open');closeButton.focus();
 document.dispatchEvent(new CustomEvent('bg:insight-lens-open',{detail:{kind:tableOf(host)?'table':'visual',route:new URLSearchParams(location.search).get('page')||'overzicht'}}));
 return true;
}
function ensureDialog(){
 if(dialog)return;
 shade=make('div','bg-il-shade');shade.hidden=true;shade.addEventListener('click',()=>closeInsightLens());
 dialog=make('aside','bg-il-dialog');dialog.hidden=true;dialog.id='bgInsightLens';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Inzichtlens');
 const head=make('header','bg-il-header');head.append(make('div','bg-il-kicker','POWERHOUSE · INZICHTLENS'));
 heading=make('h2');head.append(heading);
 closeButton=make('button','bg-il-close','×');closeButton.type='button';closeButton.setAttribute('aria-label','Sluit inzichtlens');closeButton.addEventListener('click',()=>closeInsightLens());head.append(closeButton);
 head.append(make('p','','Van begrijpen naar scenario, beslissing en meetbaar resultaat.'));
 body=make('div','bg-il-body');
 const footer=make('footer','bg-il-footer');
 [['Scenario verkennen','os:scenario-simulator'],['Acties bekijken','actieve-acties'],['Bronnen toetsen','bronnenbibliotheek']].forEach(([label,route])=>{
  const button=make('button','bg-il-route',label);button.type='button';button.addEventListener('click',()=>{closeInsightLens(false);navigatePortal(route)});footer.append(button);
 });
 dialog.append(head,body,footer);document.body.append(shade,dialog);
}
function enhance(host){
 if(!shown(host)||host.dataset.bgIlEnhanced||host.closest('#bgInsightLens'))return;
 if(host.matches('table')&&host.closest('.pvtablewrap,.table-wrap,[data-chart]'))return;
 if(host.matches('[data-chart]')&&host.closest('figure.v2visual,.pvvisual'))return;
 if(!host.matches('table,[data-canvas],.pfs-chart,.roadmap-board,.strategy-board')&&!host.querySelector('svg,canvas,table,input,textarea'))return;
 host.dataset.bgIlEnhanced='true';
 const btn=make('button','bg-il-trigger','✦ Verken');btn.type='button';btn.setAttribute('aria-label','Verken '+nameOf(host));
 btn.addEventListener('click',()=>openInsightLens(host,null,btn));
 if(host.matches('table'))host.before(btn);else host.append(btn);
}
export function enhanceInsightLens(scope=document){
 if(scope.nodeType===1&&scope.matches(SELECTOR))enhance(scope);
 scope.querySelectorAll?.(SELECTOR).forEach(enhance);
}
function selectedMark(target){
 const mark=target.closest?.('circle[tabindex],rect[tabindex],path[tabindex],.v2-data-point,.v2-data-bar');
 const title=mark?.querySelector('title')||mark?.closest('g')?.querySelector('title');
 const label=clean(title)||mark?.getAttribute('aria-label');
 return mark&&label?{mark,label}:null;
}
function init(){
 ensureDialog();enhanceInsightLens();
 // Lightweight hover and keyboard context without changing chart values or events.
 const preview=make('div','bg-il-hover');preview.hidden=true;preview.setAttribute('role','tooltip');document.body.append(preview);
 const place=event=>{
  const maxLeft=Math.max(8,innerWidth-Math.min(300,innerWidth-16));
  preview.style.left=Math.max(8,Math.min(maxLeft,event.clientX+14))+'px';
  preview.style.top=Math.max(8,Math.min(innerHeight-84,event.clientY+14))+'px';
 };
 document.addEventListener('pointerover',event=>{
  if(event.pointerType==='touch'||!dialog.hidden)return;
  const mark=selectedMark(event.target);
  if(!mark||!shown(mark.mark)){preview.hidden=true;return}
  preview.textContent=mark.label;place(event);preview.hidden=false;
 },{passive:true});
 document.addEventListener('pointermove',event=>{if(!preview.hidden)place(event)},{passive:true});
 document.addEventListener('pointerout',event=>{if(event.target.closest?.('svg'))preview.hidden=true},{passive:true});
 document.addEventListener('scroll',()=>{preview.hidden=true},{passive:true,capture:true});
 document.addEventListener('bg:portal-identity-boundary',()=>{
   // One session's pinned business data must never survive a tenant switch.
   state.pins=[];preview.hidden=true;closeInsightLens(false);
 });

 document.addEventListener('click',e=>{
  if(e.target.closest?.('button,a,input,textarea,select,summary,[role="button"],#bgInsightLens'))return;
  const info=selectedMark(e.target),row=e.target.closest?.('tbody tr');
  const host=(info?.mark||row)?.closest(SELECTOR);if(!host||!shown(host))return;
  if(info)openInsightLens(host,{label:info.label},info.mark);
  else if(row){const selected=dataRows(host).find(r=>r.row===row);if(selected)openInsightLens(host,selected,row)}
 });
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&dialog&&!dialog.hidden){e.preventDefault();closeInsightLens();return}
  if(e.key==='Tab'&&dialog&&!dialog.hidden){
   const controls=[...dialog.querySelectorAll('button:not([disabled]),input:not([disabled])')].filter(x=>x.getClientRects().length);
   const first=controls[0],last=controls.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
  }
  if(e.key!=='Enter'&&e.key!==' ')return;
  const info=selectedMark(e.target),host=info?.mark?.closest(SELECTOR);
  if(host&&shown(host)){e.preventDefault();openInsightLens(host,{label:info.label},info.mark)}
 });
 const root=document.querySelector('.app')||document.body;
 const pending=new Set();
 new MutationObserver(records=>{
  if(state.host&&!state.host.isConnected)closeInsightLens(false);
  for(const record of records)for(const node of record.addedNodes){
   if(node.nodeType!==1)continue;
   pending.add(node);
   const surface=node.closest?.(SELECTOR);if(surface)pending.add(surface);
  }
  if(!pending.size||queued)return;
  queued=true;requestAnimationFrame(()=>{
   queued=false;
   const targets=[...pending];pending.clear();
   for(const node of targets)if(node.isConnected)enhanceInsightLens(node);
  });
 }).observe(root,{childList:true,subtree:true});
 window.addEventListener('popstate',()=>closeInsightLens(false));
}
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
}
