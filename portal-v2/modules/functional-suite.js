import { fieldMarkup, bindFields, normalizeFieldValue } from '../form-primitives.js';
import { calculateCompletion } from '../completion.js';
import { mountWorkspace } from '../workspace-shell.js';
import { profileOverviewMetrics, PROFILE_DIMENSIONS } from './company-input.js';

const f=(id,legacyFieldId,label,type,path,extra={})=>Object.freeze({id,legacyFieldId,label,type,path,required:true,...extra});
const repeat=(id,legacyFieldId,label,path,columns)=>Object.freeze({id,legacyFieldId,label,type:'repeatable',path,required:false,columns:Object.freeze(columns)});
const col=(id,label,type='text',extra={})=>Object.freeze({id,label,type,...extra});
const policyNames=['Informatiebeveiligingsbeleid','Toegangsbeleid en rechten','Incident-responseplan','Back-up en herstel','Verwerkingsregister en bewaartermijnen','Verwerkersovereenkomsten','AI-gebruiksbeleid','Datadefinities en eigenaren','Rapportagekalender','Leveranciers- en ketenafspraken','Duurzaamheidsgegevens','Uitwijk en continuïteit'];
const esgNames=['Energie','CO₂','Water','Afval','Circulariteit','Medewerkers','Veiligheid','Diversiteit','Keten','Ethiek','Governance'];
const aiCapabilities=['Generatieve AI','Document intelligence','Voorspellen','Procesautomatisering','Kennisassistent','Beslisondersteuning','Computer vision','Agentic workflows'];
const canvasNames=[['bmc','Business Model Canvas'],['vpc2','Waardepropositie'],['lean','Lean Canvas'],['merk','Merkcanvas'],['content','Contentcanvas'],['sales2','Salescanvas']];

const DEFINITIONS=Object.freeze({
 'data-ai':{slice:'portal.dataAi',fields:[
   f('maturity','dataAiMaturity','Data & AI volwassenheid','range','portal.dataAi.maturity',{min:1,max:5}),
   f('phase','implementationPhase','Implementatiefase','select','portal.dataAi.phase',{options:['Oriëntatie','Fundament','Pilot','Opschalen','Borgen']}),
   f('changeReadiness','changeReadiness','Veranderbereidheid','range','portal.dataAi.changeReadiness',{min:1,max:5}),
   f('costBenefit','costBenefitRatio','Baten/kosten-ratio','number','portal.dataAi.costBenefit',{min:0,step:.1}),
   f('governance','governanceReadiness','Governance readiness','range','portal.dataAi.governance',{min:1,max:5})],
   models:['data-and-ai readiness','five implementation phases','change/adoption curve','TEI costs-benefits','CMMI maturity','Greiner growth phases','governance agreements'],actions:[['Open beleid','compliance-governance'],['Open businesscase','businesscase']]},
 'ai-scan':{slice:'portal.aiScan',fields:[
   f('hourlyRate','asTarief','Uurtarief (€)','currency','portal.aiScan.hourlyRate',{min:0}),
   repeat('tasks','asRijen:*','AI-kansen per taak','portal.aiScan.tasks',[col('task','Taak'),col('owner','Eigenaar'),col('hoursPerWeek','Uren/week','number',{min:0}),col('repetition','Herhaling','select',{options:['Dagelijks','Wekelijks','Maandelijks','Incidenteel']}),col('dataReadiness','Data readiness','range',{min:1,max:5}),col('errorRisk','Foutrisico','range',{min:1,max:5})])],
   models:['AI opportunity matrix','per-task benefit/timing','benchmark checkpoint','priority order'],actions:[['Naar Data & AI','data-ai'],['Businesscase','businesscase']]},
 businesscase:{slice:'portal.businessCase',fields:[f('target','bDoel','Doelniveau','range','portal.businessCase.target',{min:2,max:5,defaultValue:4}),f('delay','bUitstel','Uitstel (maanden)','number','portal.businessCase.delay',{min:0,max:18,step:3,defaultValue:12}),f('investment','bInvest','Investering (€)','currency','portal.businessCase.investment',{min:1000,step:1000,defaultValue:12000})],models:['cumulative net result','adoption curve'],actions:[['Naar roadmap','roadmap'],['Cijfers','cijfers-maatstaven']]},
 'cijfers-maatstaven':{slice:'portal.metrics',fields:[
   f('revenue','cOmzet','Omzet (€ x 1.000)','currency','portal.metrics.revenue',{min:0}),f('grossMargin','cBrutomarge','Brutomarge (%)','percentage','portal.metrics.grossMargin',{min:0,max:100}),f('ebitda','cEbitda','EBITDA (€ x 1.000)','currency','portal.metrics.ebitda'),f('wages','cLoon','Loonkosten (€ x 1.000)','currency','portal.metrics.wages',{min:0}),f('customers','cKlanten','Aantal klanten','number','portal.metrics.customers',{min:0}),f('largestCustomer','cGrootste','Grootste klant (%)','percentage','portal.metrics.largestCustomer',{min:0,max:100}),f('marketing','cMarketing','Marketing (€ x 1.000)','currency','portal.metrics.marketing',{min:0}),f('newCustomers','cNieuw','Nieuwe klanten','number','portal.metrics.newCustomers',{min:0}),f('dso','cDso','DSO (dagen)','number','portal.metrics.dso',{min:0}),f('it','cIt','IT-kosten (€ x 1.000)','currency','portal.metrics.it',{min:0}),f('nps','kNps','NPS','number','portal.metrics.nps',{min:-100,max:100}),f('satisfaction','kTevreden','Tevredenheid (%)','percentage','portal.metrics.satisfaction',{min:0,max:100}),f('repeat','kHerhaal','Herhaalaankopen (%)','percentage','portal.metrics.repeat',{min:0,max:100}),f('complaints','kKlacht','Klachten','number','portal.metrics.complaints',{min:0}),f('measurementDate','mtDatum','Meetdatum','date','portal.metrics.measurement.date'),f('measurementType','mtSoort','Meting','text','portal.metrics.measurement.type'),f('measurementValue','mtWaarde','Waarde','number','portal.metrics.measurement.value'),f('measurementNote','mtNotitie','Notitie','textarea','portal.metrics.measurement.note')],models:['KPI benchmark comparison','trusted-advisor ladder','productivity','measurements over time'],actions:[['Waarde & financiering','waarde-financiering'],['Branche','branche-markt']]},
 'waarde-financiering':{slice:'portal.valueFinance',fields:[f('debt','wSchuld','Schuld (€ x 1.000)','currency','portal.valueFinance.debt'),f('cash','wCash','Cash (€ x 1.000)','currency','portal.valueFinance.cash'),f('equity','wEV','Eigen vermogen (€ x 1.000)','currency','portal.valueFinance.equity'),f('balance','wBalans','Balanstotaal (€ x 1.000)','currency','portal.valueFinance.balance'),f('fixed','wVast','Vaste kosten (€ x 1.000)','currency','portal.valueFinance.fixed'),f('interest','wRente','Rentelasten (€ x 1.000)','currency','portal.valueFinance.interest'),f('multiple','wMultiple','EBITDA multiple','number','portal.valueFinance.multiple',{min:0}),f('wacc','wWacc','WACC (%)','percentage','portal.valueFinance.wacc',{min:0,max:100})],models:['EBITDA multiple','DCF perpetuity','DuPont','Altman Z','interest coverage','DSCR','break-even','sensitivity'],actions:[['Due diligence','due-diligence'],['Businesscase','businesscase']]},
 mensen:{slice:'portal.people',fields:[f('absence','mVerzuim','Verzuim (%)','percentage','portal.people.absence',{min:0,max:100}),f('turnover','mVerloop','Verloop (%)','percentage','portal.people.turnover',{min:0,max:100}),f('enps','mEnps','eNPS','number','portal.people.enps',{min:-100,max:100}),f('mto','mMto','MTO actualiteit','select','portal.people.mto',{options:['Geen meting','Verouderd','Actueel']}),f('vacancies','mVac','Openstaande vacatures','number','portal.people.vacancies',{min:0}),repeat('roles','peopleRoles:*','Rollen & kennisrisico','portal.people.roles',[col('name','Naam'),col('role','Rol'),col('criticalKnowledge','Kritieke kennis'),col('backup','Back-up')])],models:['people-vs-industry'],actions:[['Branche','branche-markt'],['Actueel houden','actueel-houden']]},
 'branche-markt':{slice:'portal.market',fields:[f('industry','bKeuze','Branche','text','portal.market.industry'),f('revenue','bOmzet','Omzet (€ x 1.000)','currency','portal.market.revenue',{min:0}),repeat('benchmarks','marketBenchmarks:*','Benchmarks','portal.market.benchmarks',[col('metric','Maatstaf'),col('company','Eigen waarde','number'),col('benchmark','Benchmark','number'),col('source','Bron')])],models:['industry-position','economic context','regulatory context'],actions:[['Onderzoek','onderzoek'],['Cijfers','cijfers-maatstaven']]},
 onderzoek:{slice:'portal.research',fields:[f('filter','ondFilter:*','Onderzoeksfilter','text','portal.research.filter',{required:false}),repeat('hypotheses','research:*','Hypotheses & bewijs','portal.research.hypotheses',[col('hypothesis','Hypothese'),col('evidence','Bewijs'),col('source','Bron'),col('confidence','Zekerheid','range',{min:1,max:5}),col('reviewDate','Reviewdatum','date')])],models:['four-quadrant maturity/cost','cost-of-doing-nothing ladder','research evidence cards'],actions:[['Branche','branche-markt'],['Strategie','strategie-naar-maandagochtend']]},
 'compliance-governance':{slice:'portal.compliance',fields:[...policyNames.map((label,index)=>f(`policy${index}`,`beleidLijst:${index}`,label,'select',`portal.compliance.policies.${index}`,{options:['ontbreekt','concept','vastgesteld','geoefend']})),...esgNames.map((label,index)=>f(`esg${index}`,`esgVelden:${index}`,label,'range',`portal.compliance.esg.${index}`,{min:1,max:5}))],models:['technology state','governance maturity','CSRD readiness','policy-document state','deadlines/fines','incident plan'],actions:[['AI-capabilities','ai-capabilities'],['Gegevens invullen','gegevens-invullen']]},
 'ai-capabilities':{slice:'portal.aiCapabilities',fields:aiCapabilities.map((label,index)=>f(`cap${index}`,`aicap:${index}`,label,'range',`portal.aiCapabilities.${index}`,{min:1,max:5})),models:['AI capability maturity'],actions:[['Data & AI','data-ai'],['Strategy DNA','strategy-dna']]},
 'strategie-naar-maandagochtend':{slice:'portal.strategy',fields:[f('horizon','kHorizon','Horizon','select','portal.strategy.horizon',{options:['Nu','3 maanden','6 maanden','12 maanden','Later']}),f('minimumValue','kMin','Minimumwaarde (€)','currency','portal.strategy.minimumValue',{min:0}),repeat('findings','strategyFindings:*','Strategische bevindingen','portal.strategy.findings',[col('finding','Bevinding'),col('model','Model'),col('value','Waarde (€)','currency'),col('horizon','Horizon'),col('owner','Eigenaar')])],models:['all-model findings matrix','strategy conclusion','filtered recommendation map'],actions:[['Canvassen','canvassen'],['Eindconclusie','eindconclusie'],['Roadmap','roadmap']]},
 canvassen:{slice:'portal.canvases',fields:canvasNames.flatMap(([key,label])=>[f(`${key}question`,key,`${label} · kernvraag`,'textarea',`portal.canvases.${key}.answer`,{required:false}),f(`${key}owner`,`${key}:owner`,`${label} · eigenaar`,'owner',`portal.canvases.${key}.owner`,{required:false})]),models:['Business Model Canvas','Waardepropositie','Lean Canvas','Merkcanvas','Contentcanvas','Salescanvas','canvas conclusion'],actions:[['Strategie','strategie-naar-maandagochtend'],['Eindconclusie','eindconclusie']]},
 eindconclusie:{slice:'portal.finalConclusion',fields:[f('managementConclusion','finalConclusion','Bestuurlijke conclusie','textarea','portal.finalConclusion.text',{required:false}),f('decision','finalDecision','Besluit','textarea','portal.finalConclusion.decision',{required:false}),f('owner','finalOwner','Eigenaar','owner','portal.finalConclusion.owner',{required:false})],models:['source consensus','value-vs-duration matrix','five recommendations','calculation explanation'],actions:[['Advies','advies'],['Roadmap','roadmap']]},
 'due-diligence':{slice:'portal.dueDiligence',fields:[repeat('findings','ddInhoud:*','Due-diligence dossier','portal.dueDiligence.findings',[col('area','Onderdeel'),col('finding','Bevinding'),col('evidence','Bewijs'),col('materiality','Materialiteit','range',{min:1,max:5}),col('redFlag','Red flag','triState'),col('owner','Eigenaar')])],models:['due-diligence dossier','exit-readiness'],actions:[['Waarde','waarde-financiering'],['Roadmap','roadmap']]},
 'actueel-houden':{slice:'portal.freshness',fields:[f('what','bsWat','Wat wijzigde','text','portal.freshness.what'),f('why','bsWaarom','Waarom','textarea','portal.freshness.why'),f('date','bsDatum','Datum','date','portal.freshness.date'),f('by','bsDoor','Door wie','owner','portal.freshness.by'),f('affects','bsRaakt','Raakt','text','portal.freshness.affects'),f('document','dcNaam','Document','text','portal.freshness.document'),f('documentOwner','dcBij','Document-eigenaar','owner','portal.freshness.documentOwner'),f('reviewDate','dcDatum','Reviewdatum','date','portal.freshness.reviewDate')],models:['ownership/freshness table','decision log','document register','change-to-tasks','change log'],actions:[['Wijzigingen','wijzigingen'],['Roadmap','roadmap']]},
 wijzigingen:{slice:'portal.changes',fields:[repeat('changes','wijzigingen:*','Wijzigingen','portal.changes.items',[col('change','Wijziging'),col('area','Onderdeel'),col('impact','Impact','range',{min:1,max:5}),col('owner','Eigenaar'),col('status','Opvolging','select',{options:['Open','Bezig','Geborgd']})])],models:['change history','impact by department'],actions:[['Actueel houden','actueel-houden'],['Roadmap','roadmap']]},
 advies:{slice:'portal.advice',fields:[f('modelFilter','modelKeuze:*','Modelfilter','text','portal.advice.modelFilter',{required:false}),repeat('items','advice:*','Adviezen','portal.advice.items',[col('advice','Advies'),col('priority','Prioriteit','range',{min:1,max:5}),col('value','Waarde (€)','currency'),col('duration','Doorlooptijd (weken)','number'),col('owner','Eigenaar'),col('rationale','Onderbouwing')])],models:['prioritized advice list','model contribution counter','calculation explanation'],actions:[['Offerte','offerte'],['Roadmap','roadmap']]},
 offerte:{slice:'portal.offer',fields:[f('package','offerte:pakket','Pakket','select','portal.offer.package',{options:['Start','Scale','Control','Enterprise']}),f('scope','offerte:scope','Scope','textarea','portal.offer.scope'),f('sprints','offerte:sprints','Sprints','number','portal.offer.sprints',{min:1,max:24}),f('weeklyPrice','offerte:week','Prijs per week (€)','currency','portal.offer.weeklyPrice',{min:0}),f('startDate','offerte:start','Gewenste start','date','portal.offer.startDate')],models:['package/sprint offer','pricing','delivery story','acceptance/start flow'],actions:[['Advies','advies'],['Roadmap','roadmap']]},
 roadmap:{slice:'portal.roadmap',fields:[f('title','nTitel','Titel','text','portal.roadmap.draft.title'),f('dimension','nDim','Onderdeel','text','portal.roadmap.draft.dimension'),f('start','nStart','Startmaand','number','portal.roadmap.draft.start',{min:1,max:12}),f('duration','nDuur','Duur (maanden)','number','portal.roadmap.draft.duration',{min:1,max:12}),f('owner','roadmapOwner','Eigenaar','owner','portal.roadmap.draft.owner',{required:false}),f('progress','roadmapProgress','Voortgang (%)','percentage','portal.roadmap.draft.progress',{min:0,max:100}),repeat('items','roadmapItems:*','Roadmap-items','portal.roadmap.items',[col('title','Titel'),col('dimension','Onderdeel'),col('start','Start','number',{min:1,max:12}),col('duration','Duur','number',{min:1,max:12}),col('owner','Eigenaar'),col('progress','Voortgang (%)','percentage',{min:0,max:100}),col('done','Klaar','triState')])],models:['12-month gantt','roadmap progress'],actions:[['Advies','advies'],['Strategie','strategie-naar-maandagochtend']]}
});

const valueAt=(state,path)=>String(path||'').split('.').filter(Boolean).reduce((value,key)=>value==null?undefined:value[key],state);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const euro=value=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(value)||0);
const number=(value,digits=1)=>new Intl.NumberFormat('nl-NL',{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(Number(value)||0);
const percent=value=>`${number(value,1)}%`;

export function functionalDefinition(pageId){return DEFINITIONS[pageId]||null}
export function functionalSchema(pageId){return [...(DEFINITIONS[pageId]?.fields||[])]}
export function listFunctionalSuitePages(){return Object.keys(DEFINITIONS)}

const BUSINESSCASE_FACTOR=Object.freeze([0,1,.78,.5,.22,.06]);
const safeBusinessLevel=value=>Math.max(1,Math.min(5,Math.round(Number(value)||2)));
const hasValue=value=>value!==undefined&&value!==null&&value!=='';

export function businessCaseMetrics(state={}){
 const profile=state?.portal?.profile||{},bc=state?.portal?.businessCase||{};
 const employees=Math.max(1,Number(profile.employees)||24),hourlyCost=Math.max(0,Number(profile.hourlyCost)||52);
 const target=Math.max(2,Math.min(5,Math.round(Number(bc.target)||4)));
 const delayMonths=Math.max(0,Math.min(18,hasValue(bc.delay)?Number(bc.delay)||0:12));
 const investment=hasValue(bc.investment)?Number(bc.investment)||12000:12000;
 let currentAnnualCost=0,targetAnnualCost=0;
 for(const item of PROFILE_DIMENSIONS){
  const currentLevel=safeBusinessLevel(profile.maturity?.[item.id]);
  const targetLevel=Math.max(currentLevel,target);
  const annualBase=item.weeklyHours*(employees/24)*46*hourlyCost;
  currentAnnualCost+=annualBase*BUSINESSCASE_FACTOR[currentLevel];
  targetAnnualCost+=annualBase*BUSINESSCASE_FACTOR[targetLevel];
 }
 const annualBenefit=Math.max(currentAnnualCost-targetAnnualCost,0),monthlyBenefit=annualBenefit/12;
 const delayCost=monthlyBenefit*delayMonths,paybackMonths=monthlyBenefit>0?investment/monthlyBenefit:99;
 return Object.freeze({currentAnnualCost,targetAnnualCost,annualBenefit,delayCost,investment,paybackMonths,netThreeYear:annualBenefit*3-investment,target,delayMonths});
}

function genericReadiness(definition,state){
 const fields=definition.fields.filter(field=>field.type!=='repeatable');
 if(!fields.length)return 0;
 const values=fields.map(field=>valueAt(state,field.path)).filter(value=>value!==undefined&&value!==null&&value!=='');
 return Math.round(values.length/fields.length*100);
}

export function computeFunctionalAnalysis(pageId,state={}){
 const d=DEFINITIONS[pageId];if(!d)return [];
 if(pageId==='businesscase'){
  const result=businessCaseMetrics(state);
  return [['Jaarpotentieel',euro(result.annualBenefit)],['Kosten van uitstel',euro(result.delayCost)],['Investering',euro(result.investment)],['Terugverdientijd',`${number(result.paybackMonths,1)} mnd`],['Netto na 3 jaar',euro(result.netThreeYear)]];
 }
 if(pageId==='cijfers-maatstaven'){
  const m=state?.portal?.metrics||{};const revenue=Number(m.revenue)||0;const ebitda=Number(m.ebitda)||0;const wages=Number(m.wages)||0;const marketing=Number(m.marketing)||0;const it=Number(m.it)||0;
  return [['EBITDA-marge',percent(revenue?ebitda/revenue*100:0)],['Loonquote',percent(revenue?wages/revenue*100:0)],['Marketingratio',percent(revenue?marketing/revenue*100:0)],['IT-ratio',percent(revenue?it/revenue*100:0)]];
 }
 if(pageId==='waarde-financiering'){
  const m=state?.portal?.metrics||{},v=state?.portal?.valueFinance||{};const ebitda=Number(m.ebitda)||0,multiple=Number(v.multiple)||0,debt=Number(v.debt)||0,cash=Number(v.cash)||0,balance=Number(v.balance)||0,equity=Number(v.equity)||0,interest=Number(v.interest)||0;
  const enterprise=ebitda*multiple;return [['Enterprise value',euro(enterprise*1000)],['Equity value',euro((enterprise-debt+cash)*1000)],['Solvabiliteit',percent(balance?equity/balance*100:0)],['Rentedekking',number(interest?ebitda/interest:0,1)+'×']];
 }
 if(pageId==='mensen'){
  const p=state?.portal?.people||{};return [['Verzuim',percent(p.absence)],['Verloop',percent(p.turnover)],['eNPS',number(p.enps,0)],['Vacatures',number(p.vacancies,0)]];
 }
 if(pageId==='ai-scan'){
  const scan=state?.portal?.aiScan||{};const rate=Number(scan.hourlyRate)||0;const tasks=Array.isArray(scan.tasks)?scan.tasks:[];const annual=tasks.reduce((sum,item)=>sum+(Number(item.hoursPerWeek)||0)*46*rate,0);const readiness=tasks.length?tasks.reduce((sum,item)=>sum+(Number(item.dataReadiness)||1),0)/tasks.length:0;return [['Taken',String(tasks.length)],['Jaarlijkse taakkosten',euro(annual)],['Data readiness',`${number(readiness,1)}/5`],['Prioriteit','Waarde × haalbaarheid × risico']];
 }
 if(pageId==='offerte'){
  const o=state?.portal?.offer||{};const weeks=(Number(o.sprints)||0)*2;const total=weeks*(Number(o.weeklyPrice)||0);return [['Pakket',o.package||'—'],['Doorlooptijd',`${weeks} weken`],['Totaal',euro(total)],['Start',o.startDate||'Nog te bepalen']];
 }
 if(pageId==='roadmap'){
  const items=state?.portal?.roadmap?.items||[];const done=items.filter(item=>item.done===true).length;const progress=items.length?items.reduce((sum,item)=>sum+(Number(item.progress)||0),0)/items.length:0;return [['Items',String(items.length)],['Afgerond',String(done)],['Gem. voortgang',percent(progress)],['Horizon','12 maanden']];
 }
 if(pageId==='due-diligence'){
  const items=state?.portal?.dueDiligence?.findings||[];const red=items.filter(item=>item.redFlag===true).length;const material=items.filter(item=>(Number(item.materiality)||0)>=4).length;return [['Bevindingen',String(items.length)],['Red flags',String(red)],['Materieel',String(material)],['Readiness',items.length?'Dossier actief':'Nog leeg']];
 }
 if(pageId==='eindconclusie'){
  const p=profileOverviewMetrics(state);const advice=state?.portal?.advice?.items||[];return [['Volwassenheid',`${number(p.averageMaturity,1)}/5`],['Capaciteit',`${number(p.fteLost,1)} fte`],['Adviezen',String(advice.length)],['Semantiek','ruimte die je terugkrijgt, geen cash']];
 }
 return [['Volledigheid',`${genericReadiness(d,state)}%`],['Modellen',String(d.models?.length||0)],['Opslag','Server-bevestigde Portal V2-state'],['Status','Werkbaar en heropenbaar']];
}

function repeatableMarkup(field,items=[]){
 const rows=Array.isArray(items)?items:[];
 const headers=field.columns.map(column=>`<span>${esc(column.label)}</span>`).join('');
 const rowMarkup=(item,index)=>`<div class="v2repeatrow" data-repeat-row="${index}">${field.columns.map(column=>{const val=item?.[column.id]??'';if(column.type==='select')return `<select data-repeat-col="${esc(column.id)}">${(column.options||[]).map(option=>`<option${String(option)===String(val)?' selected':''}>${esc(option)}</option>`).join('')}</select>`;if(column.type==='triState')return `<select data-repeat-col="${esc(column.id)}"><option value="">—</option><option value="true"${val===true?' selected':''}>Ja</option><option value="false"${val===false?' selected':''}>Nee</option></select>`;const type=['number','currency','percentage','range'].includes(column.type)?'number':column.type==='date'?'date':'text';return `<input type="${type}" data-repeat-col="${esc(column.id)}" value="${esc(val)}"${column.min!=null?` min="${column.min}"`:''}${column.max!=null?` max="${column.max}"`:''}>`;}).join('')}<button type="button" data-repeat-remove aria-label="Rij verwijderen">×</button></div>`;
 return `<section class="v2repeat" data-repeatable-path="${esc(field.path)}"><div class="v2repeathead"><div><small>${esc(field.legacyFieldId)}</small><strong>${esc(field.label)}</strong></div><button type="button" data-repeat-add>+ Toevoegen</button></div><div class="v2repeatcols">${headers}<span></span></div><div data-repeat-list>${rows.map(rowMarkup).join('')}</div></section>`;
}

function columnValue(column,node){const raw=node.value;if(column.type==='triState')return raw==='true'?true:raw==='false'?false:null;return normalizeFieldValue({type:column.type,min:column.min,max:column.max},raw)}

function bindRepeatables(root,definition,domainState,onDirty){
 const redraw=(field)=>{
  const section=root.querySelector(`[data-repeatable-path="${CSS.escape(field.path)}"]`);if(!section)return;
  const items=valueAt(domainState.get(),field.path)||[];
  const wrapper=document.createElement('div');wrapper.innerHTML=repeatableMarkup(field,items);section.replaceWith(wrapper.firstElementChild);bindOne(field);
 };
 const bindOne=field=>{
  const section=root.querySelector(`[data-repeatable-path="${CSS.escape(field.path)}"]`);if(!section)return;
  section.querySelector('[data-repeat-add]')?.addEventListener('click',()=>{const items=[...(valueAt(domainState.get(),field.path)||[])];items.push(Object.fromEntries(field.columns.map(column=>[column.id,''])));domainState.set(field.path,items);onDirty();redraw(field);});
  section.querySelectorAll('[data-repeat-row]').forEach(row=>{
   const index=Number(row.dataset.repeatRow);
   row.querySelector('[data-repeat-remove]')?.addEventListener('click',()=>{const items=[...(valueAt(domainState.get(),field.path)||[])];items.splice(index,1);domainState.set(field.path,items);onDirty();redraw(field);});
   field.columns.forEach(column=>row.querySelector(`[data-repeat-col="${CSS.escape(column.id)}"]`)?.addEventListener('change',event=>{const items=[...(valueAt(domainState.get(),field.path)||[])];items[index]={...(items[index]||{}),[column.id]:columnValue(column,event.currentTarget)};domainState.set(field.path,items);onDirty();}));
  });
 };
 definition.fields.filter(field=>field.type==='repeatable').forEach(bindOne);
}

function renderForm(content,definition,domainState,onSaveStatus){
 const state=domainState?.get?.()||{};const normal=definition.fields.filter(field=>field.type!=='repeatable');const repeating=definition.fields.filter(field=>field.type==='repeatable');
 content.innerHTML=`<div class="v2completion"></div>${normal.length?`<div class="v2formgrid">${normal.map(field=>fieldMarkup(field,valueAt(state,field.path)??field.defaultValue??(field.type==='range'?1:''))).join('')}</div>`:''}${repeating.map(field=>repeatableMarkup(field,valueAt(state,field.path))).join('')}<div class="v2formactions"><button type="button" class="pvprimary" data-functional-save>Opslaan</button><span data-functional-save-message>Wijzigingen worden tenant-scoped opgeslagen.</span></div>`;
 const updateCompletion=()=>{const c=calculateCompletion(definition.fields,domainState?.get?.()||{});const box=content.querySelector('.v2completion');if(box)box.innerHTML=`<strong>${c.percentage}% compleet</strong><span>${c.complete} van ${c.total} verplichte onderdelen ingevuld</span>`;};updateCompletion();
 const dirty=()=>{onSaveStatus?.(domainState?.status?.()||'dirty');updateCompletion();};
 bindFields(content,normal,{onChange:(field,value)=>{domainState?.set?.(field.path,value);dirty();}});if(domainState)bindRepeatables(content,definition,domainState,dirty);
 content.querySelector('[data-functional-save]')?.addEventListener('click',async()=>{const msg=content.querySelector('[data-functional-save-message]');try{onSaveStatus?.('saving');if(msg)msg.textContent='Opslaan…';await domainState?.flush?.();onSaveStatus?.('saved');if(msg)msg.textContent='Opgeslagen';}catch{onSaveStatus?.('error');if(msg)msg.textContent='Opslaan mislukt — invoer blijft lokaal in deze sessie staan.';}});
}

function renderAnalysis(content,pageId,domainState){const cards=computeFunctionalAnalysis(pageId,domainState?.get?.()||{});content.innerHTML=`<div class="v2profilemetrics">${cards.map(([label,value])=>`<article><small>${esc(label)}</small><strong>${esc(value)}</strong></article>`).join('')}</div>`;}
function renderActions(content,definition,openPage){content.innerHTML=`<div class="pvactions">${(definition.actions||[]).map(([label,pageId],index)=>`<button type="button" data-functional-page="${esc(pageId)}" class="${index===0?'primary':''}"><span>${esc(label)}</span><i>→</i></button>`).join('')}</div>`;content.querySelectorAll('[data-functional-page]').forEach(button=>button.addEventListener('click',()=>openPage?.(button.dataset.functionalPage)));}
function renderEvidence(content,definition){content.innerHTML=`<div class="v2reviewlist"><article><div><small>State</small><b>${esc(definition.slice)}</b></div><strong>server-confirmed</strong></article>${(definition.models||[]).map(model=>`<article><div><small>Model</small><b>${esc(model)}</b></div><strong>native V2</strong></article>`).join('')}${definition.fields.map(field=>`<article><div><small>${esc(field.legacyFieldId)}</small><b>${esc(field.label)}</b></div><strong>${field.type==='repeatable'?'herhaalbaar':'bewerkbaar'}</strong></article>`).join('')}</div>`;}

export function mountFunctionalWorkspace(root,{pageId,contract,view,domainState,openPage}={}){
 const definition=DEFINITIONS[pageId];if(!definition)return null;let workspace;
 const renderTab=(tab,content)=>{if(tab==='analyse'){renderAnalysis(content,pageId,domainState);return;}if(tab==='acties'){renderActions(content,definition,openPage);return;}if(tab==='bewijs'){renderEvidence(content,definition);return;}if(!domainState){content.innerHTML='<section class="v2tabempty"><h4>Beveiligde context laden</h4><p>Deze werkruimte wordt bewerkbaar zodra de klantcontext is geladen.</p></section>';return;}renderForm(content,definition,domainState,status=>workspace?.setSaveStatus(status));};
 workspace=mountWorkspace(root,contract,{title:view?.title||pageId,description:view?.description||'',saveStatus:domainState?.status?.()||'idle',render:content=>renderTab('invullen',content),onTabChange:(tab,content)=>renderTab(tab,content)});
 workspace.shell.dataset.functionalWorkspace=pageId;
 return workspace;
}
