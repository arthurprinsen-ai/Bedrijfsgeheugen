import { PROFILE_DIMENSIONS, profileOverviewMetrics } from './company-input.js';
import { calculateLegacyEquivalent } from '../legacy-parity-engine.js';
import { bevindingen } from '../bevindingen.js';

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
.legacy-state-svg{width:100%;height:auto;margin-top:10px;overflow:visible}.legacy-state-block{cursor:pointer;transition:transform .15s,filter .15s}.legacy-state-block:hover,.legacy-state-block:focus{filter:brightness(.98);transform:translateY(-2px);outline:none}.legacy-state-label{font-size:10px;fill:#26324b}.legacy-state-level{font-size:8px;fill:#7b8498}.legacy-state-marker text{font-size:9px;font-weight:800}.legacy-state-detail{margin-top:10px;padding:11px 12px;border-radius:12px;background:#f7f9fc;border:1px solid #e4e9f2;font-size:12px;line-height:1.45}
.legacy-cmmi{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;align-items:end;margin-top:14px}.legacy-cmmi div{background:#f0f2f7;border-radius:10px 10px 4px 4px;padding:8px 6px;text-align:center;font-size:10px}.legacy-cmmi div:nth-child(1){height:68px}.legacy-cmmi div:nth-child(2){height:84px}.legacy-cmmi div:nth-child(3){height:100px}.legacy-cmmi div:nth-child(4){height:116px}.legacy-cmmi div:nth-child(5){height:132px}.legacy-cmmi .active{background:#e9f1ff;color:#0e5bd7}.legacy-cmmi .current{outline:2px solid #1769ff}.legacy-cmmi b{display:block;font-size:18px}
.legacy-donut-row{display:grid;grid-template-columns:minmax(160px,220px) 1fr;gap:16px;align-items:center}.legacy-donut-wrap{position:relative;aspect-ratio:1}.legacy-donut-svg{width:100%;height:100%;transform:rotate(-90deg)}.legacy-donut-segment{cursor:pointer;transition:opacity .15s,stroke-width .15s}.legacy-donut-segment:hover{opacity:.78;stroke-width:22}.legacy-donut-center{position:absolute;inset:0;display:grid;place-content:center;text-align:center;pointer-events:none}.legacy-donut-center strong{font-size:28px}.legacy-donut-center span{font-size:11px;color:#6d7486}.legacy-adoption-svg{width:100%;height:auto;margin-top:10px;overflow:visible;touch-action:none}.legacy-adoption-axis{stroke:#d9dee8;stroke-width:1}.legacy-adoption-curve{fill:url(#legacyAdoptionFill);stroke:url(#legacyAdoptionStroke);stroke-width:2.6}.legacy-adoption-marker{stroke-width:2}.legacy-adoption-label{font-size:8.2px;fill:#59637a}.legacy-adoption-dot{stroke:#fff;stroke-width:2}.legacy-adoption-point{opacity:.56;pointer-events:none}.legacy-adoption-stage{cursor:pointer;outline:none}.legacy-adoption-stage:hover .legacy-adoption-label,.legacy-adoption-stage:focus .legacy-adoption-label{font-weight:800;fill:#111827}.legacy-adoption-handle{cursor:grab}.legacy-adoption-handle:active{cursor:grabbing}.legacy-adoption-detail{margin-top:8px;padding:10px 12px;background:#f7f9fc;border:1px solid #e3e8f1;border-radius:12px;font-size:12px;line-height:1.45}.legacy-adoption-detail b{color:#17213b}.legacy-adoption-reset{border:0;background:none;color:#1d5de8;font-weight:800;padding:0;margin-left:6px;cursor:pointer}
.legacy-cost-list,.legacy-blockers{display:grid}.legacy-cost-row,.legacy-blocker-row{display:grid;grid-template-columns:1fr auto;gap:10px;padding:9px 0;border-bottom:1px solid #e7e9ef;align-items:center}.legacy-cost-row button,.legacy-blocker-row button{all:unset;cursor:pointer;display:contents}.legacy-cost-row span,.legacy-blocker-row span{min-width:0}.legacy-cost-row small,.legacy-blocker-row small{color:#747c8f}.legacy-first{margin-top:12px;padding:12px 14px;border-left:4px solid #f1c232;background:#fffaf0;border-radius:8px;line-height:1.55}
.legacy-sharpness{display:grid;grid-template-columns:170px 1fr;gap:18px;align-items:start}.legacy-ring{--pct:0;position:relative;width:150px;aspect-ratio:1;border-radius:50%;background:conic-gradient(#e7a516 calc(var(--pct)*1%),#edf0f5 0)}.legacy-ring:after{content:'';position:absolute;inset:16px;background:#fff;border-radius:50%}.legacy-ring-center{position:absolute;inset:0;z-index:1;display:grid;place-content:center;text-align:center}.legacy-ring-center strong{font-size:40px}.legacy-ring-center span{color:#6a7182}
.legacy-band{display:inline-block;padding:5px 10px;border-radius:999px;background:#fff3d6;color:#8a6100;font-weight:800;font-size:12px;margin-bottom:8px}.legacy-progress-list{display:grid;gap:11px;margin-top:15px}.legacy-progress-row{display:grid;grid-template-columns:1fr 48px;gap:10px;align-items:end}.legacy-progress-row .bar{height:8px;background:#edf0f5;border-radius:99px;overflow:hidden;margin-top:5px}.legacy-progress-row .bar i{display:block;height:100%;background:#1e9e5a;border-radius:99px}.legacy-progress-row strong{text-align:right}.legacy-progress-row.warn .bar i{background:#e7a516}.legacy-progress-row.zero .bar i{background:#ef612f}
.legacy-next{margin-top:14px;padding:14px;border:1px solid #eedb9b;background:#fffaf0;border-radius:14px}.legacy-next h4{margin:0 0 5px}.legacy-next button{border:0;background:transparent;padding:8px 0 0;color:#2149d8;font-weight:800;text-decoration:underline}
.legacy-roadmap-progress{height:12px;border-radius:99px;background:#edf0f5;overflow:hidden;margin:12px 0}.legacy-roadmap-progress i{display:block;height:100%;background:#e7a516}.legacy-advice-list{display:grid;gap:8px;margin-top:10px}.legacy-advice-list button{border:1px solid #e7eaf1;background:#fff;border-radius:12px;padding:11px;text-align:left;font-weight:700}
.legacy-priority-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.legacy-priority-card{border:1px solid #e2e7f0;border-radius:15px;padding:14px;background:#fff;display:grid;gap:10px}
.legacy-priority-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.legacy-priority-rank{display:inline-flex;align-items:center;justify-content:center;min-width:31px;height:31px;border-radius:50%;background:#15191f;color:#fff;font-weight:900}
.legacy-priority-card h4{margin:0;font-size:15px;line-height:1.3}.legacy-priority-card p{font-size:12px}
.legacy-priority-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.legacy-priority-metrics span{display:flex;flex-direction:column;gap:2px;background:#f6f8fb;border-radius:10px;padding:8px}.legacy-priority-metrics small{font-size:9px;text-transform:uppercase;letter-spacing:.04em;color:#75809a}.legacy-priority-metrics b{font-size:12px}
.legacy-priority-actions{display:flex;gap:8px;flex-wrap:wrap}.legacy-priority-actions button{border:1px solid #dce2ec;background:#fff;border-radius:9px;padding:8px 10px;font-weight:800;cursor:pointer}.legacy-priority-actions button[data-add-roadmap]{background:#15191f;color:#fff;border-color:#15191f}
.legacy-priority-card[data-priority="hoog"]{border-left:4px solid #d94b38}.legacy-priority-card[data-priority="middel"]{border-left:4px solid #e7a516}.legacy-priority-card[data-priority="laag"]{border-left:4px solid #315be8}
.legacy-priority-empty{padding:14px;background:#f8fafc;border:1px dashed #d7ddea;border-radius:12px;color:#6d7486}
.legacy-impact-map{display:grid;gap:12px}.legacy-impact-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.legacy-impact-head code{font-size:11px;background:#f2f5fa;padding:5px 7px;border-radius:7px;word-break:break-all}.legacy-impact-pages{display:flex;gap:7px;flex-wrap:wrap}.legacy-impact-pages button{border:1px solid #dce4f0;background:#f8fbff;border-radius:999px;padding:7px 10px;font-weight:750;color:#23406f;cursor:pointer}.legacy-impact-pages button[data-relation="source"]{background:#eaf2ff;border-color:#a9c8ff;color:#0e5bd7}.legacy-impact-deltas{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.legacy-impact-deltas span{background:#f7f9fc;border-radius:10px;padding:9px;min-width:0}.legacy-impact-deltas small{display:block;color:#75809a;font-size:9px;text-transform:uppercase}.legacy-impact-deltas b{font-size:12px;word-break:break-word}.legacy-impact-reason{padding:10px 12px;border-left:3px solid #315be8;background:#f5f8ff;border-radius:8px;font-size:12px;line-height:1.5}
@media(max-width:780px){.legacy-priority-grid{grid-template-columns:1fr}.legacy-priority-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.legacy-impact-deltas{grid-template-columns:repeat(2,minmax(0,1fr))}}
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

function priorityLabel(score){return score>=80?'hoog':score>=45?'middel':'laag'}
function frictionLabel(value){return value==='groot'?'Hoog':value==='klein'?'Laag':'Middel'}
function annualHoursForFinding(item,state,costs){
 const hourly=num(profile(state).hourlyCost);
 if(item?.dim&&hourly){const row=costs.find(x=>x.id===item.dim);if(row?.kosten)return Math.round(row.kosten/hourly)}
 if(item?.id==='handmatig-werk'){const weekly=num(profile(state).manualHoursPerWeek);return weekly?Math.round(weekly*46):null}
 return null;
}
function priorityItems(state,costs){
 return bevindingen(state).slice(0,6).map((item,index)=>Object.freeze({
  ...item,rank:index+1,priority:priorityLabel(num(item.score)),hours:annualHoursForFinding(item,state,costs)
 }));
}

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
 const manualAnnual=calculateLegacyEquivalent('manual-work-annual',state)||0;
 const fteLost=calculateLegacyEquivalent('fte-lost',state)||0;
 const branchLevel=num(state?.portal?.market?.digitalMaturity||state?.portal?.market?.benchmarkDigitalMaturity);return Object.freeze({costs,total,top,avg,cmmi,manualAnnual,fteLost,stage:STAGES[cmmi-1],branchLevel:branchLevel>=1&&branchLevel<=5?branchLevel:null,targetLevel:4,sharpness:legacySharpnessModel(state),roadmap:r,advice:advice(state).slice(0,5),priorities:priorityItems(state,costs)});
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
function stageDetail(level){
 const index=Math.max(0,Math.min(4,Math.round(level)-1)),s=STAGES[index];
 const actions=[
  'Leg vast wat nu alleen in hoofden of losse bestanden zit.',
  'Wijs één plek aan waar de waarheid woont en ruim kopieën op.',
  'Koppel de systemen waartussen het meeste wordt overgetypt.',
  'Meet per proces tijd, kwaliteit en kosten en stuur op afwijkingen.',
  'Laat systemen zelf signaleren en optimaliseren binnen duidelijke kaders.'
 ];
 return {level:index+1,stage:s,action:actions[index]};
}
function adoptionCurveMarkup(model){
 const x=level=>12+(clamp(level,1,5)-1)*76/4;
 const bell=xv=>82-57*Math.exp(-Math.pow(((xv-50)/31),2));
 const current=x(model.avg||1),target=x(model.targetLevel||4),branch=model.branchLevel?x(model.branchLevel):null;
 const dist=[5,21,34,31,9];
 const points=dist.flatMap((count,i)=>Array.from({length:Math.min(count,16)},(_,j)=>{
  const center=x(i+1),px=center-7+((j*13+i*7)%15),py=Math.min(79,bell(px)+4+((j*11+i*3)%16));
  return `<circle class="legacy-adoption-point" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r=".8" fill="${Math.round(model.avg||1)===i+1?'#315be8':'#aeb7c8'}"/>`;
 })).join('');
 const stages=STAGES.map((s,i)=>`<g class="legacy-adoption-stage" tabindex="0" role="button" data-adoption-level="${i+1}" aria-label="${esc(s.segment)}, niveau ${i+1}: ${esc(s.name)}"><rect x="${x(i+1)-8}" y="82" width="16" height="14" fill="transparent"/><text x="${x(i+1)}" y="88" text-anchor="middle" class="legacy-adoption-label">N${i+1} · ${dist[i]}%</text><text x="${x(i+1)}" y="94" text-anchor="middle" class="legacy-adoption-label">${esc(s.segment)}</text></g>`).join('');
 const branchMarkup=branch==null?'':`<line x1="${branch}" x2="${branch}" y1="30" y2="82" class="legacy-adoption-marker" stroke="#111827" stroke-dasharray="3 2"/><circle cx="${branch}" cy="${bell(branch)}" r="2.3" class="legacy-adoption-dot" fill="#111827"/><text x="${branch}" y="27" text-anchor="middle" class="legacy-adoption-label">branche ${model.branchLevel.toFixed(1)}</text>`;
 const detail=stageDetail(model.avg||1);
 return `<svg class="legacy-adoption-svg" viewBox="0 0 100 98" role="img" aria-label="Interactieve adoptiecurve met eigen positie, branche en bovenste 25%">
 <defs><linearGradient id="legacyAdoptionStroke" x1="0" x2="1"><stop offset="0%" stop-color="#d94b38"/><stop offset="48%" stop-color="#e7a516"/><stop offset="100%" stop-color="#229c5a"/></linearGradient><linearGradient id="legacyAdoptionFill" x1="0" x2="1"><stop offset="0%" stop-color="#fff1ef"/><stop offset="52%" stop-color="#fff8df"/><stop offset="100%" stop-color="#e9f7ee"/></linearGradient></defs>
 <line x1="8" x2="94" y1="82" y2="82" class="legacy-adoption-axis"/><path d="M8 82 C20 82 24 31 48 20 C68 10 76 56 94 82 L94 82 Z" class="legacy-adoption-curve"/>${points}
 <line x1="${target}" x2="${target}" y1="25" y2="82" class="legacy-adoption-marker" stroke="#229c5a" stroke-dasharray="2 2"/><text x="${target}" y="20" text-anchor="middle" class="legacy-adoption-label">bovenste 25% / doel</text>${branchMarkup}
 <g data-adoption-current><line data-adoption-current-line x1="${current}" x2="${current}" y1="${bell(current)}" y2="82" class="legacy-adoption-marker" stroke="#ff4f17"/><circle data-adoption-current-halo cx="${current}" cy="${bell(current)}" r="5.5" fill="#ff4f17" opacity=".13"/><circle data-adoption-current-dot class="legacy-adoption-dot legacy-adoption-handle" cx="${current}" cy="${bell(current)}" r="3.5" fill="#ff4f17"/><text data-adoption-current-label x="${current}" y="${Math.max(11,bell(current)-7)}" text-anchor="middle" class="legacy-adoption-label" font-weight="800">jij</text></g>
 ${stages}</svg><div class="legacy-adoption-detail" data-adoption-detail><b>Niveau ${detail.level} · ${esc(detail.stage.name)}</b> <span>· ${esc(detail.stage.segment)}</span><br>${esc(detail.action)} <span style="color:#68748c">Klik een fase of sleep de oranje bol om te verkennen.</span></div>`;
}
function stateMarkup(model){
 const stateNames=['Handwerk','Geordend','Ingericht','Verbonden','Sturend'];
 const desc=['Mensen en losse bestanden dragen het proces.','Afspraken bestaan, maar er is nog geen één waarheid.','Systemen doen hun werk; ertussen zit nog handwerk.','Gegevens worden één keer ingevoerd en stromen door.','Afwijkingen worden automatisch gesignaleerd.'];
 const fills=['#fde2de','#ffebd6','#fff6d6','#e3f4e8','#d9f0e4'];
 const x=i=>4+i*19.2;
 const blocks=stateNames.map((name,i)=>`<g class="legacy-state-block" tabindex="0" role="button" data-state-level="${i+1}" aria-label="${name}, niveau ${i+1}"><rect x="${x(i)}" y="30" width="18" height="28" rx="3" fill="${fills[i]}" ${Math.round(model.avg||1)===i+1?'stroke="#111827" stroke-width=".7"':''}/><text x="${x(i)+9}" y="43" text-anchor="middle" class="legacy-state-label">${name}</text><text x="${x(i)+9}" y="51" text-anchor="middle" class="legacy-state-level">niveau ${i+1}</text><title>${esc(desc[i])}</title></g>`).join('');
 const pin=(level,label,color,y,above=true)=>{if(level==null)return'';const xx=4+(clamp(level,1,5)-1)*76.8/4+9.6;return `<g class="legacy-state-marker"><path d="M${xx},${above?29:60} l-2.2,${above?-4:4} l4.4,0 Z" fill="${color}"/><text x="${xx}" y="${y}" text-anchor="middle" fill="${color}">${esc(label)}</text></g>`;};
 const cur=Math.round(model.avg||1)-1;
 return `<svg class="legacy-state-svg" viewBox="0 0 100 75" role="img" aria-label="De staat van je bedrijf met eigen positie, branche en bovenste 25%">${blocks}${pin(model.avg||1,'jij','#ff4f17',20,true)}${pin(model.branchLevel,'branche','#111827',71,false)}${pin(model.targetLevel||4,'bovenste 25%','#229c5a',71,false)}</svg><div class="legacy-state-detail" data-state-detail><b>Niveau ${cur+1} · ${stateNames[cur]}</b> — ${desc[cur]} Beweeg of klik op een stadium voor uitleg.</div>`;
}
function cmmiMarkup(model){return STAGES.map((s,i)=>`<div class="${i+1<=model.cmmi?'active':''} ${i+1===model.cmmi?'current':''}" tabindex="0" role="button" data-cmmi-level="${i+1}" title="Niveau ${i+1}: ${esc(s.name)}"><b>${i+1}</b><span>${esc(s.name)}</span></div>`).join('')}

function impactDeltaText(change){
 if(change?.delta==null)return `${esc(change?.from??'—')} → ${esc(change?.to??'—')}`;
 const d=Number(change.delta),sign=d>0?'+':'';
 if(change.unit==='money')return `${sign}${euro(d)}`;
 if(change.unit==='fte')return `${sign}${d.toFixed(1)} fte`;
 if(change.unit==='percent')return `${sign}${d.toFixed(1)}%`;
 if(change.unit==='months')return `${sign}${d.toFixed(1)} mnd`;
 return `${sign}${d.toFixed(2)} ${esc(change.unit||'')}`;
}
function latestImpactMarkup(){
 const impact=globalThis.__BG_LAST_PORTAL_IMPACT__;
 if(!impact?.path)return `<div class="legacy-impact-map"><div class="legacy-impact-head"><div><h3>Wat heeft effect op wat?</h3><p>Elke wijziging wordt door de causale grafiek opnieuw doorgerekend. Verander een profiel-, geld-, mensen-, AI-, compliance-, strategie- of roadmapwaarde en hier zie je direct welke onderdelen mee veranderen.</p></div></div></div>`;
 const pages=(impact.effectDetails||[]).slice(0,18);
 const changes=(impact.changes||[]).slice(0,8);
 const reasons=[...(impact.effectRules||[]).map(rule=>rule.reason),...(impact.organism?.impacts||[]).slice(1,4).flatMap(item=>item.reasons?.slice(-1)||[])];
 return `<div class="legacy-impact-map" data-latest-impact>
   <div class="legacy-impact-head"><div><h3>Wat verandert mee?</h3><p>Laatste wijziging verspreidt zich automatisch door berekeningen, afhankelijkheden en het Powerhouse-organisme.</p></div><code>${esc(impact.path)}</code></div>
   ${changes.length?`<div class="legacy-impact-deltas">${changes.map(change=>`<span><small>${esc(change.id)}</small><b>${impactDeltaText(change)}</b></span>`).join('')}</div>`:''}
   <div class="legacy-impact-pages">${pages.map(detail=>`<button type="button" data-legacy-page="${esc(detail.page)}" data-relation="${esc(detail.relation||'dependency')}" title="${esc([...(detail.viaCalculation||[]),...(detail.viaRule||[])].join(' · '))}">${esc(detail.label||detail.page)}</button>`).join('')}</div>
   ${reasons.length?`<div class="legacy-impact-reason"><b>Waarom dit doorwerkt:</b> ${esc([...new Set(reasons)].slice(0,3).join(' · '))}</div>`:''}
 </div>`;
}


export function renderLegacyOverviewComplete(root,state={},openPage=()=>{},domainState=null){
 const main=root?.querySelector?.('.main');if(!main)return false;ensureStyle(root.ownerDocument||document);
 let section=main.querySelector('[data-legacy-complete]');if(!section){section=(root.ownerDocument||document).createElement('section');section.className='legacy-complete';section.dataset.legacyComplete='true';const anchor=main.querySelector('.dashboard')||main.querySelector('.lower');main.insertBefore(section,anchor||null)}
 const m=legacyOverviewCompleteModel(state);
 const first=m.top[0];
 section.innerHTML=`
 <article class="legacy-card" data-legacy-impact-overview>${latestImpactMarkup()}</article>
 <article class="legacy-card" data-legacy-priority-overview>
  <div class="legacy-kicker"><small>Wat moet eerst</small><strong>${m.priorities.length?m.priorities.length+' prioriteiten':'Nog geen prioriteiten'}</strong></div>
  <p>Dezelfde beslislogica als in het oude portaal: prioriteit uit bewijs en urgentie, waarde waar die berekenbaar is, frictie als uitvoeringsmoeite en uren als capaciteitsimpact.</p>
  <div class="legacy-priority-grid">
   ${m.priorities.length?m.priorities.map(item=>`<article class="legacy-priority-card" data-priority="${esc(item.priority)}">
    <div class="legacy-priority-head"><span class="legacy-priority-rank">${item.rank}</span><div><h4>${esc(item.titel)}</h4><p>${esc(item.bewijs)}</p></div></div>
    <div class="legacy-priority-metrics">
      <span><small>Prio</small><b>${esc(item.priority)} · ${Math.round(num(item.score))}</b></span>
      <span><small>Waarde/jaar</small><b>${item.waarde?euro(item.waarde):'—'}</b></span>
      <span><small>Frictie</small><b>${frictionLabel(item.moeite)}</b></span>
      <span><small>Uren/jaar</small><b>${item.hours!=null?nl(item.hours):'—'}</b></span>
    </div>
    <div class="legacy-priority-actions">
      <button type="button" data-legacy-page="${esc(item.pagina||'advies')}">Bekijk onderbouwing</button>
      <button type="button" data-add-roadmap="${esc(item.id)}">Zet op roadmap</button>
    </div>
   </article>`).join(''):'<div class="legacy-priority-empty">Vul profiel, cijfers of andere bedrijfsdata aan. Zodra er voldoende bewijs is verschijnen hier de echte prioriteiten.</div>'}
  </div>
 </article>
 <div class="legacy-card"><div class="legacy-kicker"><small>De staat van je bedrijf</small><strong>${m.avg?m.avg.toFixed(1):'—'}/5</strong></div><h3>${esc(m.stage?.name||'Nog niet bepaald')}</h3><p>Vijf stadia. Waar jij staat, waar je branche staat en waar de bovenste kwart zit.</p>${stateMarkup(m)}</div>
 <div class="legacy-grid2">
  <article class="legacy-card"><h3>Handwerk per jaar</h3><div class="legacy-kicker"><small>Berekende capaciteitswaarde</small><strong>${m.manualAnnual?euro(m.manualAnnual):'—'}</strong></div></article>
  <article class="legacy-card"><h3>Bezetting</h3><div class="legacy-kicker"><small>Capaciteitsverlies in fte</small><strong>${m.fteLost?m.fteLost.toFixed(1)+' fte':'—'}</strong></div></article>
 </div>
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
 section.querySelectorAll('[data-state-level]').forEach(node=>node.addEventListener('click',()=>{const d=section.querySelector('[data-state-detail]'),level=Number(node.dataset.stateLevel)||1,names=['Handwerk','Geordend','Ingericht','Verbonden','Sturend'],descs=['Mensen en losse bestanden dragen het proces.','Afspraken bestaan, maar er is nog geen één waarheid.','Systemen doen hun werk; ertussen zit nog handwerk.','Gegevens worden één keer ingevoerd en stromen door.','Afwijkingen worden automatisch gesignaleerd.'];if(d)d.innerHTML='<b>Niveau '+level+' · '+names[level-1]+'</b> — '+descs[level-1];}));
 const adoptionSvg=section.querySelector('.legacy-adoption-svg'),adoptionDetail=section.querySelector('[data-adoption-detail]');
 const showAdoptionLevel=level=>{level=Math.max(1,Math.min(5,Number(level)||1));const d=stageDetail(level);if(adoptionDetail)adoptionDetail.innerHTML='<b>Niveau '+d.level+' · '+esc(d.stage.name)+'</b> <span>· '+esc(d.stage.segment)+'</span><br>'+esc(d.action)+(Math.abs(level-(m.avg||1))>.05?' <button class="legacy-adoption-reset" type="button" data-adoption-reset>Terug naar mijn positie</button>':'');};
 section.querySelectorAll('[data-adoption-level]').forEach(node=>node.addEventListener('click',()=>showAdoptionLevel(node.dataset.adoptionLevel)));
 if(adoptionSvg){
  const dot=adoptionSvg.querySelector('[data-adoption-current-dot]');
  const moveMarker=level=>{const xx=12+(Math.max(1,Math.min(5,level))-1)*76/4;const bell=xv=>82-57*Math.exp(-Math.pow(((xv-50)/31),2)),yy=bell(xx);adoptionSvg.querySelector('[data-adoption-current-line]')?.setAttribute('x1',xx);adoptionSvg.querySelector('[data-adoption-current-line]')?.setAttribute('x2',xx);adoptionSvg.querySelector('[data-adoption-current-line]')?.setAttribute('y1',yy);adoptionSvg.querySelector('[data-adoption-current-dot]')?.setAttribute('cx',xx);adoptionSvg.querySelector('[data-adoption-current-dot]')?.setAttribute('cy',yy);adoptionSvg.querySelector('[data-adoption-current-halo]')?.setAttribute('cx',xx);adoptionSvg.querySelector('[data-adoption-current-halo]')?.setAttribute('cy',yy);const label=adoptionSvg.querySelector('[data-adoption-current-label]');if(label){label.setAttribute('x',xx);label.setAttribute('y',Math.max(11,yy-7));label.textContent=Math.abs(level-(m.avg||1))>.05?'wat als':'jij';}showAdoptionLevel(level);};
  const pointerLevel=event=>{const box=adoptionSvg.getBoundingClientRect(),clientX=event.touches?.[0]?.clientX??event.clientX,vbX=(clientX-box.left)/box.width*100;return Math.round(Math.max(1,Math.min(5,1+((vbX-12)/76)*4))*10)/10;};
  if(dot){const start=event=>{event.preventDefault();const move=e=>{e.preventDefault();moveMarker(pointerLevel(e));};const stop=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',stop);document.removeEventListener('touchmove',move);document.removeEventListener('touchend',stop);};document.addEventListener('pointermove',move);document.addEventListener('pointerup',stop);document.addEventListener('touchmove',move,{passive:false});document.addEventListener('touchend',stop);};dot.addEventListener('pointerdown',start);dot.addEventListener('touchstart',start,{passive:false});}
  section.addEventListener('click',event=>{if(event.target.closest?.('[data-adoption-reset]'))moveMarker(m.avg||1);});
 }
 section.querySelectorAll('[data-cmmi-level]').forEach(node=>node.addEventListener('click',()=>{section.querySelectorAll('[data-cmmi-level]').forEach(n=>n.classList.toggle('selected',n===node));node.setAttribute('aria-pressed','true');}));
 section.querySelectorAll('[data-add-roadmap]').forEach(btn=>btn.addEventListener('click',async()=>{
  const item=m.priorities.find(x=>x.id===btn.dataset.addRoadmap);if(!item)return;
  if(!domainState?.get||!domainState?.set){openPage('roadmap');return;}
  const current=domainState.get('portal.roadmap.items');const items=Array.isArray(current)?current:[];
  if(!items.some(x=>x.sourceFindingId===item.id)){
   const next=[...items,{
    title:item.titel,dimension:item.dim||item.soort||'algemeen',start:1,duration:Math.max(1,Math.min(12,Math.ceil(num(item.duur)||1))),
    owner:'',progress:0,done:false,value:item.waarde||0,sourceFindingId:item.id,source:'overview-priority-card',
    priorityScore:Math.round(num(item.score)),friction:item.moeite||'middel',annualHours:item.hours
   }];
   domainState.set('portal.roadmap.items',next);
   try{await domainState.flush?.();btn.textContent='Staat op roadmap ✓';btn.disabled=true;}catch{btn.textContent='Opslaan mislukt';}
  }else{btn.textContent='Staat al op roadmap ✓';btn.disabled=true;}
 }));
 return true;
}

export const LEGACY_OVERVIEW_COMPLETE_VERSION='2026-09-18-v2-rich-interactive';
