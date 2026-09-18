import { PROFILE_DIMENSIONS, profileOverviewMetrics } from './company-input.js';
import { calculateLegacyEquivalent } from '../legacy-parity-engine.js';

const FACTOR=Object.freeze([0,1,.78,.5,.22,.06]);
const LEVEL_LABELS=Object.freeze(['','in hoofden','in lijstjes','in systemen','verbonden','zelfsturend']);
const SHARPNESS_BANDS=Object.freeze([
 {min:0,label:'Nog geen beeld',tone:'muted',text:'Wat je nu aan advies krijgt is een algemeen verhaal. Het kan over elk bedrijf gaan.'},
 {min:25,label:'Ruwe schets',tone:'warn',text:'Genoeg voor een richting, te weinig voor een besluit. De bedragen zijn nog schattingen op standaardaannames.'},
 {min:50,label:'Bruikbaar',tone:'blue',text:'Hier kun je mee werken. De volgorde van wat je als eerste aanpakt klopt nu waarschijnlijk.'},
 {min:75,label:'Scherp',tone:'good',text:'Het advies rust op jouw cijfers, niet op aannames. Wat hier bovenaan staat, is ook echt jouw grootste lek.'},
 {min:90,label:'Compleet',tone:'good',text:'Alles staat erin. Dit is het niveau waarop een adviseur zonder voorbehoud een voorstel kan doen.'}
]);
const STAGES=Object.freeze([
 {name:'Ad-hoc en Excel',segment:'Achterblijvers'},
 {name:'Reactief en rapporterend',segment:'Late majority'},
 {name:'Gestuurd met BI',segment:'Early majority'},
 {name:'Proactief en voorspellend',segment:'Early adopters'},
 {name:'Datagedreven en zelfsturend',segment:'Innovators'}
]);

const css=`
.legacy-complete{display:grid;gap:14px;margin:12px 0}
.legacy-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.legacy-card{background:#fff;border:1px solid var(--line,#e5eaf5);border-radius:18px;padding:18px;box-shadow:var(--shadow,0 10px 30px rgba(28,55,118,.08));min-width:0}
.legacy-card h3{margin:0 0 6px;font-size:18px}.legacy-card p{margin:0;color:#5c6682;line-height:1.5}
.legacy-kicker{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px}.legacy-kicker small{font-weight:800;color:#6f7892}.legacy-kicker strong{font-size:18px}
.legacy-state-track{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:14px}.legacy-state-step{padding:10px 6px;border-radius:12px;background:#f4f6fb;text-align:center;font-size:10px}.legacy-state-step.active{background:#eaf2ff;color:#125fd9}.legacy-state-step.current{box-shadow:inset 0 0 0 2px #1769ff}.legacy-state-step b{display:block;font-size:11px;margin-top:4px}
.legacy-cmmi{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;align-items:end;margin-top:14px}.legacy-cmmi div{background:#f0f2f7;border-radius:10px 10px 4px 4px;padding:8px 6px;text-align:center;font-size:10px}.legacy-cmmi div:nth-child(1){height:68px}.legacy-cmmi div:nth-child(2){height:84px}.legacy-cmmi div:nth-child(3){height:100px}.legacy-cmmi div:nth-child(4){height:116px}.legacy-cmmi div:nth-child(5){height:132px}.legacy-cmmi .active{background:#e9f1ff;color:#0e5bd7}.legacy-cmmi .current{outline:2px solid #1769ff}.legacy-cmmi b{display:block;font-size:18px}
.legacy-donut-row{display:grid;grid-template-columns:minmax(160px,220px) 1fr;gap:16px;align-items:center}.legacy-donut-wrap{position:relative;aspect-ratio:1}.legacy-donut-svg{width:100%;height:100%;transform:rotate(-90deg)}.legacy-donut-segment{cursor:pointer;transition:opacity .15s,stroke-width .15s}.legacy-donut-segment:hover{opacity:.78;stroke-width:22}.legacy-donut-center{position:absolute;inset:0;display:grid;place-content:center;text-align:center;pointer-events:none}.legacy-donut-center strong{font-size:28px}.legacy-donut-center span{font-size:11px;color:#6d7486}.legacy-adoption-svg{width:100%;height:auto;margin-top:10px}.legacy-adoption-axis{stroke:#d9dee8;stroke-width:1}.legacy-adoption-curve{fill:#eef3ff;stroke:#315be8;stroke-width:2}.legacy-adoption-marker{stroke-width:2}.legacy-adoption-label{font-size:9px;fill:#59637a}.legacy-adoption-dot{stroke:#fff;stroke-width:2}
.legacy-cost-list,.legacy-blockers{display:grid}.legacy-cost-row,.legacy-blocker-row{display:grid;grid-template-columns:1fr auto;gap:10px;padding:9px 0;border-bottom:1px solid #e7e9ef;align-items:center}.legacy-cost-row button,.legacy-blocker-row button{all:unset;cursor:pointer;display:contents}.legacy-cost-row span,.legacy-blocker-row span{min-width:0}.legacy-cost-row small,.legacy-blocker-row small{color:#747c8f}.legacy-first{margin-top:12px;padding:12px 14px;border-left:4px solid #f1c232;background:#fffaf0;border-radius:8px;line-height:1.55}
.legacy-sharpness{display:grid;grid-template-columns:170px 1fr;gap:18px;align-items:start}.legacy-ring{--pct:0;position:relative;width:150px;aspect-ratio:1;border-radius:50%;background:conic-gradient(#e7a516 calc(var(--pct)*1%),#edf0f5 0)}.legacy-ring:after{content:'';position:absolute;inset:16px;background:#fff;border-radius:50%}.legacy-ring-center{position:absolute;inset:0;z-index:1;display:grid;place-content:center;text-align:center}.legacy-ring-center strong{font-size:40px}.legacy-ring-center span{color:#6a7182}
.legacy-band{display:inline-block;padding:5px 10px;border-radius:999px;background:#fff3d6;color:#8a6100;font-weight:800;font-size:12px;margin-bottom:8px}.legacy-progress-list{display:grid;gap:11px;margin-top:15px}.legacy-progress-row{display:grid;grid-template-columns:1fr 48px;gap:10px;align-items:end}.legacy-progress-row .bar{height:8px;background:#edf0f5;border-radius:99px;overflow:hidden;margin-top:5px}.legacy-progress-row .bar i{display:block;height:100%;background:#1e9e5a;border-radius:99px}.legacy-progress-row strong{text-align:right}.legacy-progress-row.warn .bar i{background:#e7a516}.legacy-progress-row.zero .bar i{background:#ef612f}
.legacy-next{margin-top:14px;padding:14px;border:1px solid #eedb9b;background:#fffaf0;border-radius:14px}.legacy-next h4{margin:0 0 5px}.legacy-next button{border:0;background:transparent;padding:8px 0 0;color:#2149d8;font-weight:800;text-decoration:underline}
.legacy-roadmap-progress{height:12px;border-radius:99px;background:#edf0f5;overflow:hidden;margin:12px 0}.legacy-roadmap-progress i{display:block;height:100%;background:#e7a516}.legacy-advice-list{display:grid;gap:8px;margin-top:10px}.legacy-advice-list button{border:1px solid #e7eaf1;background:#fff;border-radius:12px;padding:11px;text-align:left;font-weight:700}
@media(max-width:780px){.legacy-grid2{grid-template-columns:1fr}.legacy-donut-row,.legacy-sharpness{grid-template-columns:1fr}.legacy-donut-wrap{width:min(220px,70vw);margin:auto}.legacy-ring{margin:auto}.legacy-state-track{grid-template-columns:1fr}.legacy-cmmi{overflow-x:auto;grid-template-columns:repeat(5,minmax(90px,1fr))}}
`;

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const euro=v=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(num(v));
const nl=v=>new Intl.NumberFormat('nl-NL',{maximumFractionDigits:0}).format(num(v));
const clamp=(v,min=0,max=100)=>Math.max(min,Math.min(max,num(v)));

function profile(state){return state?.portal?.profile||{}}
function metrics(state){return state?.portal?.metrics||{}}
function level(state,id){const v=num(profile(state).maturity?.[id]);return v>=1&&v<=5?v:2}
function branch(state){return state?.portal?.market?.industry||profile(state).industry||profile(state).branch||''}
function revenue(state){return metrics(state).revenue??profile(state).revenue??''}
function roadmap(state){return Array.isArray(state?.portal?.roadmap?.items)?state.portal.roadmap.items:[]}
function advice(state){return Array.isArray(state?.portal?.advice?.items)?state.portal.advice.items:[]}
function aiCapabilities(state){const x=state?.portal?.aiCapabilities;return x&&typeof x==='object'?x:{}}
function aiCapabilitySource(state){const x=state?.portal?.aiCapabilitySources||state?.portal?.aiCapabilitiesFromScan||{};return x&&typeof x==='object'?x:{}}

function bandFor(pct){let found=SHARPNESS_BANDS[0];for(const band of SHARPNESS_BANDS)if(pct>=band.min)found=band;return found}
function isDone(item){return item?.done===true||item?.klaar===true||['Gereed','Afgerond','Done','Completed'].includes(item?.status)}
function profileCompleteness(state){
 const p=profile(state);const values=[p.employees||p.headcount,p.hourlyCost,branch(state),revenue(state)];
 return {filled:values.filter(v=>v!==undefined&&v!==null&&v!=='').length,total:4};
}
function dimensionCompleteness(state){
 const p=profile(state);const values=PROFILE_DIMENSIONS.map(d=>p.maturity?.[d.id]);
 const explicit=values.filter(v=>v!==undefined&&v!==null&&v!=='').length;
 return {filled:explicit,total:PROFILE_DIMENSIONS.length};
}
function capabilityCompleteness(state){
 const caps=aiCapabilities(state),src=aiCapabilitySource(state);const entries=Object.entries(caps).filter(([,v])=>num(v)>0);
 const self=entries.filter(([k])=>!src[k]).length;const scan=entries.filter(([k])=>Boolean(src[k])).length;
 const total=Math.max(86,Object.keys(caps).length||0);
 return {self,scan,total,pct:total?Math.round((self+scan*.5)/total*100):0};
}
function roadmapCompleteness(state){
 const items=roadmap(state),done=items.filter(isDone).length;
 return {done,total:items.length,pct:items.length?Math.round(40+60*(done/items.length)):0};
}
export function legacySharpnessModel(state={}){
 const pc=profileCompleteness(state),dc=dimensionCompleteness(state),ac=capabilityCompleteness(state),rc=roadmapCompleteness(state);
 const blocks=[
  {id:'profile',label:'Je bedrijfsgegevens',detail:`${pc.filled} van ${pc.total} ingevuld`,pct:Math.round(pc.filled/pc.total*100),page:'profiel'},
  {id:'dimensions',label:'De dertien onderdelen',detail:`${dc.filled} van ${dc.total} ingevuld`,pct:Math.round(dc.filled/dc.total*100),page:'profiel'},
  {id:'capabilities',label:'De 86 AI-capabilities',detail:`${ac.self} zelf beantwoord van ${ac.total}`,pct:ac.pct,page:'ai-capabilities'},
  {id:'roadmap',label:'Acties in je roadmap',detail:`${rc.done} van ${rc.total} afgerond`,pct:rc.pct,page:'roadmap'}
 ];
 const total=Math.round(blocks[0].pct*.15+blocks[1].pct*.25+blocks[2].pct*.30+blocks[3].pct*.30);
 return Object.freeze({total,band:bandFor(total),blocks:Object.freeze(blocks),next:nextStep(state,{pc,dc,ac,rc})});
}
function nextStep(state,{pc,dc,ac,rc}){
 const p=profile(state);
 if(pc.filled<4){
  const missing=[];if(!(p.employees||p.headcount))missing.push('medewerkers');if(!p.hourlyCost)missing.push('uurkosten');if(!branch(state))missing.push('branche');if(!revenue(state))missing.push('omzet');
  return {title:`Vul ${missing.join(', ')} in onder Profiel`,why:'Zonder die gegevens is elk bedrag hier een aanname. Het is een minuut werk.',page:'profiel'};
 }
 if(dc.filled<dc.total)return {title:'Zet de dertien onderdelen op je eigen stand',why:'Daarmee weet het portaal waar je tijd weglekt, en niet alleen dát het weglekt.',page:'profiel'};
 if(ac.self<ac.total)return {title:`Beantwoord de laatste ${Math.max(0,ac.total-ac.self)} AI-capabilities`,why:'Wat je openlaat, telt niet mee en verdwijnt dus uit je advies.',page:'ai-capabilities'};
 if(!rc.total)return {title:'Zet je eerste acties klaar',why:'Een beeld zonder acties verandert niets. Onder Advies staat wat het meeste oplevert.',page:'advies'};
 if(rc.done<rc.total)return {title:`Rond ${rc.total-rc.done} openstaande acties af`,why:'Dit is het deel dat je voortgang en gerealiseerde waarde aantoonbaar beweegt.',page:'roadmap'};
 return {title:'Je bent rond — houd het actueel',why:'Nieuwe cijfers, besluiten en veranderingen moeten in de Powerhouse-state terugkomen.',page:'actueel-houden'};
}

export function legacyOverviewCompleteModel(state={}){
 const costs=calculateLegacyEquivalent('dimension-costs',state);
 const total=costs.reduce((s,x)=>s+num(x.kosten),0);
 const top=costs.slice(0,4);
 const avg=calculateLegacyEquivalent('average-maturity',state)||profileOverviewMetrics(state).averageMaturity;
 const cmmi=Math.max(1,Math.min(5,Math.round(avg||1)));
 const r=roadmapCompleteness(state);
 const branchLevel=num(state?.portal?.market?.digitalMaturity||state?.portal?.market?.benchmarkDigitalMaturity);return Object.freeze({costs,total,top,avg,cmmi,stage:STAGES[cmmi-1],branchLevel:branchLevel>=1&&branchLevel<=5?branchLevel:null,targetLevel:4,sharpness:legacySharpnessModel(state),roadmap:r,advice:advice(state).slice(0,5)});
}

function ensureStyle(doc){if(!doc?.head||doc.getElementById('legacy-complete-style'))return;const style=doc.createElement('style');style.id='legacy-complete-style';style.textContent=css;doc.head.appendChild(style)}
function progressRows(model){return model.blocks.map(x=>`<div class="legacy-progress-row ${x.pct===0?'zero':x.pct<50?'warn':''}"><div><div><b>${esc(x.label)}</b> · <span>${esc(x.detail)}</span></div><div class="bar"><i style="width:${clamp(x.pct)}%"></i></div></div><strong>${clamp(x.pct)}%</strong></div>`).join('')}
function adoptionMarkup(model){return STAGES.map((s,i)=>`<div class="legacy-state-step ${i+1<=model.cmmi?'active':''} ${i+1===model.cmmi?'current':''}"><span>${esc(s.segment)}</span><b>${esc(s.name)}</b><small>Niveau ${i+1}</small></div>`).join('')}
function donutMarkup(model){
 const colors=['#315be8','#efa800','#229c5a','#7157d9','#48c3bb','#8ea1c9','#da6b56','#9bb04b','#d052a2','#5e7bdb','#e27d37','#31a6a0','#78856a'];
 let offset=0;
 const circles=model.costs.map((x,i)=>{const pct=model.total?x.kosten/model.total*100:0;const start=offset;offset+=pct;return `<circle class="legacy-donut-segment" data-legacy-page="businesscase" cx="50" cy="50" r="34" pathLength="100" fill="none" stroke="${colors[i%colors.length]}" stroke-width="18" stroke-dasharray="${pct} ${100-pct}" stroke-dashoffset="${-start}"><title>${esc(x.label)} · ${euro(x.kosten)} · ${esc(LEVEL_LABELS[x.niveau]||'onbekend')}</title></circle>`}).join('');
 return `<div class="legacy-donut-wrap"><svg class="legacy-donut-svg" viewBox="0 0 100 100" role="img" aria-label="Waar de tijd weglekt, verdeeld over bedrijfsonderdelen"><circle cx="50" cy="50" r="34" pathLength="100" fill="none" stroke="#edf0f5" stroke-width="18"/>${circles}</svg><div class="legacy-donut-center"><strong>${euro(model.total)}</strong><span>per jaar</span></div></div>`;
}
function adoptionCurveMarkup(model){
 const x=level=>18+(clamp(level,1,5)-1)*66/4;
 const current=x(model.avg||1),target=x(model.targetLevel||4),branch=model.branchLevel?x(model.branchLevel):null;
 const branchMarkup=branch==null?'':`<line x1="${branch}" x2="${branch}" y1="45" y2="82" class="legacy-adoption-marker" stroke="#e0a000"/><circle cx="${branch}" cy="61" r="3.5" class="legacy-adoption-dot" fill="#e0a000"/><text x="${branch}" y="91" text-anchor="middle" class="legacy-adoption-label">branche</text>`;
 return `<svg class="legacy-adoption-svg" viewBox="0 0 100 96" role="img" aria-label="Adoptiecurve met eigen positie, branche indien bekend en doel"><line x1="8" x2="94" y1="82" y2="82" class="legacy-adoption-axis"/><path d="M8 82 C20 82 24 31 48 20 C68 10 76 56 94 82 L94 82 Z" class="legacy-adoption-curve"/><line x1="${target}" x2="${target}" y1="28" y2="82" class="legacy-adoption-marker" stroke="#7c879f" stroke-dasharray="2 2"/><text x="${target}" y="18" text-anchor="middle" class="legacy-adoption-label">bovenste 25% / doel</text>${branchMarkup}<line x1="${current}" x2="${current}" y1="39" y2="82" class="legacy-adoption-marker" stroke="#1b5eea"/><circle cx="${current}" cy="54" r="4.2" class="legacy-adoption-dot" fill="#1b5eea"/><text x="${current}" y="72" text-anchor="middle" class="legacy-adoption-label">jij</text></svg>`;
}
function cmmiMarkup(model){return STAGES.map((s,i)=>`<div class="${i+1<=model.cmmi?'active':''} ${i+1===model.cmmi?'current':''}"><b>${i+1}</b><span>${esc(s.name)}</span></div>`).join('')}

export function renderLegacyOverviewComplete(root,state={},openPage=()=>{}){
 const main=root?.querySelector?.('.main');if(!main)return false;ensureStyle(root.ownerDocument||document);
 let section=main.querySelector('[data-legacy-complete]');if(!section){section=(root.ownerDocument||document).createElement('section');section.className='legacy-complete';section.dataset.legacyComplete='true';const anchor=main.querySelector('.dashboard')||main.querySelector('.lower');main.insertBefore(section,anchor||null)}
 const m=legacyOverviewCompleteModel(state);
 const first=m.top[0];
 section.innerHTML=`
 <div class="legacy-card"><div class="legacy-kicker"><small>De staat van je bedrijf</small><strong>${m.avg?m.avg.toFixed(1):'—'}/5</strong></div><h3>${esc(m.stage?.name||'Nog niet bepaald')}</h3><p>Vijf stadia. Waar jij staat, waar je branche staat en waar de bovenste kwart zit.</p><div class="legacy-state-track">${adoptionMarkup(m)}</div></div>
 <div class="legacy-grid2">
  <article class="legacy-card"><div class="legacy-kicker"><small>Procesvolwassenheid (CMMI)</small><strong>Niveau ${m.cmmi}/5</strong></div><div class="legacy-cmmi">${cmmiMarkup(m)}</div></article>
  <article class="legacy-card"><div class="legacy-kicker"><small>Waar je staat op de adoptiecurve</small><strong>${esc(m.stage?.segment||'Nog niet bepaald')}</strong></div><p>${esc(m.stage?.name||'Vul je profiel in')}${m.branchLevel?` · branche ${m.branchLevel.toFixed(1)}/5`:''}</p>${adoptionCurveMarkup(m)}<div class="legacy-state-track">${adoptionMarkup(m)}</div></article>
 </div>
 <div class="legacy-grid2">
  <article class="legacy-card"><h3>Waar de tijd weglekt</h3><p>Capaciteitswaarde per onderdeel op basis van uren × niveau × medewerkers × 46 weken × uurkosten.</p><div class="legacy-donut-row">${donutMarkup(m)}<div class="legacy-cost-list">${m.costs.slice(0,8).map(x=>`<div class="legacy-cost-row"><button type="button" data-legacy-page="businesscase"><span><b>${esc(x.label)}</b><br><small>${esc(LEVEL_LABELS[x.niveau]||'onbekend')}</small></span><strong>${euro(x.kosten)}</strong></button></div>`).join('')||'<p>Nog onvoldoende gegevens voor een bedrag.</p>'}</div></div></article>
  <article class="legacy-card"><h3>Wat je nu remt</h3><div class="legacy-blockers">${m.top.map((x,i)=>`<div class="legacy-blocker-row"><button type="button" data-legacy-page="businesscase"><span><b>${i+1}. ${esc(x.label)}</b> · <small>${esc(LEVEL_LABELS[x.niveau]||'onbekend')}</small></span><strong>${euro(x.kosten)}</strong></button></div>`).join('')||'<p>Nog onvoldoende gegevens om blokkades te rangschikken.</p>'}</div>${first?`<div class="legacy-first"><b>Eerst dit:</b> ${esc(first.label.toLowerCase())} staat op ‘${esc(LEVEL_LABELS[first.niveau]||'onbekend')}’. Zet hem in de roadmap als eerste blok.</div>`:''}</article>
 </div>
 <article class="legacy-card"><div class="legacy-sharpness"><div class="legacy-ring" style="--pct:${m.sharpness.total}"><div class="legacy-ring-center"><strong>${m.sharpness.total}</strong><span>procent</span></div></div><div><span class="legacy-band">${esc(m.sharpness.band.label)}</span><h3>Hoe scherp is je beeld</h3><p>${esc(m.sharpness.band.text)}</p><div class="legacy-progress-list">${progressRows(m.sharpness)}</div><div class="legacy-next"><h4>Zet hierna deze stap: ${esc(m.sharpness.next.title)}</h4><p>${esc(m.sharpness.next.why)}</p><button type="button" data-legacy-page="${esc(m.sharpness.next.page)}">Ga erheen →</button></div></div></div></article>
 <div class="legacy-grid2">
  <article class="legacy-card"><h3>Je voortgang</h3><p>Hoeveel verbeteringen uit de roadmap aantoonbaar zijn afgerond.</p><div class="legacy-roadmap-progress"><i style="width:${clamp(m.roadmap.pct)}%"></i></div><strong>${m.roadmap.done} van ${m.roadmap.total} afgerond · ${m.roadmap.pct}%</strong></article>
  <article class="legacy-card"><h3>En dan?</h3><p>Dit is de stand van zaken. De eerstvolgende keuzes staan onder Advies, op volgorde van aantoonbare prioriteit.</p><div class="legacy-advice-list">${m.advice.length?m.advice.map(a=>`<button type="button" data-legacy-page="advies">${esc(a.title||a.label||a.name||'Bekijk advies')}</button>`).join(''):'<button type="button" data-legacy-page="advies">Open Advies →</button>'}</div></article>
 </div>`;
 section.querySelectorAll('[data-legacy-page]').forEach(btn=>btn.addEventListener('click',()=>openPage(btn.dataset.legacyPage)));
 return true;
}

export const LEGACY_OVERVIEW_COMPLETE_VERSION='2026-09-18-v1';
