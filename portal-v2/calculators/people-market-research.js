import { profileOverviewMetrics } from '../modules/company-input.js';

const num=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const present=value=>value!==undefined&&value!==null&&value!=='';
const stable=value=>Number.isFinite(value)?Math.round(value*1e9)/1e9:value;
const norm=value=>String(value??'').toLocaleLowerCase('nl-NL').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();

function benchmarkRows(state){return Array.isArray(state?.portal?.market?.benchmarks)?state.portal.market.benchmarks:[]}
function findBenchmark(state,aliases=[]){
  const keys=aliases.map(norm);
  const row=benchmarkRows(state).find(item=>{
    const metric=norm(item?.metric);
    return keys.some(key=>metric===key||metric.includes(key)||key.includes(metric));
  });
  if(!row||!present(row.benchmark))return null;
  return Object.freeze({
    metric:String(row.metric||aliases[0]||''),
    company:present(row.company)?num(row.company):null,
    benchmark:num(row.benchmark),
    source:String(row.source||'').trim()||null
  });
}
function gap(value,row){return present(value)&&row?stable(num(value)-row.benchmark):null}
function mtoMaturity(value){
  if(typeof value==='number')return Math.max(0,Math.min(3,Math.round(value)));
  const key=norm(value);
  if(!key||key.includes('geen')||key.includes('nooit'))return 0;
  if(key.includes('verouder')||key.includes('langer dan'))return 1;
  if(key.includes('binnen 2')||key.includes('binnen twee'))return 2;
  if(key.includes('actueel')||key.includes('jaarlijks'))return 3;
  return 0;
}
function evidenceCards(state){
  const list=Array.isArray(state?.portal?.research?.hypotheses)?state.portal.research.hypotheses:[];
  return Object.freeze(list.map(item=>Object.freeze({
    hypothesis:String(item?.hypothesis||''),evidence:String(item?.evidence||''),source:String(item?.source||''),
    confidence:present(item?.confidence)?num(item.confidence):null,reviewDate:String(item?.reviewDate||'')
  })));
}

export function peopleMarketResearchMetrics(state={}){
  const people=state?.portal?.people||{};
  const profile=state?.portal?.profile||{};
  const market=state?.portal?.market||{};
  const absenceRow=findBenchmark(state,['verzuim','ziekteverzuim']);
  const turnoverRow=findBenchmark(state,['verloop','personeelsverloop']);
  const enpsRow=findBenchmark(state,['enps']);
  const productivityRow=findBenchmark(state,['toegevoegde waarde per fte','productiviteit','toegevoegde waarde']);

  const absence=present(people.absence)?num(people.absence):null;
  const turnover=present(people.turnover)?num(people.turnover):null;
  const enps=present(people.enps)?num(people.enps):null;
  const employees=Math.max(0,num(profile.employees));
  const hourlyCost=Math.max(0,num(profile.hourlyCost));
  const vacancies=Math.max(0,num(people.vacancies));
  const annualReplacements=turnover===null?0:employees*turnover/100;
  const onboardingFte=annualReplacements*.25;
  const onboardingCapacityValue=onboardingFte*1600*hourlyCost;

  const benchmarkDeltas=benchmarkRows(state).filter(row=>present(row?.company)&&present(row?.benchmark)).map(row=>Object.freeze({
    metric:String(row.metric||''),company:num(row.company),benchmark:num(row.benchmark),delta:stable(num(row.company)-num(row.benchmark)),source:String(row.source||'').trim()||null
  }));
  const profileMetrics=profileOverviewMetrics(state);
  const ownProductivity=productivityRow?.company ?? (employees&&present(market.revenue)?num(market.revenue)*1000/employees:null);
  const productivityGap=productivityRow&&ownProductivity!==null?stable(ownProductivity-productivityRow.benchmark):null;

  return Object.freeze({
    people:Object.freeze({
      absence,turnover,enps,vacancies,
      absenceGap:gap(absence,absenceRow),turnoverGap:gap(turnover,turnoverRow),enpsGap:gap(enps,enpsRow),
      absenceHigh:absence!==null&&absenceRow?absence>absenceRow.benchmark+1:false,
      turnoverHigh:turnover!==null&&turnoverRow?turnover>turnoverRow.benchmark+4:false,
      enpsNegative:enps!==null?enps<0:false,
      mtoMaturity:mtoMaturity(people.mto),annualReplacements:stable(annualReplacements),onboardingFte:stable(onboardingFte),
      onboardingCapacityValue:stable(onboardingCapacityValue),vacancyPressure:stable(vacancies+annualReplacements),
      benchmarks:Object.freeze({absence:absenceRow,turnover:turnoverRow,enps:enpsRow})
    }),
    market:Object.freeze({
      industry:String(market.industry||''),growthContext:present(market.growth)?num(market.growth):null,
      benchmarkDeltas:Object.freeze(benchmarkDeltas),ownProductivity:ownProductivity===null?null:stable(ownProductivity),
      productivityBenchmark:productivityRow?.benchmark??null,productivityGap,
      sources:Object.freeze([...new Set(benchmarkRows(state).map(row=>String(row?.source||'').trim()).filter(Boolean))])
    }),
    research:Object.freeze({
      maturityVsCost:Object.freeze({averageMaturity:stable(profileMetrics.averageMaturity),annualManualHours:stable(profileMetrics.annualManualHours),annualManualCost:stable(profileMetrics.annualManualCost)}),
      costOfDoingNothing:stable(profileMetrics.annualManualCost),
      evidenceCards:evidenceCards(state)
    })
  });
}
