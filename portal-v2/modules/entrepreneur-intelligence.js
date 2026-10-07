import { REGELGEVING, CATEGORIEEN, komendeMijlpalen } from '../regelgeving.js';
import { ensureIdentityWidget } from '../portal-state.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const arr=value=>Array.isArray(value)?value:[];
const nlDate=value=>{if(!value)return '—';try{return new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short',year:'numeric'}).format(new Date(value));}catch{return String(value)}};
const isFresh=(value,days=45)=>{if(!value)return false;const t=new Date(value).getTime();return Number.isFinite(t)&&Date.now()-t<=days*86400000};
const sourceName=(sourceMap,id)=>sourceMap.get(id)?.naam||sourceMap.get(id)?.uitgever||'Externe bron';
const sourcePublisher=(sourceMap,id)=>sourceMap.get(id)?.uitgever||'Onbekend';

const VIEWS=Object.freeze({
  ondernemersdata:{title:'Actueel & externe data',subtitle:'Wat buiten je bedrijf verandert en wat dat voor jouw onderneming kan betekenen.'},
  omgevingsradar:{title:'Omgevingsradar',subtitle:'Van bron naar signaal, impact en volgende actie — over markt, technologie, economie, mensen, keten, regelgeving en meer.'},
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
    ['Overzicht','ondernemersdata'],['Omgevingsradar','omgevingsradar'],['Wet- & regelgeving','wet-regelgeving'],['Arbeidsmarkt','arbeidsmarkt-personeel'],
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
  return {sourceMap,publications,signals:arr(data.signals),sources:arr(data.sources),stats:data.stats||{},intelligence:data.intelligence||{}};
}

function euro(value){
  if(value==null||value==='')return 'onbekend';
  const n=Number(value);if(!Number.isFinite(n))return 'onbekend';
  return new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
}
function score(value){const n=Number(value);return Number.isFinite(n)?Math.round(n):0;}
function intelligenceSignalCard(item,domains){
  const domain=domains.get(item.domain_key)?.label||item.domain_key||'Signaal';
  const money=item.estimated_value_eur!=null||item.estimated_loss_eur!=null
    ? `<div class="eifact"><b>Bekende waarde</b><span>${item.estimated_value_eur!=null?`kans ${esc(euro(item.estimated_value_eur))}`:''}${item.estimated_value_eur!=null&&item.estimated_loss_eur!=null?' · ':''}${item.estimated_loss_eur!=null?`risico ${esc(euro(item.estimated_loss_eur))}`:''}</span></div>`
    : `<div class="eifact"><b>€ impact</b><span>Nog niet bewezen · eigen bedrijfscontext nodig</span></div>`;
  return `<article class="eicard"><div class="eimeta"><span>${esc(domain)}</span><time>${esc(nlDate(item.observed_at||item.published_at))}</time></div><h4>${esc(item.title||'Signaal')}</h4>${item.summary?`<p>${esc(item.summary).slice(0,520)}</p>`:''}<div class="eifact"><b>Signaalscore</b><span>${esc(score(item.signal_score))}/100 · impact ${item.impact_score==null?'nog niet gescoord':esc(score(item.impact_score)+'/100')}</span></div>${money}<footer><span>${esc(item.impact_status||'NEEDS_COMPANY_CONTEXT')}</span>${item.external_url?`<a href="${esc(item.external_url)}" target="_blank" rel="noopener noreferrer">Open bron ↗</a>`:''}</footer></article>`;
}
function sourceCapabilityCard(item){
  const mode=item.activation_mode==='PUBLIC_ALWAYS'?'publieke bron':item.activation_mode==='CONNECTOR_REQUIRED'?'koppeling nodig':item.activation_mode==='PROVIDER_REQUIRED'?'provider nodig':'handmatig bewijs';
  return `<article class="eicard compact"><div class="eimeta"><span>${esc(item.scope==='internal'?'Binnen bedrijf':'Buiten bedrijf')}</span><span class="eistatus">${esc(mode)}</span></div><h4>${esc(item.label)}</h4><p>${esc(item.publisher||'')} · authority ${esc(item.authority_tier||'—')}/5</p><footer><span>${esc(arr(item.domain_keys).length)} domeinen</span>${item.canonical_url?`<a href="${esc(item.canonical_url)}" target="_blank" rel="noopener noreferrer">Bron ↗</a>`:''}</footer></article>`;
}
function renderEnvironmentRadar(data){
  const {intelligence}=enrich(data),domains=arr(intelligence.domains),catalog=arr(intelligence.sourceCatalog),signals=arr(intelligence.signals),actions=arr(intelligence.actionCandidates),snap=intelligence.snapshot||{};
  const domainMap=new Map(domains.map(d=>[d.domain_key,d]));
  const grouped=domains.reduce((acc,d)=>{(acc[d.pillar]??=[]).push(d);return acc;},{});
  const domainGroups=Object.entries(grouped).map(([pillar,items])=>`<details class="eicard"><summary><b>${esc(pillar)}</b> · ${items.length} domeinen</summary><div class="trust-detail">${items.map(d=>`<p><b>${esc(d.label)}</b><br><span>${esc(d.description)}</span></p>`).join('')}</div></details>`);
  const knownValue=snap.known_opportunity_value_eur==null?'Nog niet bewezen':euro(snap.known_opportunity_value_eur);
  const knownRisk=snap.known_risk_value_eur==null?'Nog niet bewezen':euro(snap.known_risk_value_eur);
  const body=`${nav()}<section class="eikpis">
    <button type="button"><small>Domeinen</small><strong>${esc(snap.domain_count??domains.length)}</strong><span>extern + intern</span></button>
    <button type="button"><small>Bronmogelijkheden</small><strong>${esc(snap.catalog_source_count??catalog.length)}</strong><span>publiek + koppelingen</span></button>
    <button type="button"><small>Signalen 7 dagen</small><strong>${esc(snap.signals_7d??signals.filter(s=>isFresh(s.observed_at,7)).length)}</strong><span>evidence-backed</span></button>
    <button type="button"><small>Aandacht</small><strong>${esc(snap.high_attention_count??signals.filter(s=>score(s.signal_score)>=70).length)}</strong><span>score ≥ 70</span></button>
    <button type="button"><small>Kansen €</small><strong>${esc(knownValue)}</strong><span>alleen bewezen bedragen</span></button>
    <button type="button"><small>Risico €</small><strong>${esc(knownRisk)}</strong><span>alleen bewezen bedragen</span></button>
  </section>
  <section class="eisection"><div class="pvmodulehead"><span>•</span><h3>Van buitenwereld naar bedrijfsactie</h3></div><article class="eicard"><h4>Source → evidence → signal → impact → actie → outcome → learning</h4><p>Een nieuwsfeit is nog geen bedrijfsimpact. De radar scheidt bronbewijs, signaalscore en bedrijfsspecifieke impact. Bedragen blijven onbekend totdat eigen exposure en bewijs bestaan.</p><div class="eifact"><b>Projectiescope</b><span>${esc(intelligence.projectionScope||'canonical')}</span></div><div class="eifact"><b>Truth policy</b><span>${esc(intelligence.truthPolicy||'measured_or_evidence_backed_else_unknown')}</span></div></article></section>
  ${section('Hoogste aandacht',signals.slice(0,12).map(x=>intelligenceSignalCard(x,domainMap)),'Nog geen verwerkte externe signalen. De broncatalogus en taxonomie zijn wel beschikbaar.')}
  ${section('Volgende acties',actions.slice(0,10).map(a=>`<article class="eicard"><div class="eimeta"><span>${esc(domainMap.get(a.domain_key)?.label||a.domain_key)}</span><span class="eistatus">${esc(score(a.priority_score))}/100</span></div><h4>${esc(a.title)}</h4><p>${esc(a.rationale)}</p><footer><span>${esc(a.status)}</span><span>${a.due_at?`voor ${esc(nlDate(a.due_at))}`:'geen harde deadline'}</span></footer></article>`),'Nog geen action candidates. Een kandidaat ontstaat alleen bij voldoende signaalbewijs.')}
  ${section('Volledig domeinuniversum',domainGroups)}
  ${section('Bronuniversum',catalog.slice(0,24).map(sourceCapabilityCard),'Nog geen broncatalogus beschikbaar.')}
  <p class="eifootnote">${esc(snap.status||'EMPTY')} · bijgewerkt ${esc(nlDate(snap.refreshed_at||data.stats?.generatedAt))} · catalogus betekent mogelijkheid, niet automatisch een actieve koppeling.</p>`;
  return shell(VIEWS.omgevingsradar.title,VIEWS.omgevingsradar.subtitle,body);
}
function renderHub(data){
  const {sourceMap,publications,signals,sources,stats}=enrich(data);
  const uwv=publisherFilter(publications,['UWV']);
  const rvo=publisherFilter(publications,['RVO']);
  const cbs=publisherFilter(publications,['CBS']);
  const nextLaws=komendeMijlpalen(new Date().toISOString().slice(0,10),365).slice(0,5);
  const cards=[
    ['Omgevingsradar',stats.intelligenceDomainCount||0,'domeinen','omgevingsradar'],
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
  if(pageId==='omgevingsradar')return renderEnvironmentRadar(data);
  const view=VIEWS[pageId]||VIEWS.ondernemersdata;
  const {sourceMap,publications,signals,sources,intelligence}=enrich(data);
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
    const capabilityRows=arr(intelligence.sourceCatalog).map(sourceCapabilityCard);
    return shell(view.title,view.subtitle,`${nav()}${section('Live geregistreerde bronnen',sourceRows)}${section('Source Universe · beschikbare bronmogelijkheden',capabilityRows,'Nog geen Source Universe catalogus beschikbaar.')}${section('Laatste publicaties',publications.slice(0,30).map(x=>sourceCard(x,sourceMap)))}`);
  }
  return shell(view.title,view.subtitle,`${nav()}${section(view.title,content,'Voor deze selectie zijn nu geen actuele records beschikbaar.')}`);
}

export async function entrepreneurAuthHeaders(identityProvider=ensureIdentityWidget){
  const headers={accept:'application/json'};
  const identity=await identityProvider().catch(()=>null);
  let token='';
  try{token=await identity?.currentUser?.()?.jwt?.()||'';}catch{}
  if(token)headers.authorization=`Bearer ${token}`;
  return headers;
}
export async function loadEntrepreneurData(fetchImpl=globalThis.fetch,identityProvider=ensureIdentityWidget){
  const headers=await entrepreneurAuthHeaders(identityProvider);
  const response=await fetchImpl('/api/portal-ondernemersdata',{headers,credentials:'same-origin'});
  if(response.status===401)throw new Error('Je sessie is verlopen. Log opnieuw in om actuele brondata te laden.');
  if(!response.ok)throw new Error('Actuele brondata is tijdelijk niet beschikbaar.');
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
      const data=await loadEntrepreneurData(fetchImpl);
      root.innerHTML=renderView(pageId,data);
      bind();
      if(force)root.querySelector('[data-ei-refresh]')?.focus();
    }catch(err){root.innerHTML=error(view,err?.message);bind();}
  };
  run(false);
  return {refresh:()=>run(true)};
}

export { renderView };
