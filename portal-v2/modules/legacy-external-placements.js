import { brancheProfiel, brancheVergelijking, onderzoekVoor, regelgevingVoor, BRONNEN } from '../external-data.js';
import { REGELGEVING, komendeMijlpalen, CATEGORIEEN } from '../regelgeving.js';

const arr=v=>Array.isArray(v)?v:[];
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const at=(state,path)=>String(path||'').split('.').filter(Boolean).reduce((v,k)=>v==null?undefined:v[k],state);
const num=(v,d=1)=>new Intl.NumberFormat('nl-NL',{minimumFractionDigits:d,maximumFractionDigits:d}).format(Number(v)||0);
const date=v=>{try{return new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short',year:'numeric'}).format(new Date(v));}catch{return String(v||'—')}};
const sourceUrl=name=>BRONNEN.find(b=>b.naam.toLowerCase().includes(String(name).toLowerCase()))?.url||'';

function card(title,body,extra=''){return `<article class="lexcard"><h3>${esc(title)}</h3>${body}${extra}</article>`;}
function kv(label,value,sub=''){return `<div class="lexkpi"><strong>${esc(value)}</strong><span>${esc(label)}</span>${sub?`<small>${esc(sub)}</small>`:''}</div>`;}
function sourceLine(html){return `<p class="lexsource"><b>Bron:</b> ${html}</p>`;}

async function liveFeed(fetchImpl=globalThis.fetch){
  try{
    const r=await fetchImpl('/api/portal-ondernemersdata',{headers:{accept:'application/json'},credentials:'same-origin'});
    if(!r.ok)return {sources:[],publications:[],signals:[]};
    return await r.json();
  }catch{return {sources:[],publications:[],signals:[]};}
}
async function branchData(fetchImpl=globalThis.fetch){
  try{
    const r=await fetchImpl('/assets/data/branche.json',{cache:'no-cache'});
    return r.ok?await r.json():null;
  }catch{return null;}
}
function sourceMap(data){return new Map(arr(data.sources).map(s=>[s.id,s]));}
function publisherItems(data,publisher,limit=3){
  const sm=sourceMap(data);
  return arr(data.publications).filter(p=>String(sm.get(p.bron_id)?.uitgever||'').toLowerCase()===publisher.toLowerCase()).slice(0,limit)
    .map(p=>`<div class="lexpub"><b>${esc(p.titel)}</b><span>${esc(date(p.publicatiedatum||p.opgehaald_op))}</span>${p.samenvatting?`<p>${esc(p.samenvatting).slice(0,260)}</p>`:''}${p.url?`<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Bekijk bron ↗</a>`:''}</div>`).join('');
}
function appendSection(root,id,title,html){
  root.querySelector('[data-legacy-external-placement]')?.remove();
  const s=document.createElement('section');s.dataset.legacyExternalPlacement=id;s.className='lexwrap';
  s.innerHTML=`<div class="lexhead"><span>Externe context · zoals in het vorige portaal</span><h2>${esc(title)}</h2></div>${html}`;
  root.appendChild(s);
}
function ownMetrics(state){
  const p=at(state,'portal.people')||{};
  const m=at(state,'portal.metrics')||{};
  return {absence:p.absence,turnover:p.turnover,enps:p.enps,grossMargin:m.grossMargin,ebitdaMargin:m.ebitdaMargin};
}

function renderPeople(root,state,live,branches){
  const industry=at(state,'portal.market.industry')||'Gemiddeld NL-bedrijf';
  const b=brancheProfiel(industry);
  const p=at(state,'portal.people')||{};
  const branchLive=branches?.branches?.[industry]||branches?.branches?.['Gemiddeld NL-bedrijf']||{};
  const compare=[
    ['Verzuim',p.absence,b?.verzuim,'%'],
    ['Verloop',p.turnover,b?.verloop,'%'],
    ['eNPS',p.enps,b?.enps,'']
  ];
  const cmp=compare.map(([label,eigen,norm,unit])=>`<div class="lexcompare"><b>${esc(label)}</b><span>jij ${eigen==null?'—':esc(num(eigen,1)+unit)}</span><span>branche ${norm==null?'—':esc(num(norm,1)+unit)}</span></div>`).join('');
  const uwv=publisherItems(live,'UWV',3);
  appendSection(root,'mensen','Tegenover je branche',
    `<div class="lexgrid two">${card('Tegenover je branche',`<div class="lexcomparegrid">${cmp}</div>${sourceLine('<a href="https://www.cbs.nl" target="_blank" rel="noopener noreferrer">CBS</a> · <a href="https://www.uwv.nl/nl/arbeidsmarktinformatie" target="_blank" rel="noopener noreferrer">UWV</a>')}`)}
    ${card('Arbeidsmarkt in je branche',`<div class="lexkpigrid">${kv('spanning',branchLive.spanning||'—')}${kv('spanningsindex',branchLive.index==null?'—':num(branchLive.index,1))}${kv('relevant beroep',branchLive.beroep||'—')}</div>${uwv||'<p class="lexempty">Geen recente UWV-publicaties beschikbaar.</p>'}`)}
    </div>`);
}
function renderBranch(root,state,live,branches){
  const industry=at(state,'portal.market.industry')||'Gemiddeld NL-bedrijf';
  const b=brancheProfiel(industry), nl=branches?.landelijk||{}, branchLive=branches?.branches?.[industry]||{};
  const rules=regelgevingVoor(industry);
  const eco=`<div class="lexkpigrid">${kv('groei economie',nl.groei==null?'—':num(nl.groei,1)+'%')}${kv('inflatie',nl.inflatie==null?'—':num(nl.inflatie,1)+'%')}${kv('loonstijging bedrijven',nl.loonstijging==null?'—':num(nl.loonstijging,1)+'%')}${kv('jouw sector',b?.groei==null?'—':(Number(b.groei)>=0?'+':'')+num(b.groei,1)+'%')}</div><p>Lonen, economie en sectorgroei staan hier naast je eigen brancheprofiel, zoals in het vorige portaal.</p>${sourceLine(`<a href="${esc(nl.url||'https://www.dnb.nl')}" target="_blank" rel="noopener noreferrer">${esc(nl.bron||'DNB')}</a> · <a href="https://www.rabobank.nl/kennis" target="_blank" rel="noopener noreferrer">RaboResearch</a>`) }`;
  const laws=`<ul class="lexlaws">${rules.regels.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="lexmuted">Dit is een signaleringslijst, geen juridisch advies. Toets per onderwerp of het op jouw omvang van toepassing is.</p>${rules.url?`<a class="lexlink" href="${esc(rules.url)}" target="_blank" rel="noopener noreferrer">${esc(rules.instantie||'Brancheorganisatie')} ↗</a>`:''}`;
  const liveCBS=publisherItems(live,'CBS',2);
  appendSection(root,'branche-markt','Je branche en je concurrenten',
   `<div class="lexgrid three">${card('Je branche en je concurrenten',`<div class="lexkpigrid">${kv('digitale intensiteit',b?num(b.dig,1)+'/5':'—')}${kv('toegevoegde waarde per vte',b?'€ '+Math.round(b.tw/1000)+'k':'—')}${kv('verzuim branche',b?num(b.verzuim,1)+'%':'—')}${kv('arbeidsmarkt',branchLive.spanning||'—')}</div><p><b>${esc(industry)}</b> — ${esc(b?.duiding||'')}</p>`)}
   ${card('De cijfers waar je in opereert',eco)}
   ${card('Wat er voor jouw sector geldt',laws)}
   </div>${liveCBS?`<div class="lexlive"><h3>Laatste CBS-publicaties</h3>${liveCBS}</div>`:''}
   ${sourceLine('<a href="https://www.cbs.nl" target="_blank" rel="noopener noreferrer">CBS</a> · <a href="https://www.rabobank.nl/kennis" target="_blank" rel="noopener noreferrer">RaboResearch</a> · <a href="https://www.dnb.nl" target="_blank" rel="noopener noreferrer">DNB</a> · brancheorganisaties')}`);
}
function renderResearch(root,state,live){
  const items=onderzoekVoor();
  const tiles=items.map(x=>`<article class="lexresearch"><strong>${esc(x.cijfer)}</strong><h4>${esc(x.t)}</h4><p>${esc(x.bev)}</p><div class="lexdo">${esc(x.advies||'')}</div><small>${esc(x.bron)}</small></article>`).join('');
  const liveRvo=publisherItems(live,'RVO',2), liveUwv=publisherItems(live,'UWV',2), liveCbs=publisherItems(live,'CBS',2);
  appendSection(root,'onderzoek','Onderzoek en bronnen',
   `<div class="lexresearchgrid">${tiles}</div>
    ${card('Hoe je deze cijfers moet lezen','<p>Deze onderzoeken zijn richtinggevend, geen norm voor één bedrijf. Gebruik ze naast je eigen cijfers en branchecontext.</p>')}
    <div class="lexgrid three">
      ${card('Statistiek','<p><a href="https://www.cbs.nl" target="_blank" rel="noopener noreferrer">CBS StatLine</a> · <a href="https://ec.europa.eu/eurostat" target="_blank" rel="noopener noreferrer">Eurostat / DESI</a> · <a href="https://www.uwv.nl/nl/arbeidsmarktinformatie" target="_blank" rel="noopener noreferrer">UWV</a></p>'+liveCbs+liveUwv)}
      ${card('Economie en beleid','<p><a href="https://www.dnb.nl" target="_blank" rel="noopener noreferrer">DNB</a> · <a href="https://www.rabobank.nl/kennis" target="_blank" rel="noopener noreferrer">RaboResearch</a> · <a href="https://www.rvo.nl" target="_blank" rel="noopener noreferrer">RVO</a></p>'+liveRvo)}
      ${card('Onderzoek en advies','<p>McKinsey · BCG · Gartner · Forrester · MIT · RAND · Stanford AI Index · Nyenrode · Panteia</p>')}
    </div>`);
}
function renderCompliance(root,state){
  const upcoming=komendeMijlpalen(new Date().toISOString().slice(0,10),730).slice(0,12);
  const rows=upcoming.map(m=>{
    const law=REGELGEVING.find(r=>r.naam===m.regel);
    return `<div class="lexdeadline"><div><b>${esc(m.regel)}</b><p>${esc(m.wat)}</p></div><time>${esc(date(m.datum))}</time>${law?.url?`<a href="${esc(law.url)}" target="_blank" rel="noopener noreferrer">${esc(law.bron||'bron')} ↗</a>`:''}</div>`;
  }).join('');
  const active=REGELGEVING.filter(r=>r.status==='geldt'||r.status==='gefaseerd').slice(0,8).map(r=>`<div class="lexrule"><b>${esc(r.naam)}</b><span>${esc(CATEGORIEEN[r.categorie]||r.categorie)} · ${esc(r.status)}</span><p>${esc(r.raakt)}</p></div>`).join('');
  appendSection(root,'compliance-governance','Deadlines en boetes',
    `<div class="lexgrid two">${card('Deadlines en boetes',`<div class="lexdeadlines">${rows}</div><p class="lexmuted">Sancties en toepasselijkheid verschillen per regel en situatie. Gebruik altijd de officiële bron bij een besluit.</p>`)}${card('Wat geldt al',active)}</div>`);
}

export async function mountLegacyExternalPlacements(root,{pageId,state,fetchImpl=globalThis.fetch}={}){
  if(!root||!['mensen','branche-markt','onderzoek','compliance-governance'].includes(pageId))return null;
  const model=state||{};
  const [live,branches]=await Promise.all([liveFeed(fetchImpl),branchData(fetchImpl)]);
  if(pageId==='mensen')renderPeople(root,model,live,branches);
  if(pageId==='branche-markt')renderBranch(root,model,live,branches);
  if(pageId==='onderzoek')renderResearch(root,model,live);
  if(pageId==='compliance-governance')renderCompliance(root,model);
  return {pageId};
}
