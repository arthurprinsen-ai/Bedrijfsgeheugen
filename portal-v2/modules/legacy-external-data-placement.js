import { BRANCHES, BRONNEN, ONDERZOEK, brancheProfiel, regelgevingVoor } from '../external-data.js';
import { REGELGEVING, komendeMijlpalen } from '../regelgeving.js';

const PAGES=new Set(['mensen','branche-markt','onderzoek','compliance-governance']);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const at=(state,path)=>String(path).split('.').reduce((v,k)=>v==null?undefined:v[k],state);
const num=(v,d=1)=>Number.isFinite(Number(v))?Number(v).toLocaleString('nl-NL',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const pct=(v,d=1)=>Number.isFinite(Number(v))?num(v,d)+'%':'—';
const absoluteUrl=url=>/^https?:\/\//i.test(String(url||''))?String(url):'';
const link=(url,label)=>{const href=absoluteUrl(url);return href?'<a href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a>':esc(label)};
let branchePromise;

function loadBrancheData(fetchImpl=globalThis.fetch){
  if(!branchePromise)branchePromise=fetchImpl('/assets/data/branche.json',{cache:'no-cache'}).then(r=>r.ok?r.json():Promise.reject(new Error('branche.json '+r.status))).catch(()=>null);
  return branchePromise;
}
function brancheNaam(state){return at(state,'portal.market.industry')||'Gemiddeld NL-bedrijf'}
function person(state,key){return at(state,'portal.people.'+key)}
function card(title,body,attrs=''){return '<section class="legacy-data-card" '+attrs+'><h3>'+esc(title)+'</h3>'+body+'</section>'}
function module(title,body){return '<section class="pvmodule legacy-data-placement"><div class="pvmodulehead"><span>↳</span><h3>'+esc(title)+'</h3></div>'+body+'</section>'}

function benchmarkBar(label,eigen,norm,{inverse=false,enps=false}={}){
  const own=Number(eigen), target=Number(norm), has=Number.isFinite(own), scale=enps?200:Math.max(Math.abs(has?own:0),Math.abs(target),1)*1.3;
  const map=v=>enps?Math.max(0,Math.min(100,(Number(v)+100)/2)):Math.max(0,Math.min(100,(Number(v)/scale)*100));
  const ownP=has?map(own):0, normP=map(target);
  const good=has&&(inverse?own<=target:own>=target);
  const ownLabel=has?(enps?num(own,0):pct(own,1)):'niet ingevuld';
  const normLabel=enps?num(target,0):pct(target,1);
  return '<div class="legacy-benchmark-row"><div class="legacy-benchmark-head"><b>'+esc(label)+'</b><span>jij '+esc(ownLabel)+' · norm '+esc(normLabel)+'</span></div><div class="legacy-benchmark-track"><i class="'+(has?(good?'good':'attention'):'empty')+'" style="width:'+ownP.toFixed(1)+'%"></i><em style="left:'+normP.toFixed(1)+'%" aria-label="branchenorm"></em></div></div>';
}

function people(state,live){
  const name=brancheNaam(state), base=brancheProfiel(name)||brancheProfiel(), dynamic=live?.branches?.[name]||{};
  const b={...base,...dynamic,krapte:dynamic.index??base?.krapte,beroep:dynamic.beroep??base?.beroep,spanning:dynamic.spanning??base?.spanning};
  const source=(live?.bronnen||[]).find(x=>/UWV/i.test(x.naam||''))||{url:'https://www.uwv.nl/nl/arbeidsmarktinformatie'};
  const body=
    '<div class="legacy-two-col">'+
      card('Tegenover je branche',
        '<div class="legacy-benchmark">'+
          benchmarkBar('Ziekteverzuim',person(state,'absence'),b.verzuim,{inverse:true})+
          benchmarkBar('Verloop',person(state,'turnover'),b.verloop,{inverse:true})+
          benchmarkBar('eNPS',person(state,'enps'),b.enps,{enps:true})+
        '</div>'+
        '<p class="legacy-source">Verzuim: CBS per bedrijfstak. Verloop en eNPS: HR-bandbreedtes, indicatief.'+
        (b.spanning?'<br><b>Arbeidsmarkt:</b> in '+esc(name.toLowerCase())+' is de markt <b>'+esc(b.spanning)+'</b>'+
          (Number.isFinite(Number(b.krapte))?' (spanningsindicator '+esc(num(b.krapte,1))+')':'')+
          (b.beroep&&b.beroep!=='—'?'; het krapste beroep is '+esc(b.beroep):'')+
          '. Bron: '+link(source.url,'UWV Arbeidsmarktprognose')+'.':'')+'</p>','data-legacy-element="mGrafiek mBron"')+
      card('Wat dit betekent',
        '<p class="legacy-copy">Deze vergelijking staat, net als in het oude portaal, op de pagina <b>Mensen</b>. De actuele externe arbeidsmarktcontext hoort hier bij personeelsplanning en kennisrisico — niet alleen in een aparte databibliotheek.</p>','data-legacy-element="mUitleg"')+
    '</div>';
  return module('Mensen · externe context op de oorspronkelijke plek',body);
}

function branchPlot(name){
  const entries=Object.entries(BRANCHES).filter(([n])=>n!=='Gemiddeld NL-bedrijf');
  return '<div class="legacy-sector-plot" role="img" aria-label="Digitale intensiteit en productiviteit per branche">'+entries.map(([n,b])=>{
    const x=Math.max(4,Math.min(94,((b.dig-1)/4)*100));
    const y=Math.max(6,Math.min(92,100-((b.tw-40000)/110000)*100));
    return '<span class="'+(n===name?'current':'')+'" style="left:'+x.toFixed(1)+'%;top:'+y.toFixed(1)+'%" title="'+esc(n)+' · digitale intensiteit '+esc(num(b.dig,1))+' · toegevoegde waarde € '+esc(num(b.tw/1000,0))+'k"><i></i><b>'+esc(n)+'</b></span>';
  }).join('')+'<div class="legacy-axis x">minder gedigitaliseerd <b>→</b> meer</div></div>';
}

function branch(state,live){
  const name=brancheNaam(state), base=brancheProfiel(name)||brancheProfiel();
  const dynamic=live?.branches?.[name]||{}, b={...base,...dynamic};
  const national=live?.landelijk||{groei:0.8,inflatie:2.7,loonstijging:4.0,bron:'DNB Voorjaarsraming juni 2026',url:'https://www.dnb.nl/publicaties/publicaties-dnb/eov/voorjaarsraming-2026/'};
  const rules=regelgevingVoor(name);
  const body=
    card('Je branche en je concurrenten',
      '<div class="legacy-kpis"><div><small>Branche</small><strong>'+esc(name)+'</strong></div><div><small>Digitale intensiteit</small><strong>'+esc(num(b.dig,1))+'/5</strong></div><div><small>Verzuim in je branche</small><strong>'+esc(pct(b.verzuim,1))+'</strong></div></div>'+
      branchPlot(name)+
      '<div class="legacy-highlight"><b>'+esc(name)+'</b> — groeiverwachting toegevoegde waarde <b>'+(Number(b.groei)>=0?'+':'')+esc(pct(b.groei,1))+'</b>.<br>'+esc(b.duiding||'')+
      (b.inst?'<br><span>Brancheorganisatie: '+link(b.url,b.inst)+'</span>':'')+'</div>','data-legacy-element="bKpis bGrafiek bTekst"')+
    '<div class="legacy-two-col">'+
      card('De cijfers waar je in opereert',
        '<div class="legacy-economy-grid"><div><strong>'+esc(pct(national.groei,1))+'</strong><span>groei economie</span></div><div><strong>'+esc(pct(national.inflatie,1))+'</strong><span>inflatie</span></div><div><strong>'+esc(pct(national.loonstijging,1))+'</strong><span>loonstijging bedrijven</span></div><div><strong>'+(Number(b.groei)>=0?'+':'')+esc(pct(b.groei,1))+'</strong><span>jouw sector</span></div></div>'+
        '<p class="legacy-copy">Lonen stijgen harder dan de economie groeit. Wie zijn tarieven niet evenredig verhoogt, verliest marge — tenzij er per medewerker meer werk uit dezelfde uren komt.</p>'+
        '<p class="legacy-source">Bron: '+esc(national.bron||'DNB')+' · RaboResearch Sectorprognoses. Cijfers bijgewerkt op '+esc(live?.bijgewerkt||'2026-08-06')+'. '+link(national.url,'bekijk de bron')+'</p>','data-legacy-element="bEco"')+
      card('Wat er voor jouw sector geldt',
        '<ul class="legacy-law-list">'+(rules.regels||[]).map(w=>'<li>'+esc(w)+'</li>').join('')+'</ul>'+
        '<p class="legacy-source">Dit is een signaleringslijst, geen juridisch advies. Toets per onderwerp of het op jouw omvang van toepassing is.'+
        (rules.instantie?' Branchecontext: '+link(rules.url,rules.instantie)+'.':'')+'</p>','data-legacy-element="bWet"')+
    '</div>'+
    '<p class="legacy-source legacy-wide">Bronnen: CBS Ziekteverzuimpercentage per bedrijfstak · CBS Digitalisering en arbeidsproductiviteit · CBS ICT-gebruik bedrijven · RaboResearch Sectorprognoses · DNB · brancheorganisaties per sector. Bandbreedtes voor het mkb, geen normcijfers voor één bedrijf.</p>';
  return module('Branche & markt · oude portalopbouw hersteld',body);
}

function research(state){
  const dims=[...new Set(ONDERZOEK.map(x=>x.dim))];
  const cards=ONDERZOEK.map(item=>{
    const own=at(state,'portal.profile.maturity.'+item.dim)??at(state,'portal.profile.dimensions.'+item.dim)??null;
    return '<article class="legacy-research-card" data-research-dim="'+esc(item.dim)+'"><div class="legacy-research-top"><b>'+esc(item.t)+'</b><strong>'+esc(item.cijfer)+'</strong></div><p>'+esc(item.bev)+'</p><small>'+esc(item.bron)+(own!=null?' · bij jullie: niveau '+esc(own):'')+'</small><div class="legacy-do"><b>Voor jullie:</b> '+esc(item.advies)+'</div></article>';
  }).join('');
  const sourceGroups=[
    ['Statistiek',BRONNEN.filter(x=>x.soort==='Statistiek'||/UWV/i.test(x.naam)).map(x=>link(x.url,x.naam)).join(' · ')],
    ['Economie en beleid',BRONNEN.filter(x=>x.soort==='Economie'||/RVO/i.test(x.naam)).map(x=>link(x.url,x.naam)).join(' · ')],
    ['Onderzoek en advies',BRONNEN.filter(x=>['Onderzoek','Universiteit'].includes(x.soort)).map(x=>link(x.url,x.naam)).join(' · ')]
  ];
  return module('Onderzoek · externe bevindingen en bronnen op de oorspronkelijke plek',
    '<p class="legacy-intro">Wat grote onderzoeksbureaus meten, naast waar jij staat. Elk cijfer met de bron erbij — je kunt het nazoeken.</p>'+
    '<div class="legacy-filter" role="group" aria-label="Onderzoeksfilter"><button type="button" data-legacy-filter="alles" aria-pressed="true">Alles ('+ONDERZOEK.length+')</button>'+
      dims.map(d=>'<button type="button" data-legacy-filter="'+esc(d)+'" aria-pressed="false">'+esc(d)+' ('+ONDERZOEK.filter(x=>x.dim===d).length+')</button>').join('')+'</div>'+
    '<div class="legacy-research-grid">'+cards+'</div>'+
    card('Hoe je deze cijfers moet lezen',
      '<p class="legacy-copy">Deze onderzoeken gaan grotendeels over grote ondernemingen. Ze zijn nuttig als <b>richting</b>, niet als norm. Waar ze wél direct op slaan: het patroon dat bijna iedereen begint en veel organisaties moeite hebben om door te pakken.</p>'+
      '<div class="legacy-source-groups">'+sourceGroups.map(([title,items])=>'<div><b>'+esc(title)+'</b><p>'+items+'</p></div>').join('')+'</div>'+
      '<p class="legacy-source">Cijfers uit publieke samenvattingen en open data. Gebruik onderzoek van adviesbureaus als richting, niet als norm voor een bedrijf van jouw omvang.</p>','data-legacy-element="ondBlok ondFilter"')
  );
}

function compliance(){
  const milestones=komendeMijlpalen(new Date().toISOString().slice(0,10),730).slice(0,12);
  const rules=new Map(REGELGEVING.map(r=>[r.id,r]));
  const rows=milestones.map(m=>{
    const rule=rules.get(m.id)||REGELGEVING.find(r=>r.naam===m.regel);
    return '<div class="legacy-deadline-row"><div><b>'+esc(m.regel)+'</b><span>'+esc(m.datum)+'</span></div><p>'+esc(m.wat)+'</p>'+(rule?.url?'<small>'+link(rule.url,rule.bron||'Officiële bron')+' · nagekeken '+esc(rule.peildatum||'')+'</small>':'')+'</div>';
  }).join('');
  return module('Compliance · deadlines en regelgeving op de oorspronkelijke plek',
    '<div class="legacy-two-col">'+
      card('Deadlines en verplichtingen',rows||'<p class="legacy-copy">Geen komende mijlpalen gevonden.</p>','data-legacy-element="naleving"')+
      card('Regels die je raken','<div class="legacy-rule-stack">'+REGELGEVING.slice(0,10).map(r=>'<div><b>'+esc(r.naam)+'</b><span>'+esc(r.status)+'</span><p>'+esc(r.wat)+'</p></div>').join('')+'</div><p class="legacy-source">Deze lijst gebruikt het actuele V2-regelgevingsregister. Toepasselijkheid moet per onderneming worden vastgesteld.</p>')+
    '</div>');
}

function bindResearch(root){
  const buttons=root.querySelectorAll('[data-legacy-filter]');
  if(!buttons.length)return;
  buttons.forEach(btn=>btn.addEventListener('click',()=>{
    const selected=btn.dataset.legacyFilter;
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));
    root.querySelectorAll('[data-research-dim]').forEach(card=>{card.hidden=selected!=='alles'&&card.dataset.researchDim!==selected;});
  }));
}

export async function mountLegacyExternalDataPlacement(root,{pageId,state={},fetchImpl=globalThis.fetch}={}){
  if(!root||!PAGES.has(pageId))return false;
  root.querySelectorAll('.legacy-data-placement').forEach(node=>node.remove());
  let html='';
  if(pageId==='onderzoek')html=research(state);
  else if(pageId==='compliance-governance')html=compliance();
  else {
    const live=await loadBrancheData(fetchImpl);
    html=pageId==='mensen'?people(state,live):branch(state,live);
  }
  root.insertAdjacentHTML('beforeend',html);
  if(pageId==='onderzoek')bindResearch(root);
  return true;
}

export { PAGES as LEGACY_EXTERNAL_DATA_PAGES };
