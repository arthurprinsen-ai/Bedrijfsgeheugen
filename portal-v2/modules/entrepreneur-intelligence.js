import { REGELGEVING, CATEGORIEEN, komendeMijlpalen } from '../regelgeving.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const arr=value=>Array.isArray(value)?value:[];
const nlDate=value=>{if(!value)return '—';try{return new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short',year:'numeric'}).format(new Date(value));}catch{return String(value)}};
const isFresh=(value,days=45)=>{if(!value)return false;const t=new Date(value).getTime();return Number.isFinite(t)&&Date.now()-t<=days*86400000};
const sourceName=(sourceMap,id)=>sourceMap.get(id)?.naam||sourceMap.get(id)?.uitgever||'Externe bron';
const sourcePublisher=(sourceMap,id)=>sourceMap.get(id)?.uitgever||'Onbekend';

const VIEWS=Object.freeze({
  ondernemersdata:{title:'Actueel & externe data',subtitle:'Wat buiten je bedrijf verandert en wat dat voor jouw onderneming kan betekenen.'},
  'wet-regelgeving':{title:'Wet- & regelgeving',subtitle:'Verplichtingen, mijlpalen en herzienmomenten die ondernemers kunnen raken.'},
  'arbeidsmarkt-personeel':{title:'Arbeidsmarkt & personeel',subtitle:'UWV-, CBS- en andere arbeidsmarktsignalen op één plek.'},
  'subsidies-regelingen':{title:'Subsidies & regelingen',subtitle:'Nieuwe en gewijzigde RVO-regelingen en andere ondernemersregelingen.'},
  'economie-branche-actueel':{title:'Economie & branche',subtitle:'CBS, DNB en branche-informatie die relevant kan zijn voor planning en benchmark.'},
  'ai-technologie-actueel':{title:'AI & technologie',subtitle:'Actuele AI-, digitaliserings-, cyber- en technologiewijzigingen.'},
  deadlines:{title:'Deadlines',subtitle:'Aankomende wettelijke mijlpalen en externe signalen met een concrete datum.'},
  bronnenbibliotheek:{title:'Bronnenbibliotheek',subtitle:'De publicaties achter de analyses, met herkomst en publicatiedatum.'}
});

function shell(title,subtitle,body){
  return `<div class="eidash"><header class="eihero"><div><span>Powerhouse · externe intelligence</span><h3>${esc(title)}</h3><p>${esc(subtitle)}</p></div><button type="button" class="pvprimary" data-ei-refresh>Vernieuwen ↻</button></header>${body}</div>`;
}
function nav(){
  const links=[
    ['Overzicht','ondernemersdata'],['Wet- & regelgeving','wet-regelgeving'],['Arbeidsmarkt','arbeidsmarkt-personeel'],
    ['Subsidies','subsidies-regelingen'],['Economie','economie-branche-actueel'],['AI & technologie','ai-technologie-actueel'],
    ['Deadlines','deadlines'],['Bronnen','bronnenbibliotheek'],['Bronstatus','bronnenstatus']
  ];
  return `<nav class="einav" aria-label="Actueel en externe data">${links.map(([label,id])=>`<button type="button" data-ei-page="${esc(id)}">${esc(label)}</button>`).join('')}</nav>`;
}
function loading(view){return shell(view.title,view.subtitle,`${nav()}<section class="eistate"><b>Actuele bronnen laden…</b><p>UWV, RVO, CBS en overige externe signalen worden opgehaald.</p></section>`)}
function error(view,message){return shell(view.title,view.subtitle,`${nav()}<section class="eistate error"><b>Actuele brondata kon niet worden geladen</b><p>${esc(message||'Onbekende fout')}</p></section>`)}

function sourceCard(item,sourceMap){
  const publisher=sourcePublisher(sourceMap,item.bron_id);
  const source=sourceName(sourceMap,item.bron_id);
  return `<article class="eicard"><div class="eimeta"><span>${esc(publisher)}</span><time>${esc(nlDate(item.publicatiedatum||item.opgehaald_op))}</time></div><h4>${esc(item.titel||source)}</h4>${item.samenvatting?`<p>${esc(item.samenvatting).slice(0,520)}</p>`:''}<footer><span>${esc(source)}</span>${item.url?`<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">Open bron ↗</a>`:''}</footer></article>`;
}
function signalCard(item){
  return `<article class="eicard"><div class="eimeta"><span>${esc(item.domein||item.onderwerp||'Extern signaal')}</span><time>${esc(nlDate(item.gepubliceerd_op||item.opgehaald_op))}</time></div><h4>${esc(item.titel||item.onderwerp||'Signaal')}</h4>${item.samenvatting?`<p>${esc(item.samenvatting).slice(0,520)}</p>`:''}<footer><span>${item.vertrouwen!=null?`vertrouwen ${Math.round(Number(item.vertrouwen)*100)}%`:'extern signaal'}</span>${item.url?`<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">Open bron ↗</a>`:''}</footer></article>`;
}
function lawCard(item){
  const next=arr(item.mijlpalen).filter(m=>m.datum>=new Date().toISOString().slice(0,10)).sort((a,b)=>a.datum.localeCompare(b.datum))[0];
  return `<article class="eicard law"><div class="eimeta"><span>${esc(CATEGORIEEN[item.categorie]||item.categorie)}</span><span class="eistatus">${esc(item.status)}</span></div><h4>${esc(item.naam)}</h4><p>${esc(item.wat)}</p><div class="eifact"><b>Raakt</b><span>${esc(item.raakt)}</span></div>${next?`<div class="eifact"><b>Volgende mijlpaal</b><span>${esc(nlDate(next.datum))} · ${esc(next.wat)}</span></div>`:''}<footer><span>Nagekeken ${esc(nlDate(item.peildatum))}</span><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.bron||'Officiële bron')} ↗</a></footer></article>`;
}
function section(title,items,emptyCopy='Geen items gevonden.'){
  return `<section class="eisection"><div class="pvmodulehead"><span>•</span><h3>${esc(title)}</h3></div>${items.length?`<div class="eigrid">${items.join('')}</div>`:`<div class="eistate"><p>${esc(emptyCopy)}</p></div>`}</section>`;
}
function publisherFilter(rows,publishers){const set=new Set(publishers.map(x=>x.toLowerCase()));return rows.filter(row=>set.has(String(row.publisher||'').toLowerCase()))}
function enrich(data){
  const sourceMap=new Map(arr(data.sources).map(s=>[s.id,s]));
  const publications=arr(data.publications).map(p=>({...p,publisher:sourcePublisher(sourceMap,p.bron_id),sourceName:sourceName(sourceMap,p.bron_id)}));
  return {sourceMap,publications,signals:arr(data.signals),sources:arr(data.sources),stats:data.stats||{}};
}
function renderHub(data){
  const {sourceMap,publications,signals,sources,stats}=enrich(data);
  const uwv=publisherFilter(publications,['UWV']);
  const rvo=publisherFilter(publications,['RVO']);
  const cbs=publisherFilter(publications,['CBS']);
  const nextLaws=komendeMijlpalen(new Date().toISOString().slice(0,10),365).slice(0,5);
  const cards=[
    ['Wet- & regelgeving',REGELGEVING.length,'actuele regels','wet-regelgeving'],
    ['UWV arbeidsmarkt',uwv.length,'recente publicaties','arbeidsmarkt-personeel'],
    ['RVO regelingen',rvo.length,'recente publicaties','subsidies-regelingen'],
    ['CBS & economie',cbs.length,'recente publicaties','economie-branche-actueel'],
    ['Externe signalen',signals.length,'intelligence-signalen','ai-technologie-actueel'],
    ['Bronnen',sources.length,'actieve brondefinities','bronnenbibliotheek']
  ];
  const body=`${nav()}<section class="eikpis">${cards.map(([label,n,unit,id])=>`<button type="button" data-ei-page="${id}"><small>${esc(label)}</small><strong>${esc(n)}</strong><span>${esc(unit)} →</span></button>`).join('')}</section>
    ${section('Wat verandert als eerste',nextLaws.map(m=>`<article class="eicard compact"><div class="eimeta"><span>Wetgeving</span><time>${esc(nlDate(m.datum))}</time></div><h4>${esc(m.regel)}</h4><p>${esc(m.wat)}</p></article>`))}
    ${section('Nieuw uit externe bronnen',publications.slice(0,6).map(x=>sourceCard(x,sourceMap)))}
    <p class="eifootnote">Live read-only projectie · ${esc(stats.generatedAt||'zojuist')} · alleen publieke bronmetadata en publicatie-inhoud.</p>`;
  return shell(VIEWS.ondernemersdata.title,VIEWS.ondernemersdata.subtitle,body);
}
function renderView(pageId,data){
  if(pageId==='ondernemersdata')return renderHub(data);
  const view=VIEWS[pageId]||VIEWS.ondernemersdata;
  const {sourceMap,publications,signals,sources}=enrich(data);
  let content=[];
  if(pageId==='wet-regelgeving') content=REGELGEVING.map(lawCard);
  if(pageId==='arbeidsmarkt-personeel') content=publications.filter(x=>['UWV','CBS'].includes(x.publisher)&&(/arbeid|personeel|loon|vacature|beroep|verzuim|werk/i.test(`${x.titel} ${x.samenvatting} ${x.sourceName}`)||x.publisher==='UWV')).map(x=>sourceCard(x,sourceMap));
  if(pageId==='subsidies-regelingen') content=publications.filter(x=>x.publisher==='RVO'||/subsid|regeling|wbso|mit/i.test(`${x.titel} ${x.samenvatting}`)).map(x=>sourceCard(x,sourceMap));
  if(pageId==='economie-branche-actueel') content=publications.filter(x=>['CBS','DNB','RaboResearch','Eurostat'].includes(x.publisher)||/economie|branche|sector|inflatie|groei|bedrijven/i.test(`${x.titel} ${x.samenvatting}`)).map(x=>sourceCard(x,sourceMap));
  if(pageId==='ai-technologie-actueel') content=signals.filter(x=>x.toegestaan!==false&&/ai|digital|cyber|data|technolog/i.test(`${x.onderwerp} ${x.titel} ${x.samenvatting}`)).map(signalCard);
  if(pageId==='deadlines'){
    const laws=komendeMijlpalen(new Date().toISOString().slice(0,10),730).map(m=>({datum:m.datum,html:`<article class="eicard compact"><div class="eimeta"><span>Wetgeving</span><time>${esc(nlDate(m.datum))}</time></div><h4>${esc(m.regel)}</h4><p>${esc(m.wat)}</p></article>`}));
    const external=signals.filter(x=>x.deadline).map(x=>({datum:x.deadline,html:signalCard(x)}));
    content=[...laws,...external].sort((a,b)=>String(a.datum).localeCompare(String(b.datum))).map(x=>x.html);
  }
  if(pageId==='bronnenbibliotheek'){
    const sourceRows=sources.map(s=>`<article class="eicard compact"><div class="eimeta"><span>${esc(s.uitgever||'Bron')}</span><span class="eistatus ${s.laatste_controle_gelukt===false?'bad':''}">${s.laatste_controle_gelukt===false?'aandacht':'actief'}</span></div><h4>${esc(s.naam)}</h4><p>${esc(s.controle_frequentie||'Periodiek')} · laatst gecontroleerd ${esc(nlDate(s.laatst_gecontroleerd))}</p></article>`);
    return shell(view.title,view.subtitle,`${nav()}${section('Geregistreerde bronnen',sourceRows)}${section('Laatste publicaties',publications.slice(0,30).map(x=>sourceCard(x,sourceMap)))}`);
  }
  return shell(view.title,view.subtitle,`${nav()}${section(view.title,content,'Voor deze selectie zijn nu geen actuele records beschikbaar.')}`);
}

async function load(fetchImpl=globalThis.fetch){
  const response=await fetchImpl('/api/portal-ondernemersdata',{headers:{accept:'application/json'},credentials:'same-origin'});
  if(!response.ok)throw new Error(`Bron-API gaf status ${response.status}`);
  return response.json();
}

export function mountEntrepreneurIntelligence(root,{pageId='ondernemersdata',openPage,fetchImpl=globalThis.fetch}={}){
  if(!root)return null;
  const view=VIEWS[pageId]||VIEWS.ondernemersdata;
  const bind=()=>{
    root.querySelectorAll('[data-ei-page]').forEach(btn=>btn.addEventListener('click',()=>openPage?.(btn.dataset.eiPage)));
    root.querySelector('[data-ei-refresh]')?.addEventListener('click',()=>run(true));
  };
  const run=async(force=false)=>{
    root.innerHTML=loading(view);bind();
    try{
      const data=await load(fetchImpl);
      root.innerHTML=renderView(pageId,data);
      bind();
      if(force)root.querySelector('[data-ei-refresh]')?.focus();
    }catch(err){root.innerHTML=error(view,err?.message);bind();}
  };
  run(false);
  return {refresh:()=>run(true)};
}

export { renderView };
