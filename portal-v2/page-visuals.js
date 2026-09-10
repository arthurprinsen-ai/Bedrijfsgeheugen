import { radar, gantt, curve, quadrant, benchmarkBars, ring, leakage, ladder, dupont, gauge } from './visuals.js';
import { calculateLegacyEquivalent } from './legacy-parity-engine.js';
import { PROFILE_DIMENSIONS, profileOverviewMetrics } from './modules/company-input.js';
import { hasPageData } from './page-metrics.js';

const arr=value=>Array.isArray(value)?value:[];
const n=value=>Number.isFinite(Number(value))?Number(value):0;
const at=(state,path)=>String(path||'').split('.').filter(Boolean).reduce((value,key)=>value==null?undefined:value[key],state);
const calc=(id,state)=>{try{return calculateLegacyEquivalent(id,state);}catch{return null;}};

const BUSINESSCASE_FACTOR=[0,1,.78,.5,.22,.06];

const BUILDERS=Object.freeze({
  overzicht:state=>{
    const metrics=profileOverviewMetrics(state);
    const profile=at(state,'portal.profile')||{};
    const points=PROFILE_DIMENSIONS.map(dimension=>({label:dimension.label||dimension.id,value:n(profile.maturity?.[dimension.id])}))
      .filter(point=>point.value>0);
    const blockers=arr(calc('blocker-ranking',state)).map(item=>({label:item.name||item.title||'Blokkade',value:n(item.score)||n(item.impact)}));
    return [radar(points,{title:'Volwassenheid per bedrijfsonderdeel'}),
      ladder(arr(calc('cmmi-ladder',state)),{title:'Procesvolwassenheid (CMMI)'}),
      leakage(blockers,{title:'Waar de meeste capaciteit weglekt'}),
      ring(Math.min(100,metrics.averageMaturity/5*100),{title:'Volwassenheid',caption:'gemiddeld over de onderdelen'})].filter(Boolean).join('');
  },

  profiel:state=>{
    const profile=at(state,'portal.profile')||{};
    const points=PROFILE_DIMENSIONS.map(dimension=>({label:dimension.label||dimension.id,value:n(profile.maturity?.[dimension.id])})).filter(point=>point.value>0);
    return radar(points,{title:'Profiel per onderdeel'});
  },

  businesscase:state=>{
    const businessCase=at(state,'portal.businessCase')||{};
    const benefit=n(calc('benefit-at-target-maturity',state));
    const investment=n(businessCase.investment);
    const points=Array.from({length:13},(_,month)=>({label:`m${month}`,value:benefit/12*month-investment}));
    const adoption=Array.from({length:13},(_,month)=>({label:`m${month}`,value:Math.round(100/(1+Math.exp(-(month-6)/1.6)))}));
    const tei=calc('tei-summary',state)||{};
    return [curve(points,{title:'Cumulatief nettoresultaat',valueLabel:'euro'}),
      benchmarkBars([{label:'Baten',value:n(tei.baten),benchmark:n(tei.kosten)},
        {label:'Risicogewogen',value:n(tei.risicogewogen),benchmark:n(tei.kosten)},
        {label:'Flexibiliteit',value:n(tei.flexibiliteit),benchmark:n(tei.kosten)}],
        {title:'Kosten tegen baten (opzet volgens Total Economic Impact)'}),
      curve(adoption,{title:'Adoptiecurve',valueLabel:'%'})].filter(Boolean).join('');
  },

  'ai-scan':state=>{
    const rate=n(at(state,'portal.aiScan.hourlyRate'));
    const tasks=arr(at(state,'portal.aiScan.tasks'));
    const points=tasks.map(task=>({label:task.task||'Taak',x:6-n(task.dataReadiness||1),y:n(task.hoursPerWeek)*46*rate}));
    return quadrant(points,{title:'Kansen: waarde tegen moeite',xLabel:'Moeite (lage data readiness = meer moeite)',yLabel:'Jaarlijkse taakkosten'});
  },

  kansenkaart:state=>BUILDERS['ai-scan'](state),

  'branche-markt':state=>benchmarkBars(arr(at(state,'portal.market.benchmarks')).map(row=>({label:row.metric,value:n(row.company),benchmark:n(row.benchmark)})),{title:'Eigen waarde tegen benchmark'}),

  'cijfers-maatstaven':state=>{
    const measurements=arr(at(state,'portal.metrics.measurements'));
    const rows=[['Brutomarge','gross-margin'],['EBITDA-marge','ebitda-margin'],['Loonquote','wage-ratio'],['IT-quote','it-ratio'],['Marketingquote','marketing-ratio']]
      .map(([label,id])=>({label,value:n(calc(id,state)),benchmark:0}))
      .filter(row=>row.value!==0);
    return [benchmarkBars(rows,{title:'Verhoudingen in procenten van de omzet'}),
      curve(measurements.map(item=>({label:item.date||'',value:n(item.value)})),{title:'Metingen over tijd'}),
      ladder(arr(calc('trusted-advisor-ladder',state)),{title:'Trusted advisor — waar sta je bij je klant?'})].filter(Boolean).join('');
  },

  'waarde-financiering':state=>{
    const sensitivity=calc('sensitivity',state)||{};
    const rows=[{label:'Ongunstig',value:n(sensitivity.downside),benchmark:n(sensitivity.base)},
      {label:'Basis',value:n(sensitivity.base),benchmark:n(sensitivity.base)},
      {label:'Gunstig',value:n(sensitivity.upside),benchmark:n(sensitivity.base)}];
    return [benchmarkBars(rows,{title:'Gevoeligheid van de waarde'}),
      dupont(calc('dupont-breakdown',state)||{}),
      gauge(n(calc('altman-z',state)),{title:'Altman Z — hoe stevig staat het bedrijf?',min:0,max:6,
        bands:[[0,1.8,'var(--saas-amber,#f59e0b)'],[1.8,3,'var(--saas-accent-2,#0ea5e9)'],[3,6,'var(--saas-mint,#10b981)']],
        caption:'onder 1,8 kwetsbaar · boven 3 stevig'})].filter(Boolean).join('');
  },

  roadmap:state=>gantt(arr(at(state,'portal.roadmap.items')),{title:'Roadmap over twaalf maanden'}),
  uitvoeringsladder:state=>gantt(arr(at(state,'portal.roadmap.items')),{title:'Uitvoering over twaalf maanden'}),

  advies:state=>quadrant(arr(at(state,'portal.advice.items')).map(item=>({label:item.advice,x:n(item.duration),y:n(item.value)})),{title:'Advies: waarde tegen doorlooptijd',xLabel:'Doorlooptijd in weken',yLabel:'Waarde'}),

  'strategie-naar-maandagochtend':state=>quadrant(arr(at(state,'portal.strategy.findings')).map(item=>({label:item.finding,x:6-({'Nu':5,'3 maanden':4,'6 maanden':3,'12 maanden':2,'Later':1}[item.horizon]||3),y:n(item.value)})),{title:'Bevindingen: waarde tegen horizon',xLabel:'Hoe verder weg',yLabel:'Waarde'}),

  'compliance-governance':state=>ring(n(calc('policy-completeness',state)),{title:'Beleid compleet',caption:'aandeel vastgesteld of geoefend'}),
  'compliance-command-center':state=>ring(100-n(calc('compliance-risk',state)),{title:'Compliance readiness',caption:'restrisico afgetrokken'}),
  'csrd-impact':state=>ring(n(calc('esg-readiness',state))/5*100,{title:'ESG readiness',caption:'gemiddeld over de domeinen'}),
  canvassen:state=>ring(n(calc('canvas-completeness',state)),{title:'Canvassen ingevuld',caption:'antwoorden en eigenaren'}),
  'gegevens-invullen':state=>ring(n(calc('input-completeness',state)),{title:'Hoe scherp is je beeld',caption:'volledigheid van je invoer'}),
  'ingevulde-gegevens':state=>ring(n(calc('answer-completeness',state)),{title:'Compleetheid',caption:'volledigheid van je invoer'}),
  'actueel-houden':state=>ring(n(calc('freshness',state)),{title:'Actualiteit',caption:'op basis van de laatste review'}),

  'due-diligence':state=>benchmarkBars(arr(at(state,'portal.dueDiligence.findings')).map(item=>({label:item.area||'Onderdeel',value:n(item.materiality),benchmark:3})),{title:'Materialiteit per onderdeel'}),

  eindconclusie:state=>{
    const synthesis=calc('final-synthesis',state)||{};
    return [ring(n(synthesis.consensus),{title:'Consensus over de bronnen',caption:'hoe eenduidig het beeld is'}),
      quadrant(arr(calc('recommendation-priority',state)).map(item=>({label:item.advice,x:n(item.duration),y:n(item.value)})),{title:'Aanbevelingen: waarde tegen doorlooptijd',xLabel:'Doorlooptijd in weken',yLabel:'Waarde'})].filter(Boolean).join('');
  },

  wijzigingen:state=>benchmarkBars(arr(at(state,'portal.changes.items')).map(item=>({label:item.area||item.change||'Wijziging',value:n(item.impact),benchmark:3})),{title:'Impact per onderdeel'}),

  mensen:state=>benchmarkBars([
    {label:'Verzuim',value:n(at(state,'portal.people.absence')),benchmark:4},
    {label:'Verloop',value:n(at(state,'portal.people.turnover')),benchmark:10},
    {label:'eNPS',value:n(at(state,'portal.people.enps')),benchmark:20}
  ],{title:'Mensen tegen de branchenorm'}),

  'ai-capabilities':state=>radar(Object.entries(at(state,'portal.aiCapabilities')||{}).map(([key,value])=>({label:`Capability ${Number(key)+1}`,value:n(value)})),{title:'AI-capabilities'}),

  'data-ai':state=>{
    const phases=['Oriëntatie','Fundament','Pilot','Opschalen','Borgen'];
    const current=Math.max(1,phases.indexOf(at(state,'portal.dataAi.phase'))+1);
    return [radar([
      {label:'Volwassenheid',value:n(at(state,'portal.dataAi.maturity'))},
      {label:'Verandering',value:n(at(state,'portal.dataAi.changeReadiness'))},
      {label:'Governance',value:n(at(state,'portal.dataAi.governance'))},
      {label:'Fase',value:current}
    ].filter(point=>point.value>0),{title:'Data en AI readiness'}),
      ring(current/phases.length*100,{title:'Implementatiefase',caption:phases[current-1]||''}),
      ladder(arr(calc('greiner-ladder',state)),{title:'Greiner — groeifasen en hun crisis'})].filter(Boolean).join('');
  },

  offerte:state=>{
    const offer=at(state,'portal.offer')||{};
    const sprints=n(offer.sprints);
    const meerwerk=arr(offer.additionalWork);
    return [ring(offer.approval?.agreed===true?100:0,{title:'Akkoord',caption:offer.approval?.agreed===true?`gegeven door ${offer.approval.name||'de klant'}`:'nog niet gegeven'}),
      sprints?gantt(Array.from({length:sprints},(_,i)=>({title:`Sprint ${i+1}`,start:i*2+1,duration:2,progress:0})),{title:'Doorlooptijd in sprints van twee weken'}):'',
      meerwerk.length?benchmarkBars(meerwerk.slice(0,6).map(item=>({label:item.description||'Meerwerk',value:n(item.price),benchmark:0})),{title:'Meerwerk'}):''].filter(Boolean).join('');
  },

  onderzoek:state=>{
    const items=arr(at(state,'portal.research.hypotheses'));
    if(!items.length)return '';
    const metBewijs=items.filter(item=>item.evidence).length;
    const metBron=items.filter(item=>item.source).length;
    return [ring(items.length?metBewijs/items.length*100:0,{title:'Hypotheses met bewijs',caption:`${metBewijs} van ${items.length}`}),
      benchmarkBars([{label:'Met bewijs',value:metBewijs,benchmark:items.length},
        {label:'Met bron',value:metBron,benchmark:items.length}],{title:'Onderbouwing van je hypotheses'})].filter(Boolean).join('');
  },

  'strategy-dna':state=>radar(Object.entries(at(state,'portal.strategyDna.layers')||{}).map(([key,value])=>({label:key,value:n(value)})),{title:'Volwassenheid per laag'})
});

/**
 * Visualisatie voor een pagina. Leeg zolang er geen klantdata is; er wordt
 * nooit een grafiek getekend op verzonnen waarden.
 */
export function pageVisual(pageId,state={}){
  const builder=BUILDERS[pageId];
  if(!builder||!hasPageData(pageId,state))return '';
  try{return builder(state)||'';}catch{return '';}
}

export function listVisualPages(){return Object.keys(BUILDERS);}
export { BUSINESSCASE_FACTOR };
