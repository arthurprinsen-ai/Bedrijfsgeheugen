import { radar, gantt, curve, quadrant, benchmarkBars, ring, leakage, ladder, dupont, gauge, adoptionBell, companyStateRail } from './visuals.js';
import { calculateLegacyEquivalent } from './legacy-parity-engine.js';
import { PROFILE_DIMENSIONS, profileOverviewMetrics } from './modules/company-input.js';
import { hasPageData } from './page-metrics.js';
import { BREIN_STAPPEN } from './runtime-evidence.js';
import { brancheVergelijking, brancheProfiel, onderzoekVoor } from './external-data.js';
import { dataBronnen, bronnenSamenvatting, SOORTEN } from './data-sources.js';
import { bouwPassport, bouwAuditRapport, STATUS_LABEL } from './passport.js';
import { routeOverzicht } from './flow-state.js';
import { bevindingen, bevindingenSamenvatting } from './bevindingen.js';
import { REGELGEVING, komendeMijlpalen, lopendeVerplichtingen } from './regelgeving.js';

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
    const maturityValues=points.map(point=>point.value);
    const adoption=Array.from({length:5},(_,index)=>{
      const level=index+1;
      return {label:`N${level}`,value:maturityValues.length?Math.round(maturityValues.filter(value=>value>=level).length/maturityValues.length*100):0};
    });
    const capacity=arr(calc('dimension-costs',state)).map(item=>({label:item.label||item.id||'Onderdeel',value:n(item.kosten)}));
    const blockers=arr(calc('blocker-ranking',state)).map(item=>({label:item.name||item.title||'Blokkade',value:n(item.score)||n(item.impact)}));
    const progress=n(calc('progress',state));
    const avg=maturityValues.length?maturityValues.reduce((a,b)=>a+b,0)/maturityValues.length:1;
    const current=Math.max(1,Math.min(5,avg||1));
    const benchmark=Math.max(1,Math.min(5,n(at(state,'portal.market.maturityBenchmark'))||3));
    return [companyStateRail({current,benchmark,upperQuartile:4},{title:'De staat van je bedrijf'}),
      ladder(arr(calc('cmmi-ladder',state)),{title:'Procesvolwassenheid (CMMI)'}),
      adoptionBell({current,benchmark,upperQuartile:4},{title:'Waar je staat op de adoptiecurve'}),
      radar(points,{title:'Volwassenheid per bedrijfsonderdeel'}),
      leakage(capacity,{title:'Waar de tijd weglekt'}),
      leakage(blockers,{title:'Blokkades'}),
      ring(Math.min(100,Math.max(0,progress)),{title:'Voortgang',caption:'voortgang op de roadmap'}),
      ring(Math.min(100,metrics.averageMaturity/5*100),{title:'Volwassenheid',caption:'gemiddeld over de onderdelen'})].filter(Boolean).join('');
  },

  profiel:state=>{
    const profile=at(state,'portal.profile')||{};
    const points=PROFILE_DIMENSIONS.map(dimension=>({label:dimension.label||dimension.id,value:n(profile.maturity?.[dimension.id])})).filter(point=>point.value>0);
    const comparison=PROFILE_DIMENSIONS.map(dimension=>({label:dimension.label||dimension.id,value:n(profile.maturity?.[dimension.id]),benchmark:n(dimension.top)})).filter(point=>point.value>0);
    return [benchmarkBars(comparison,{title:'Profiel tegenover de bovenste 25%'}),radar(points,{title:'Alles in één beeld'})].filter(Boolean).join('');
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

  'branche-markt':state=>{
    const branche=at(state,'portal.market.industry');
    const rijen=brancheVergelijking({
      grossMargin:n(calc('gross-margin',state)), ebitdaMargin:n(calc('ebitda-margin',state)),
      wageRatio:n(calc('wage-ratio',state)), marketingRatio:n(calc('marketing-ratio',state)),
      itRatio:n(calc('it-ratio',state)), dso:n(calc('dso',state)),
      absence:n(at(state,'portal.people.absence')), turnover:n(at(state,'portal.people.turnover')),
      enps:n(at(state,'portal.people.enps'))
    },branche);
    const b=brancheProfiel(branche);
    return [benchmarkBars(rijen.map(r=>({label:r.maatstaf,value:r.eigen,benchmark:r.norm})),
        {title:`Jouw cijfers tegen de norm in ${branche||'het gemiddelde NL-bedrijf'} (CBS, Eurostat, sectorbenchmarks)`}),
      benchmarkBars(arr(at(state,'portal.market.benchmarks')).map(row=>({label:row.metric,value:n(row.company),benchmark:n(row.benchmark)})),
        {title:'Eigen benchmarks'}),
      b?ring(Math.min(100,n(b.dig)/5*100),{title:'Digitale intensiteit van de sector',caption:`${b.inst||''} · groei ${n(b.groei)}%`}):''
    ].filter(Boolean).join('');
  },

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
  uitvoeringsladder:state=>{
    const steps=at(state,'portal.execution.completed')||{};
    const roadmap=arr(at(state,'portal.roadmap.items'));
    const flattened=Object.entries(steps).flatMap(([theme,values])=>arr(values).map((done,index)=>({theme,index,done:Boolean(done)})));
    const cumulative=[];let done=0;flattened.forEach((item,index)=>{if(item.done)done++;cumulative.push({label:String(index+1),value:done});});
    return [gantt(roadmap,{title:'Planning van de uitvoeringsladder'}),
      cumulative.length>1?curve(cumulative,{title:'Opgeleverde waarde',valueLabel:'afgeronde treden'}):''].filter(Boolean).join('');
  },

  advies:state=>{
    const items=bevindingen(state);
    if(!items.length)return '';
    const metWaarde=items.filter(b=>b.waarde);
    const perSoort={};for(const b of items)perSoort[b.soort]=(perSoort[b.soort]||0)+1;
    return [
      metWaarde.length?leakage(metWaarde.map(b=>({label:b.titel,value:b.waarde})),
        {title:`Waar de ${bevindingenSamenvatting(state).waardePerJaar.toLocaleString('nl-NL')} euro per jaar zit`}):'',
      ladder(items.slice(0,6).map((b,i)=>({naam:b.titel.slice(0,18),uitleg:b.bewijs,huidig:i===0})),
        {title:'In welke volgorde aanpakken'}),
      leakage(Object.entries(perSoort).map(([label,value])=>({label,value})),{title:'Waar de bevindingen vandaan komen'})
    ].filter(Boolean).join('');
  },  'compliance-governance':state=>{
    const p=at(state,'portal.profile')||{},m=p.maturity||{},comp=at(state,'portal.compliance')||{};
    const tech=[['Systemen en AI','tech'],['Stuurinformatie','analytics'],['Datakwaliteit','quality'],['Beveiliging','security']]
      .map(([label,id])=>({label,value:n(m[id]),benchmark:4})).filter(x=>x.value>0);
    const gov=[['Governance','governance'],['Datakwaliteit','quality'],['Stuurinformatie','analytics']]
      .map(([label,id])=>({label,value:n(m[id]),benchmark:4})).filter(x=>x.value>0);
    const raw=arr(comp.esg),groups=[['Milieu',[0,1,2,3,4]],['Sociaal',[5,6,7,8]],['Bestuur',[9,10]]];
    const esgPoints=groups.map(([label,indexes])=>{
      const values=indexes.map(i=>n(raw[i])),covered=values.filter(v=>v>0).length,automatic=values.filter(v=>v>=2).length;
      return {label,x:indexes.length?automatic/indexes.length*100:0,y:indexes.length?covered/indexes.length*100:0};
    }).filter(x=>x.x>0||x.y>0);
    return [benchmarkBars(tech,{title:'Staat van de techniek'}),
      benchmarkBars(gov,{title:'Governance-volwassenheid'}),
      esgPoints.length?quadrant(esgPoints,{title:'CSRD-gereedheid',xLabel:'hoe automatisch de cijfers komen →',yLabel:'hoeveel onderwerpen je dekt →'}):''].filter(Boolean).join('');
  },

  'strategie-naar-maandagochtend':state=>{
    const findings=arr(at(state,'portal.strategy.findings'));
    const points=findings.map(item=>({label:item.finding||item.title||item.model||'Bevinding',x:n(item.duration||item.horizonMonths||item.months),y:n(item.value)}))
      .filter(item=>item.x>0&&item.y!==0);
    const perModel={};for(const item of findings){const key=item.model||'Onbekend model';perModel[key]=(perModel[key]||0)+1;}
    return [points.length?quadrant(points,{title:'Alle modellen in één beeld',xLabel:'Doorlooptijd / horizon',yLabel:'Opbrengst'}):'',
      Object.keys(perModel).length?leakage(Object.entries(perModel).map(([label,value])=>({label,value})),{title:'Per functie'}):''].filter(Boolean).join('');
  },

  'compliance-command-center':state=>ring(100-n(calc('compliance-risk',state)),{title:'Compliance readiness',caption:'restrisico afgetrokken'}),
  'data-ai-passport':state=>{
    const p=bouwPassport(state);const v=p.samenvatting;
    const perCategorie={};
    for(const c of p.controls)perCategorie[c.categorie]=(perCategorie[c.categorie]||0)+1;
    return [ring(v.bewijsdekkingPct,{title:'Bewijsdekking',caption:`${v.verified} geverifieerd, ${v.deels} gedeeltelijk`}),
      benchmarkBars(p.controls.map(c=>({label:c.label,value:c.bewijsGeverifieerd,benchmark:Math.max(1,c.bewijsAantal)})),
        {title:'Bewijs per control'}),
      leakage(Object.entries(perCategorie).map(([label,value])=>({label,value})),{title:'Controls per gebied'})
    ].filter(Boolean).join('');
  },

  'eu-ai-act-audit':state=>{
    const r=bouwAuditRapport(state);
    const vandaag=new Date().toISOString().slice(0,10);
    const komend=r.baseline.mijlpalen.filter(m=>m.datum>=vandaag);
    return [ring(r.bevindingen.length?0:100,{title:'Bevindingen afgehandeld',caption:`${r.bevindingen.length} open`}),
      komend.length?ladder(komend.slice(0,6).map((m,i)=>({naam:m.datum,uitleg:`${m.regel}: ${m.wat}`,huidig:i===0})),
        {title:'Wat er in de AI Act als eerste verandert'}):''
    ].filter(Boolean).join('');
  },

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

  'ai-capabilities':state=>{
    /* De kosten per bedrijfsonderdeel horen hier: dit is de pagina waar de
       bevindingen over handwerk naartoe verwijzen. Elk ingevuld
       volwassenheidsniveau krijgt zo een bedrag per jaar. */
    const kosten=arr(calc('dimension-costs',state));
    return [radar(Object.entries(at(state,'portal.aiCapabilities')||{}).map(([key,value])=>({label:String(key),value:n(value)})),{title:'AI-capabilities'}),
      kosten.length?leakage(kosten.map(d=>({label:d.label,value:n(d.kosten)})),
        {title:'Wat elk onderdeel per jaar kost op zijn huidige niveau'}):'',
      kosten.length?benchmarkBars(kosten.map(d=>({label:d.label,value:n(d.kosten)-n(d.potentieel),benchmark:n(d.kosten)})),
        {title:'Wat het zou kosten op streefniveau'}):''
    ].filter(Boolean).join('');
  },

  'data-ai':state=>{
    const phases=['In hoofden','In lijstjes','In systemen','Verbonden','Zelfsturend'];
    const profile=at(state,'portal.profile')||{},m=profile.maturity||{};
    const five=[['Systemen en koppelingen','tech'],['Stuurinformatie','analytics'],['Datakwaliteit','quality'],['Governance','governance'],['Beveiliging','security']]
      .map(([label,id])=>({label,value:n(m[id])})).filter(x=>x.value>0);
    const gem=five.length?five.reduce((s,x)=>s+x.value,0)/five.length:0;
    const current=gem?Math.max(1,Math.min(5,Math.round(gem))):Math.max(1,phases.indexOf(at(state,'portal.dataAi.phase'))+1);
    const maturityValues=PROFILE_DIMENSIONS.map(d=>n(m[d.id])).filter(Boolean);
    const avgAll=maturityValues.length?maturityValues.reduce((a,b)=>a+b,0)/maturityValues.length:0;
    const costs=arr(calc('dimension-costs',state));
    const currentCost=costs.reduce((s,x)=>s+n(x.kosten),0),targetCost=costs.reduce((s,x)=>s+n(x.potentieel),0);
    const benefit=Math.max(0,currentCost-targetCost);
    const benefitCurve=benefit>0?[0,12,24,36].map(month=>({label:month?month+' mnd':'nu',value:benefit/12*month})):[];
    const change=[{label:'Ontkenning',value:3},{label:'Weerstand',value:1},{label:'Verkenning',value:2},{label:'Aanvaarding',value:4}];
    return [radar(five,{title:'Data en AI per onderdeel'}),
      ladder(phases.map((name,index)=>({naam:name,bereikt:index+1<=current,huidig:index+1===current})),{title:'Fasen van invoering'}),
      curve(change,{title:'Verandercurve',valueLabel:'modelpositie'}),
      benefitCurve.length?curve(benefitCurve,{title:'Kosten en opbrengsten',valueLabel:'capaciteitswaarde'}):'',
      ladder([1,2,3,4,5].map(level=>({naam:`Niveau ${level}`,bereikt:avgAll>=level,huidig:Math.round(avgAll)===level})),{title:'CMMI-trap'}),
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
    const profile=at(state,'portal.profile')||{},m=profile.maturity||{};
    const costs=arr(calc('dimension-costs',state));
    const q=costs.map(x=>({label:x.label||x.id,x:n(m[x.id]),y:n(x.kosten)})).filter(x=>x.x>0&&x.y>0);
    const costRows=costs.map(x=>({label:x.label||x.id,value:n(x.kosten),benchmark:n(x.potentieel)})).filter(x=>x.value>0);
    const extern=onderzoekVoor().filter(x=>/^\d/.test(String(x.cijfer||'')));
    const externBeeld=benchmarkBars(extern.slice(0,6).map(x=>({label:x.t,value:parseFloat(String(x.cijfer))||0,benchmark:100})),
      {title:'Wat extern onderzoek meet (McKinsey, MIT, CBS en anderen)'});
    const metBewijs=items.filter(item=>item.evidence).length;
    const metBron=items.filter(item=>item.source).length;
    return [q.length?quadrant(q,{title:'Onderdelen in vier vakken',xLabel:'Volwassenheid',yLabel:'Kosten van huidige werkwijze'}):'',
      costRows.length?benchmarkBars(costRows,{title:'Kosten van niets doen'}):'',
      items.length?ring(metBewijs/items.length*100,{title:'Hypotheses met bewijs',caption:`${metBewijs} van ${items.length}`}):'',
      items.length?benchmarkBars([{label:'Met bewijs',value:metBewijs,benchmark:items.length},{label:'Met bron',value:metBron,benchmark:items.length}],{title:'Onderbouwing van je hypotheses'}):'',
      externBeeld].filter(Boolean).join('');
  },


  /* Brein en Powerhouse: beeld op de projectie van de operating loop. */
  bronnenstatus:state=>{
    const bronnen=dataBronnen(state||{});
    const sam=bronnenSamenvatting(state||{});
    const perSoort=Object.entries(sam.perSoort).map(([soort,aantal])=>({label:SOORTEN[soort]||soort,value:aantal}));
    const integraties=arr(at(state,'portal.runtime.sources.items'));
    return [ring(sam.totaal?sam.gezond/sam.totaal*100:0,{title:'De lus is rond',caption:`${sam.gezond} van de ${sam.totaal} bronnen voeden het portaal`}),
      leakage(perSoort,{title:'Waar de data vandaan komt'}),
      benchmarkBars(bronnen.map(b=>({label:b.naam,value:b.gezond?1:0,benchmark:1})),{title:'Per bron: voedt hij het portaal?'}),
      integraties.length?benchmarkBars(integraties.slice(0,8).map(x=>({label:x.naam,value:x.healthy?1:0,benchmark:1})),{title:'Aangesloten bronsystemen'}):''
    ].filter(Boolean).join('');},

  'brain-verwerking':state=>{const s=at(state,'portal.runtime.brain')||{};const stappen=arr(s.items);
    return [ladder(stappen.map(x=>({naam:x.naam,bereikt:x.healthy,huidig:!x.healthy&&x.lussen>0})),{title:'De dertien stappen van een breinlus'}),
      ring(s.loops?(s.compleet||0)/s.loops*100:0,{title:'Lussen rond',caption:`${s.compleet||0} van ${s.loops||0}`})].filter(Boolean).join('');},

  datahubstatus:state=>{const s=at(state,'portal.runtime.datahub')||{};const nodes=arr(s.items).length;
    return benchmarkBars([{label:'Entiteiten',value:nodes,benchmark:nodes},{label:'Verbindingen',value:n(s.edges),benchmark:nodes}],{title:'Omvang van de bedrijfsgraaf'});},

  agentstatus:state=>{const items=arr(at(state,'portal.runtime.agents.items'));
    const route=routeOverzicht(arr(at(state,'portal.runtime.agents.route')));
    return [route.length?ladder(route,{title:'Route door het Powerhouse, tot waar hij komt'}):'',
      curve(items.slice(-24).map((x,i)=>({label:String(i+1),value:x.healthy?1:0})),{title:'Doorloop van agentruns',valueLabel:'ok'})
    ].filter(Boolean).join('');},

  'actieve-acties':state=>quadrant(arr(at(state,'portal.runtime.actions.items')).map((x,i)=>({label:x.naam,x:i+1,y:n(x.waarde)})),{title:'Acties: waarde tegen volgorde',xLabel:'Volgorde',yLabel:'Waarde'}),

  'recovery-obligations':state=>{const s=at(state,'portal.runtime.recovery')||{};const items=arr(s.items);
    return ring(items.length?0:100,{title:'Verplichtingen afgehandeld',caption:`${items.length} open · ${n(s.openLoops)} open lussen`});},

  'outcomes-evidence':state=>{const items=arr(at(state,'portal.runtime.outcomes.items'));
    return [ring(items.length?items.filter(x=>x.healthy).length/items.length*100:0,{title:'Geverifieerd',caption:`${items.filter(x=>x.healthy).length} van ${items.length}`}),
      leakage(items.map(x=>({label:x.naam,value:n(x.waarde)})),{title:'Waar de geverifieerde waarde zit'})].filter(Boolean).join('');},

  'learning-writeback':state=>{const items=arr(at(state,'portal.runtime.learning.items'));
    return ring(items.length?items.filter(x=>x.healthy).length/items.length*100:0,{title:'Bewezen leringen',caption:`${items.filter(x=>x.healthy).length} van ${items.length}`});},

  'self-heal':state=>{const s=at(state,'portal.runtime.selfHeal')||{};const items=arr(s.items);
    return [ring(s.totaal?(n(s.compleet)/n(s.totaal))*100:0,{title:'Lussen die zichzelf rondmaken',caption:`${n(s.compleet)} van ${n(s.totaal)}`}),
      benchmarkBars(items.slice(0,6).map(x=>({label:x.naam,value:BREIN_STAPPEN.length-n(x.ontbreekt),benchmark:BREIN_STAPPEN.length})),{title:'Hoe ver elke lus komt'})].filter(Boolean).join('');},

  audittrail:state=>{const items=arr(at(state,'portal.runtime.audit.items'));
    const perSoort={};for(const x of items)perSoort[x.naam]=(perSoort[x.naam]||0)+1;
    return leakage(Object.entries(perSoort).map(([label,value])=>({label,value})),{title:'Vastgelegde records per soort'});},

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