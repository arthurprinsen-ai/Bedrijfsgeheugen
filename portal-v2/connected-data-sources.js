import {CONNECTOR_PORTAL_PAGES} from '../assets/js/koppelingen/portal-routing.js';

/* Read-only original tenant API. No examples, safe-test payloads, localStorage,
   inferred financial values, or direct source-data writes on the customer page. */
const allowed=new Set(CONNECTOR_PORTAL_PAGES.map(page=>page.id));
const create=(name,className)=>{const el=document.createElement(name);if(className)el.className=className;return el;};
const set=(el,value)=>{el.textContent=String(value??'');return el;};
const PORTAL_STUDIO_URL='https://www.bedrijfsgeheugen.nl/portal-v2/?page=koppelingen';

/* Deliberately no live-values branch: the original connector store has no
   verified, persisted customer-business-record projection. Never infer it
   from Active, TEST_PASSED or provider-ready configuration. */
export function sourceExperienceState(item={}){
 const state=['Active','Paused','Draft'].includes(item?.state)?item.state:'Unknown';
 return Object.freeze({
  state,
  configurationLabel:state==='Active'?'Opzet geactiveerd':state==='Paused'?'Gepauzeerd':state==='Draft'?'Concept bewaard':'Status onbekend',
  evidenceLabel:'Bronwaarden nog niet gecontroleerd',
  hasVerifiedValues:false,
  nextAction:'Verifieer eerst de echte bron, opslag en gegevens op deze pagina.'
 });
}
export function sourceExperienceSummary(items=[]){
 const records=Array.isArray(items)?items:[];
 return Object.freeze({
  configured:records.length,
  activeConfiguration:records.filter(item=>item?.state==='Active').length,
  liveRecordsVerified:0,
  statement:'Deze weergave bevat nog geen aantoonbaar ingelezen bronwaarden.'
 });
}
function fact(number,label){
 const wrap=create('div','bg-sourcejourney__fact');
 const strong=set(create('strong'),number),caption=set(create('span'),label);
 wrap.append(strong,caption);return wrap;
}
function sourceCard(item){
 const proof=sourceExperienceState(item);
 const li=create('li','bg-sourcejourney__card');
 const head=create('div','bg-sourcejourney__cardhead');
 const labels=create('div');
 labels.append(set(create('h4'),String(item?.label||'Koppeling').slice(0,100)),set(create('p','bg-sourcejourney__source'),'Bron: '+String(item?.sourceType||'onbekend').slice(0,50)));
 const pill=set(create('span','bg-sourcejourney__pill'+(proof.state!=='Active'?' bg-sourcejourney__pill--draft':'')),proof.configurationLabel);
 head.append(labels,pill);
 const progress=create('div','bg-sourcejourney__flow');progress.setAttribute('aria-label','Voortgang: opzet'+(proof.state==='Active'?' geactiveerd':' in voorbereiding')+'; echte bronwaarden en inzichten nog niet bewezen');
 for(let i=0;i<4;i++){const step=create('span','bg-sourcejourney__step'+(i===0?' bg-sourcejourney__step--done':''));step.setAttribute('aria-hidden','true');progress.append(step);}
 const truth=set(create('p','bg-sourcejourney__footnote'),proof.evidenceLabel+'. Geen cijfers of AI-advies op basis van deze koppeling.');
 const detail=create('details');
 detail.append(set(create('summary'),'Welke gegevens worden verwacht?'));
 const fields=create('ul','bg-sourcejourney__fields');
 for(const name of (Array.isArray(item?.fields)?item.fields:[]).slice(0,30))fields.append(set(create('li'),String(name).slice(0,80)));
 if(!fields.childElementCount)fields.append(set(create('li'),'Nog geen velden geselecteerd'));
 detail.append(fields,set(create('p','bg-sourcejourney__footnote'),proof.nextAction));
 li.append(head,progress,truth,detail);
 return li;
}
export async function mountConnectedDataSources(container,{pageId,fetchFn=globalThis.fetch}={}){
 if(!container||!allowed.has(pageId)||typeof fetchFn!=='function')return null;
 const pageLabel=CONNECTOR_PORTAL_PAGES.find(page=>page.id===pageId)?.label||'deze pagina';
 const panel=create('section','pvmodule bg-sourcejourney');
 panel.setAttribute('aria-label','Koppelingen en bronbewijs voor '+pageLabel);
 const header=create('div','bg-sourcejourney__header'),titleBox=create('div');
 titleBox.append(set(create('span','bg-sourcejourney__eyebrow'),'Mijn databronnen · '+pageLabel),
                 set(create('h3'),'Van verbinding naar inzicht'));
 const intro=set(create('p'),'We laten zien waar je gegevens vandaan moeten komen. Bedrijfscijfers verschijnen pas als de echte gegevensstroom controleerbaar is.');
 titleBox.append(intro);
 header.append(titleBox,set(create('span','bg-sourcejourney__tag'),'Bronbewijs eerst'));
 panel.append(header);container.append(panel);
 try{
  const response=await fetchFn('/api/connectors/page-sources?page='+encodeURIComponent(pageId),{credentials:'same-origin',cache:'no-store',headers:{accept:'application/json'}});
  if(!panel.isConnected)return null;
  if(!response.ok)throw new Error('SOURCE_READBACK_UNAVAILABLE');
  const payload=await response.json();
  if(payload?.truth!=='CONNECTOR_METADATA_ONLY_NO_LIVE_DATA'||payload?.pageId!==pageId||!Array.isArray(payload.items))throw new Error('SOURCE_PROJECTION_INVALID');
  const items=payload.items.slice(0,25);
  if(!items.length&&!['bronnenstatus','datahubstatus'].includes(pageId)){panel.remove();return null;}
  const summary=sourceExperienceSummary(items);
  const overview=create('div','bg-sourcejourney__summary');
  overview.append(fact(summary.configured,'Gekozen koppelingen'),fact(summary.activeConfiguration,'Opzetten geactiveerd'),fact('—','Echte waarden bevestigd'));
  panel.append(overview);
  const results=create('div');
  if(!items.length){
    results.append(set(create('p','bg-sourcejourney__empty'),'Nog geen koppelingen gekozen voor deze pagina. Begin met één systeem en kies welke gegevens je hier wilt zien.'));
  }else{
    const count=set(create('p'),summary.statement);count.setAttribute('role','status');results.append(count);
    const list=create('ul','bg-sourcejourney__cards');
    const rows=items.map(item=>({item,element:sourceCard(item)}));
    for(const row of rows)list.append(row.element);
    if(rows.length>=3){
      const search=create('div','bg-sourcejourney__search'),label=set(create('label'),'Zoek in mijn bronnen');
      const id='bg-source-search-'+pageId;label.htmlFor=id;
      const input=create('input');input.id=id;input.type='search';input.placeholder='Zoek op systeem of veld';input.autocomplete='off';
      const resultCount=set(create('span'),rows.length+' gevonden');resultCount.setAttribute('role','status');
      input.addEventListener('input',()=>{const query=input.value.trim().toLocaleLowerCase('nl');let visible=0;for(const row of rows){
       const text=[row.item?.label,row.item?.sourceType,...(Array.isArray(row.item?.fields)?row.item.fields:[])].join(' ').toLocaleLowerCase('nl');
       const show=text.includes(query);row.element.hidden=!show;if(show)visible++;
      }set(resultCount,visible+' gevonden');});
      search.append(label,input,resultCount);results.append(search);
    }
    results.append(list);
  }
  panel.append(results);
  const action=create('div','bg-sourcejourney__action');
  const link=set(create('a','bg-sourcejourney__button'),'Koppeling beheren →');link.href=PORTAL_STUDIO_URL;link.setAttribute('data-open-page','koppelingen');
  action.append(link,set(create('p','bg-sourcejourney__footnote'),'Geen geschatte omzet, voorbeeldcijfers of AI-conclusies zonder toestemming en echte broncontrole.'));
  panel.append(action);return panel;
 }catch{
  set(intro,'We kunnen je broninstellingen momenteel niet controleren. Er worden geen cijfers aangenomen.');
  const link=set(create('a','bg-sourcejourney__button'),'Bekijk koppelingen →');link.href=PORTAL_STUDIO_URL;link.setAttribute('data-open-page','koppelingen');panel.append(link);
  return panel;
 }
}
