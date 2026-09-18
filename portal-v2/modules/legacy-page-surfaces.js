const n=v=>Number.isFinite(Number(v))?Number(v):0;
const pct=v=>`${Math.round(n(v))}%`;
const euro=v=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n(v));
const one=v=>new Intl.NumberFormat('nl-NL',{maximumFractionDigits:1,minimumFractionDigits:1}).format(n(v));
const arr=v=>Array.isArray(v)?v:[];
const has=v=>v!==undefined&&v!==null&&v!=='';
const text=(v,fallback='Nog niet ingevuld')=>has(v)?String(v):fallback;
const done=x=>x?.done===true||x?.klaar===true||['Gereed','Afgerond','Done','Completed'].includes(x?.status);
const section=(title,items=[],note='')=>Object.freeze({title,items:Object.freeze(items.map(x=>Object.freeze(x))),note});

function genericCompleteness(object={}){
 const values=Object.values(object||{}).filter(v=>typeof v!=='object');
 return values.length?Math.round(values.filter(has).length/values.length*100):0;
}
function metrics(state){return state?.portal?.metrics||{}}
function valueFinance(state){return state?.portal?.valueFinance||{}}
function profile(state){return state?.portal?.profile||{}}

export const LEGACY_PAGE_HEADINGS=Object.freeze({
 'data-ai':['Waar je staat met data en AI','Wat dat betekent','De vijf fasen van invoering','Wat mensen doen bij verandering','Hoe je het bestuurt','Kosten en opbrengsten over de tijd','CMMI — procesvolwassenheid','Greiner — groeifasen en hun crisis','De afspraken eronder'],
 'ai-scan':['De kansenkaart','Waar de kansen zitten','Wat dit betekent','Per taak: wat het oplevert en wanneer','Een ijkpunt: is dit veel?','De volgorde'],
 profiel:['Je onderdelen — schuif om bij te werken','Profiel tegenover de bovenste 25%','Alles in één beeld','Wat een niveau erbij oplevert'],
 mensen:['Wat je van je mensen weet','Tegenover je branche'],
 'gegevens-invullen':['Je gegevens invullen','Bedrijfscijfers','Balans en financiering','Mensen','Productiviteit en operatie','Klanten','Metingen toevoegen','Beleid en documenten','Duurzaamheid en CSRD','Wat hieruit blijkt'],
 businesscase:['Wat levert het op — en wat kost wachten?','Cumulatief nettoresultaat','Waar je staat op de adoptiecurve'],
 'waarde-financiering':['De cijfers achter de waarde','Wat is het bedrijf waard?','Gezondheid en financierbaarheid','DuPont — waar komt het rendement vandaan?','Gevoeligheid — wat doet een verbetering met de waarde?','Break-even en veiligheidsmarge'],
 onderzoek:['Je onderdelen in vier vakken','Wat niets doen kost','Hoe je deze cijfers moet lezen'],
 'compliance-governance':['Staat van de techniek','Governance-volwassenheid','CSRD en duurzaamheid — waar sta je?','Wat er op papier staat','Deadlines en boetes','Incident: wat is het plan?'],
 'strategie-naar-maandagochtend':['Alle modellen in één beeld','Per functie'],
 'cijfers-maatstaven':['Je eigen cijfers','Je maatstaven','Tegenover je branche','Klanttevredenheid (KTO)','Trusted advisor — waar sta je bij je klant?','Productiviteit','Metingen over de tijd','Wat dit betekent'],
 'branche-markt':['Je branche en je concurrenten'],
 eindconclusie:['Waar alle bronnen naar wijzen','Wat het oplevert tegenover wat het kost','De vijf aanbevelingen'],
 'actueel-houden':['Actueel houden','Wie gaat waarover','Besluiten','Documenten','Van wijziging naar taken','De taken per afdeling','Wat er is veranderd'],
 advies:['Wat wij je zouden adviseren'],
 uitvoeringsladder:['De Uitvoeringsladder','De planning','Wat het tot nu toe heeft opgeleverd','Wat Bedrijfsgeheugen hierin doet'],
 roadmap:['Wat je gaat verbeteren'],
 'due-diligence':['Due diligence & exit']
});

function dataAi(state){
 const x=state?.portal?.dataAi||{};
 return [
  section('Waar je staat met data en AI',[['Volwassenheid',has(x.maturity)?`${x.maturity}/5`:'Nog niet ingevuld'],['Implementatiefase',text(x.phase)],['Veranderbereidheid',has(x.changeReadiness)?`${x.changeReadiness}/5`:'Nog niet ingevuld']]),
  section('Wat dat betekent',[['Readiness',pct(genericCompleteness(x))],['Governance',has(x.governance)?`${x.governance}/5`:'Nog niet ingevuld']]),
  section('De vijf fasen van invoering',[['1','Oriëntatie'],['2','Fundament'],['3','Pilot'],['4','Opschalen'],['5','Borgen']],text(x.phase,'Nog geen fase gekozen')),
  section('Wat mensen doen bij verandering',[['Veranderbereidheid',has(x.changeReadiness)?`${x.changeReadiness}/5`:'Nog niet gemeten']]),
  section('Hoe je het bestuurt',[['Governance readiness',has(x.governance)?`${x.governance}/5`:'Nog niet gemeten']]),
  section('Kosten en opbrengsten over de tijd',[['Baten/kosten-ratio',has(x.costBenefit)?one(x.costBenefit):'Nog niet berekend']]),
  section('CMMI — procesvolwassenheid',[['Niveau',has(x.maturity)?String(x.maturity):'Nog niet bepaald']]),
  section('Greiner — groeifasen en hun crisis',[['Organisatiefase',text(x.greinerPhase)]], 'Geen fase wordt verondersteld zonder klant- of evidencebron.'),
  section('De afspraken eronder',[['Eigenaar',text(x.owner)],['Reviewritme',text(x.reviewCadence)]])
 ];
}
function aiScan(state){
 const s=state?.portal?.aiScan||{},tasks=arr(s.tasks),rate=n(s.hourlyRate);
 const rows=tasks.map(t=>[text(t.task,'Taak'),`${one(t.hoursPerWeek)} uur/week · ${euro(n(t.hoursPerWeek)*46*rate)}/jaar`]);
 const total=tasks.reduce((sum,t)=>sum+n(t.hoursPerWeek)*46*rate,0);
 return [
  section('De kansenkaart',[['Taken',String(tasks.length)],['Jaarwaarde',tasks.length?euro(total):'Nog niet berekend']]),
  section('Waar de kansen zitten',rows.slice(0,8),tasks.length?'':'Nog geen taken vastgelegd.'),
  section('Wat dit betekent',[['Uurtarief',rate?euro(rate):'Nog niet ingevuld'],['Data readiness',tasks.length?one(tasks.reduce((s,t)=>s+n(t.dataReadiness),0)/tasks.length)+'/5':'Nog niet bepaald']]),
  section('Per taak: wat het oplevert en wanneer',rows,tasks.length?'':'Nog geen taakdata.'),
  section('Een ijkpunt: is dit veel?',[['Totaal handwerk per jaar',tasks.length?euro(total):'Nog niet berekend']], 'Benchmark blijft leeg zonder bron.'),
  section('De volgorde',tasks.slice().sort((a,b)=>n(b.hoursPerWeek)-n(a.hoursPerWeek)).slice(0,5).map((t,i)=>[`${i+1}. ${text(t.task,'Taak')}`,`${one(t.hoursPerWeek)} uur/week`]),tasks.length?'':'Nog geen taken om te rangschikken.')
 ];
}
function valueSurface(state){
 const m=metrics(state),v=valueFinance(state),revenue=n(m.revenue),ebitda=n(m.ebitda),multiple=n(v.multiple),debt=n(v.debt),cash=n(v.cash),equity=n(v.equity),balance=n(v.balance),interest=n(v.interest),fixed=n(v.fixed);
 const enterprise=ebitda*multiple,eq=enterprise-debt+cash,margin=revenue?ebitda/revenue*100:0,solv=balance?equity/balance*100:0,cover=interest?ebitda/interest:0,breakEven=margin>0?fixed/(margin/100):0;
 return [
  section('De cijfers achter de waarde',[['Omzet',revenue?euro(revenue*1000):'Nog niet ingevuld'],['EBITDA',has(m.ebitda)?euro(ebitda*1000):'Nog niet ingevuld'],['Multiple',multiple?`${one(multiple)}×`:'Nog niet ingevuld']]),
  section('Wat is het bedrijf waard?',[['Enterprise value',multiple&&has(m.ebitda)?euro(enterprise*1000):'Nog niet berekend'],['Equity value',multiple&&has(m.ebitda)?euro(eq*1000):'Nog niet berekend']]),
  section('Gezondheid en financierbaarheid',[['Solvabiliteit',balance?pct(solv):'Nog niet berekend'],['Rentedekking',interest?`${one(cover)}×`:'Nog niet berekend']]),
  section('DuPont — waar komt het rendement vandaan?',[['EBITDA-marge',revenue?pct(margin):'Nog niet berekend'],['Omloopsnelheid',balance&&revenue?one(revenue/balance)+'×':'Nog niet berekend'],['Financiële hefboom',equity&&balance?one(balance/equity)+'×':'Nog niet berekend']]),
  section('Gevoeligheid — wat doet een verbetering met de waarde?',[['+1 EBITDA',multiple?euro(multiple*1000):'Multiple ontbreekt'],['+10 EBITDA',multiple?euro(multiple*10000):'Multiple ontbreekt']]),
  section('Break-even en veiligheidsmarge',[['Break-even omzet',breakEven?euro(breakEven*1000):'Nog niet berekend'],['Veiligheidsmarge',breakEven&&revenue?pct((revenue-breakEven)/revenue*100):'Nog niet berekend']])
 ];
}
function research(state){
 const r=state?.portal?.research||{},hy=arr(r.hypotheses),p=profile(state),mat=p.maturity||{};
 const dims=Object.entries(mat).map(([k,v])=>[k,`niveau ${v}`]);
 return [
  section('Je onderdelen in vier vakken',dims.slice(0,13),dims.length?'':'Nog geen maturity-data.'),
  section('Wat niets doen kost',[['Hypotheses',String(hy.length)],['Onderbouwd',String(hy.filter(x=>x.evidence||x.source).length)]], 'Kosten blijven leeg zonder berekende capaciteit.'),
  section('Hoe je deze cijfers moet lezen',[['Bronregel','Eigen data eerst; externe benchmarks alleen met bron'],['Zekerheid','Hypothese en feit blijven afzonderlijk']])
 ];
}
function compliance(state){
 const c=state?.portal?.compliance||{},pol=Array.isArray(c.policies)?c.policies:[],esg=Array.isArray(c.esg)?c.esg:[];
 const established=pol.filter(x=>['vastgesteld','geoefend'].includes(String(x).toLowerCase())).length;
 return [
  section('Staat van de techniek',[['Beleidsstukken',String(pol.length)],['Vastgesteld/geoefend',String(established)]]),
  section('Governance-volwassenheid',[['Volledigheid',pol.length?pct(established/pol.length*100):'Nog niet bepaald']]),
  section('CSRD en duurzaamheid — waar sta je?',[['Onderwerpen',String(esg.length)],['Gemiddeld',esg.length?`${one(esg.reduce((a,b)=>a+n(b),0)/esg.length)}/5`:'Nog niet bepaald']]),
  section('Wat er op papier staat',pol.map((x,i)=>[`Beleidsstuk ${i+1}`,text(x)]),pol.length?'':'Nog geen beleidsstatus vastgelegd.'),
  section('Deadlines en boetes',arr(c.deadlines).map(x=>[text(x.title||x.rule,'Verplichting'),text(x.deadline||x.status)]),'Alleen zichtbaar wanneer een bron of deadline is vastgelegd.'),
  section('Incident: wat is het plan?',[['Incident-responseplan',text(c.incidentPlan)],['Eigenaar',text(c.incidentOwner)]])
 ];
}
function cijfers(state){
 const m=metrics(state),market=state?.portal?.market||{},measurements=arr(m.measurements||state?.portal?.inputs?.measurements);
 const revenue=n(m.revenue),ebitda=n(m.ebitda),wages=n(m.wages),customers=n(m.customers);
 return [
  section('Je eigen cijfers',[['Omzet',has(m.revenue)?euro(revenue*1000):'Nog niet ingevuld'],['EBITDA',has(m.ebitda)?euro(ebitda*1000):'Nog niet ingevuld'],['Klanten',has(m.customers)?String(customers):'Nog niet ingevuld']]),
  section('Je maatstaven',[['EBITDA-marge',revenue?pct(ebitda/revenue*100):'Nog niet berekend'],['Loonquote',revenue?pct(wages/revenue*100):'Nog niet berekend'],['Omzet per klant',customers?euro(revenue*1000/customers):'Nog niet berekend']]),
  section('Tegenover je branche',[['Branche',text(market.industry)],['Benchmarks',String(arr(market.benchmarks).length)]], 'Geen branchewaarde zonder bron.'),
  section('Klanttevredenheid (KTO)',[['NPS',has(m.nps)?String(m.nps):'Nog niet ingevuld'],['Tevredenheid',has(m.satisfaction)?`${one(m.satisfaction)}/10`:'Nog niet ingevuld'],['Klachten',has(m.complaints)?String(m.complaints):'Nog niet ingevuld']]),
  section('Trusted advisor — waar sta je bij je klant?',[['Herhaalaankopen',has(m.repeat)?pct(m.repeat):'Nog niet ingevuld'],['Klantverloop',has(m.performance?.churn)?pct(m.performance.churn):'Nog niet ingevuld']]),
  section('Productiviteit',[['Declarabel/productief',has(m.performance?.billable)?pct(m.performance.billable):'Nog niet ingevuld'],['Op tijd geleverd',has(m.performance?.onTime)?pct(m.performance.onTime):'Nog niet ingevuld'],['Doorlooptijd',has(m.performance?.leadTime)?`${m.performance.leadTime} dagen`:'Nog niet ingevuld']]),
  section('Metingen over de tijd',measurements.map(x=>[text(x.type||x.metric,'Meting'),`${text(x.value,'—')} · ${text(x.date,'geen datum')}`]),measurements.length?'':'Nog geen meetreeks.'),
  section('Wat dit betekent',[['Volledigheid',pct(genericCompleteness(m))],['Interpretatie','Meer eigen cijfers maakt benchmarks en advies scherper']])
 ];
}
function businessCaseSurface(state){
 const p=profile(state),bc=state?.portal?.businessCase||{},dims=p.maturity||{},factor=[0,1,.78,.5,.22,.06],employees=n(p.employees||p.headcount),hourly=n(p.hourlyCost),target=Math.max(2,Math.min(5,Math.round(n(bc.target)||4))),delay=Math.max(0,n(bc.delay)),investment=n(bc.investment);
 const weights={sturing:1.6,commercie:2.8,operatie:3.4,finance:3.6,mensen:1.5,analytics:2.2,quality:1.9,governance:1.2,tech:4.1,culture:1.1,service:2.4,security:1.3,duurzaam:1.0};
 let current=0,goal=0;
 if(employees&&hourly)for(const [id,hours] of Object.entries(weights)){const level=Math.max(1,Math.min(5,Math.round(n(dims[id])||2))),to=Math.max(level,target),base=hours*(employees/24)*46*hourly;current+=base*factor[level];goal+=base*factor[to];}
 const annual=Math.max(0,current-goal),monthly=annual/12;
 return [
  section('Wat levert het op — en wat kost wachten?',[['Jaarpotentieel',annual?euro(annual):'Nog niet berekend'],['Kosten van uitstel',annual?euro(monthly*delay):'Nog niet berekend'],['Investering',has(bc.investment)?euro(investment):'Nog niet ingevuld']]),
  section('Cumulatief nettoresultaat',[['Na 12 maanden',annual||investment?euro(annual-investment):'Nog niet berekend'],['Na 36 maanden',annual||investment?euro(annual*3-investment):'Nog niet berekend']]),
  section('Waar je staat op de adoptiecurve',[['Doelniveau',String(target)],['Huidig gemiddeld',Object.keys(dims).length?one(Object.values(dims).reduce((a,b)=>a+n(b),0)/Object.keys(dims).length)+'/5':'Nog niet bepaald']])
 ];
}
function peopleSurface(state){
 const p=state?.portal?.people||{},market=state?.portal?.market||{};
 return [
  section('Wat je van je mensen weet',[['Verzuim',has(p.absence)?pct(p.absence):'Nog niet ingevuld'],['Verloop',has(p.turnover)?pct(p.turnover):'Nog niet ingevuld'],['eNPS',has(p.enps)?String(p.enps):'Nog niet ingevuld'],['Vacatures',has(p.vacancies)?String(p.vacancies):'Nog niet ingevuld']]),
  section('Tegenover je branche',[['Branche',text(market.industry)],['Benchmarks',String(arr(market.benchmarks).length)]],'Geen benchmarkwaarde zonder bron.')
 ];
}
function marketSurface(state){
 const m=state?.portal?.market||{},bench=arr(m.benchmarks);
 return [section('Je branche en je concurrenten',[['Branche',text(m.industry)],['Omzet',has(m.revenue)?euro(n(m.revenue)*1000):'Nog niet ingevuld'],['Benchmarks',String(bench.length)],...bench.slice(0,6).map(x=>[text(x.metric,'Maatstaf'),`${text(x.company,'—')} vs ${text(x.benchmark,'—')} · ${text(x.source,'bron ontbreekt')}`])])];
}
function strategySurface(state){
 const s=state?.portal?.strategy||{},findings=arr(s.findings);
 const byModel=new Map();for(const x of findings){const key=text(x.model,'Onbekend model');byModel.set(key,(byModel.get(key)||0)+1)}
 return [
  section('Alle modellen in één beeld',[['Bevindingen',String(findings.length)],['Horizon',text(s.horizon)],['Minimumwaarde',has(s.minimumValue)?euro(s.minimumValue):'Niet ingesteld'],...findings.slice(0,8).map(x=>[text(x.finding,'Bevinding'),`${text(x.model,'Geen model')} · ${has(x.value)?euro(x.value):'waarde onbekend'}`])],findings.length?'':'Nog geen modelbevindingen.'),
  section('Per functie',[...byModel.entries()].map(([model,count])=>[model,String(count)]),byModel.size?'':'Nog geen bevindingen per model/functie.')
 ];
}

function conclusion(state){
 const f=state?.portal?.finalConclusion||{},ad=arr(state?.portal?.advice?.items),road=arr(state?.portal?.roadmap?.items);
 return [
  section('Waar alle bronnen naar wijzen',[['Bestuurlijke conclusie',text(f.text)],['Besluit',text(f.decision)],['Eigenaar',text(f.owner)]]),
  section('Wat het oplevert tegenover wat het kost',[['Adviezen',String(ad.length)],['Roadmapacties',String(road.length)],['Afgerond',String(road.filter(done).length)]]),
  section('De vijf aanbevelingen',ad.slice(0,5).map((x,i)=>[`${i+1}. ${text(x.title||x.advice||x.label,'Advies')}`,text(x.rationale||x.priority,'Nog geen onderbouwing')]),ad.length?'':'Nog geen aanbevelingen.')
 ];
}
function freshness(state){
 const f=state?.portal?.freshness||{},changes=arr(state?.portal?.changes?.items),tasks=arr(state?.portal?.tasks?.items);
 return [
  section('Actueel houden',[['Laatste wijziging',text(f.what)],['Datum',text(f.date)],['Door',text(f.by)]]),
  section('Wie gaat waarover',[['Eigenaar wijziging',text(f.by)],['Document-eigenaar',text(f.documentOwner)]]),
  section('Besluiten',arr(f.decisions).map(x=>[text(x.title||x.decision,'Besluit'),text(x.date||x.owner)]),'Nog geen besluitenregister.'),
  section('Documenten',[['Document',text(f.document)],['Reviewdatum',text(f.reviewDate)]]),
  section('Van wijziging naar taken',[['Taken',String(tasks.length)],['Open',String(tasks.filter(x=>!done(x)).length)]]),
  section('De taken per afdeling',tasks.map(x=>[text(x.title,'Taak'),`${text(x.department,'Geen afdeling')} · ${text(x.owner,'Geen eigenaar')}`]),tasks.length?'':'Nog geen taken.'),
  section('Wat er is veranderd',changes.map(x=>[text(x.change||x.title,'Wijziging'),text(x.status||x.area)]),changes.length?'':'Nog geen wijzigingen.')
 ];
}
function advice(state){
 const items=arr(state?.portal?.advice?.items).slice().sort((a,b)=>n(b.priority)-n(a.priority));
 return [section('Wat wij je zouden adviseren',items.map((x,i)=>[`${i+1}. ${text(x.title||x.advice||x.label,'Advies')}`,`${has(x.value)?euro(x.value):'waarde niet ingevuld'} · prioriteit ${text(x.priority,'—')}`]),items.length?'':'Nog geen adviesitems.')];
}
function roadmapSurface(state){
 const items=arr(state?.portal?.roadmap?.items);
 return [section('Wat je gaat verbeteren',items.map(x=>[text(x.title,'Roadmap-item'),`maand ${text(x.start,'?')} · ${text(x.duration,'?')} mnd · ${done(x)?'afgerond':'open'}`]),items.length?'':'Nog niets gepland. Begin met de grootste rem.')];
}
function dueDiligence(state){
 const items=arr(state?.portal?.dueDiligence?.findings);
 return [section('Due diligence & exit',items.map(x=>[text(x.area,'Onderdeel'),`${text(x.finding,'Geen bevinding')} · ${x.redFlag===true?'red flag':text(x.materiality,'materialiteit onbekend')}`]),items.length?'':'Nog geen due-diligencebevindingen.')];
}

export function buildLegacyPageSurfaces(pageId,state={}){
 if(pageId==='data-ai')return dataAi(state);
 if(pageId==='ai-scan')return aiScan(state);
 if(pageId==='businesscase')return businessCaseSurface(state);
 if(pageId==='mensen')return peopleSurface(state);
 if(pageId==='branche-markt')return marketSurface(state);
 if(pageId==='strategie-naar-maandagochtend')return strategySurface(state);
 if(pageId==='waarde-financiering')return valueSurface(state);
 if(pageId==='onderzoek')return research(state);
 if(pageId==='compliance-governance')return compliance(state);
 if(pageId==='cijfers-maatstaven')return cijfers(state);
 if(pageId==='eindconclusie')return conclusion(state);
 if(pageId==='actueel-houden')return freshness(state);
 if(pageId==='advies')return advice(state);
 if(pageId==='roadmap')return roadmapSurface(state);
 if(pageId==='due-diligence')return dueDiligence(state);
 return [];
}

export function legacyPageSurfaceHeadings(pageId,state={}){return buildLegacyPageSurfaces(pageId,state).map(x=>x.title)}
