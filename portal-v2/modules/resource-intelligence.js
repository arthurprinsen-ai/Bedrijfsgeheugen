const euro=value=>value==null?'Onbekend':new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(value)||0);
const number=(value,digits=1)=>value==null?'Onbekend':new Intl.NumberFormat('nl-NL',{maximumFractionDigits:digits}).format(Number(value)||0);
const pct=value=>value==null?'Nog niet beoordeeld':`${number(value,1)}%`;
const FRAMEWORK_LABELS=Object.freeze({EU_AI_ACT:'EU AI Act',NIS2:'NIS2',CSRD_ESRS:'CSRD / ESRS'});

function intelligenceFrom(state={}){
 return state?.resourceIntelligence||state?.portal?.resourceIntelligence||null;
}
function metric(label,value,note){return `<article class="ri-card"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`}
function frameworkCard(row={}){
 const label=FRAMEWORK_LABELS[row.framework]||row.framework||'Framework';
 const gaps=Number(row.evidenceMissing||0)+Number(row.reviewRequired||0)+Number(row.unevaluated||0);
 const status=row.status==='evidence_ready'?'Bewijs aanwezig':row.status==='assessment_not_started'?'Beoordeling starten':gaps>0?'Bewijsgaten':'Nog beoordelen';
 return `<article class="ri-framework"><header><strong>${label}</strong><span>${status}</span></header><div class="ri-progress"><b>${pct(row.evidenceCoveragePct)}</b><small>Bewijsdekking · ${Number(row.evidencePresent||0)}/${Number(row.controls||0)} controls met evidence</small></div><small>${Number(row.reviewRequired||0)} review · ${Number(row.evidenceMissing||0)} expliciet ontbrekend · ${Number(row.unevaluated||0)} nog niet beoordeeld</small></article>`;
}
function installStyle(doc){
 if(!doc?.head||doc.getElementById('resourceIntelligenceStyle'))return;
 const style=doc.createElement('style');style.id='resourceIntelligenceStyle';style.textContent=`
 .ri-cockpit{margin:18px 0;padding:18px;border:1px solid #e2e8f0;border-radius:18px;background:#fff}.ri-head{display:flex;gap:16px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap}.ri-head h3{margin:0 0 5px}.ri-head p{margin:0;color:#526076;max-width:760px}.ri-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:14px 0}.ri-card,.ri-framework{border:1px solid #e8edf3;border-radius:13px;padding:12px;background:#fafbfd}.ri-card span,.ri-card small,.ri-framework small{display:block;color:#667085}.ri-card strong{display:block;font-size:1.25rem;margin:5px 0}.ri-frameworks{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.ri-framework header{display:flex;justify-content:space-between;gap:8px;align-items:center}.ri-framework header span{font-size:.78rem;border:1px solid #dfe5ec;border-radius:999px;padding:3px 7px}.ri-progress{margin:10px 0}.ri-progress b{display:block;font-size:1.1rem}.ri-foot{margin-top:12px;padding-top:10px;border-top:1px solid #edf0f4;color:#667085;font-size:.78rem}`;
 doc.head.appendChild(style);
}

export function resourceIntelligenceViewModel(state={}){
 const intelligence=intelligenceFrom(state);
 if(!intelligence)return null;
 const resource=intelligence.resource||{};
 const business=intelligence.business||{};
 const frameworks=Array.isArray(intelligence.compliance?.frameworks)?intelligence.compliance.frameworks:[];
 const optimization=intelligence.optimization||{};
 return Object.freeze({
  cards:Object.freeze([
   {label:'Kosten & waarde',value:euro(business.observedCostEur),note:`${Number(business.actionsWithObservedCost||0)} acties met gemeten kosten · gerealiseerde omzet ${euro(business.realizedRevenueEur)}`},
   {label:'Energie',value:resource.energy_kwh==null?'Onbekend':`${number(resource.energy_kwh,2)} kWh`,note:`Factor coverage ${resource.factor_coverage==null?'onbekend':pct(Number(resource.factor_coverage)*100)}`},
   {label:'CO₂e',value:resource.co2e_kg==null?'Onbekend':`${number(resource.co2e_kg,2)} kg`,note:'Alleen gemeten/berekend met herleidbare resourcefactoren'},
   {label:'Water',value:resource.water_liters==null?'Onbekend':`${number(resource.water_liters,2)} L`,note:'Onbekende fysieke data blijft onbekend; nooit synthetisch nul'},
   {label:'Optimalisaties',value:String(Number(optimization.openCandidates||0)),note:`${Number(optimization.safeReversible||0)} veilig/reversibel · ${Number(optimization.reviewRequired||0)} review vereist`}
  ]),
  frameworks:Object.freeze(frameworks),
  truth:intelligence.truth||{}
 });
}

export function mountResourceIntelligenceCockpit(root=document,state={}){
 const main=root?.querySelector?.('.main');if(!main)return false;
 const model=resourceIntelligenceViewModel(state);
 let section=main.querySelector('.ri-cockpit');
 if(!model){section?.remove();return false;}
 installStyle(root.ownerDocument||document);
 if(!section){section=(root.ownerDocument||document).createElement('section');section.className='ri-cockpit';section.setAttribute('aria-label','Resource Intelligence, duurzaamheid en compliance');const anchor=main.querySelector('.kpis');anchor?.after?.(section)||main.prepend(section);}
 section.innerHTML=`<div class="ri-head"><div><h3>Impact & Governance</h3><p>Realtime Powerhouse-inzicht in Kosten & waarde, Energie, CO₂e, Water, autonome optimalisaties en evidence readiness. Meetwaarden tonen alleen aantoonbare data; onbekend blijft onbekend.</p></div></div><div class="ri-grid">${model.cards.map(card=>metric(card.label,card.value,card.note)).join('')}</div><div class="ri-frameworks">${model.frameworks.map(frameworkCard).join('')}</div><div class="ri-foot">Bewijsdekking is een transparantie- en readiness-indicator. Geen juridische conformiteitsverklaring. Productiewijzigingen blijven onder BG169, security-, truth- en release-gates.</div>`;
 return true;
}
