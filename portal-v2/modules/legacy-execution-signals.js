import { PROFILE_DIMENSIONS } from './company-input.js';

const FACTOR=Object.freeze([0,1,.78,.5,.22,.06]);
const level=(maturity,id)=>Math.max(1,Math.min(5,Math.round(Number(maturity?.[id])||2)));
const num=value=>Number(value)||0;

export function legacySourceEnabled(source,overrides={}){
  return !(overrides&&overrides[source]===false);
}

function sourceOverrides(state={}){
  return Object.assign({},state?.portal?.advice?.models||{},state?.portal?.strategy?.models||{},state?.portal?.strategy?.execution?.models||{});
}

function benchmark(state={}){
  const market=state?.portal?.market||{};
  return {
    dsoNorm:num(market.dsoNorm)||30,
    absenceNorm:num(market.absenceNorm)||4.5,
    turnoverNorm:num(market.turnoverNorm)||12,
    digitalMaturity:num(market.digitalMaturity)||3,
    growth:Number.isFinite(Number(market.growth))?Number(market.growth):1,
    ebitdaMargin:num(market.ebitdaMargin)||10,
    laborTightness:String(market.laborTightness||''),
  };
}

function complianceFlags(state={}){
  const c=state?.portal?.compliance||{};
  const policies=Array.isArray(c.policies)?c.policies:[];
  const absent=value=>value===undefined||value===null||value===''||value===0||value==='ontbreekt';
  const backupValue=c.backup??policies[3];
  const backupMissing=typeof backupValue==='number'?backupValue<=1:absent(backupValue)||backupValue==='concept';
  return {
    incident: absent(c.incident??policies[2]),
    backup: backupMissing,
    aiPolicy: absent(c.aiPolicy??policies[6]),
    dataDefinitions: absent(c.dataDefinitions??policies[7]),
  };
}

function canvasMissing(state,key){
  const value=state?.portal?.canvases?.[key];
  if(value&&typeof value==='object') return !String(value.answer||'').trim();
  return !String(value||'').trim();
}

export function generateLegacyExecutionSignals(state={}){
  const portal=state?.portal||{};
  const profile=portal.profile||{};
  const maturity=profile.maturity||{};
  const employees=Math.max(1,num(profile.employees)||24);
  const hourlyCost=Math.max(0,num(profile.hourlyCost)||52);
  const metrics=portal.metrics||{};
  const people=portal.people||{};
  const finance=portal.valueFinance||{};
  const b=benchmark(state);
  const disabled=sourceOverrides(state);
  const costs={};
  for(const d of PROFILE_DIMENSIONS) costs[d.id]=d.weeklyHours*FACTOR[level(maturity,d.id)]*(employees/24)*46*hourlyCost;
  const signals=[];
  const add=(source,dimension,when=true)=>{if(when&&dimension&&legacySourceEnabled(source,disabled))signals.push(Object.freeze({source,dimension:String(dimension)}));};
  const ordered=[...PROFILE_DIMENSIONS];
  const weakest=[...ordered].sort((a,z)=>level(maturity,a.id)-level(maturity,z.id))[0];
  const strongest=[...ordered].sort((a,z)=>level(maturity,z.id)-level(maturity,a.id))[0];
  const expensive=[...ordered].sort((a,z)=>(costs[z.id]||0)-(costs[a.id]||0))[0];
  const avg=ordered.reduce((sum,d)=>sum+level(maturity,d.id),0)/ordered.length;
  const hard=(level(maturity,'tech')+level(maturity,'analytics')+level(maturity,'quality'))/3;
  const soft=(level(maturity,'culture')+level(maturity,'mensen'))/2;

  add('Profiel',expensive?.id);
  add('Profiel','mensen',level(maturity,'mensen')<3);
  add('Cijfers','commercie',num(metrics.largestCustomer)>=25);
  add('Cijfers','finance',num(metrics.dso)>b.dsoNorm+8);
  add('Mensen','mensen',num(people.absence)>b.absenceNorm+1);
  add('Mensen','mensen',num(people.turnover)>b.turnoverNorm+4);
  add('Mensen','culture',!people.mto||people.mto==='Geen meting');

  const flags=complianceFlags(state);
  add('Beleid','security',flags.incident);
  add('Beleid','security',flags.backup);
  add('Beleid','tech',flags.aiPolicy);
  add('Beleid','quality',flags.dataDefinitions);
  if(signals.length) add('Branche','finance');
  add('Branche','mensen',b.laborTightness==='zeer krap'&&level(maturity,'mensen')<4);

  const revenue=num(metrics.revenue)*1000;
  const ebitda=num(metrics.ebitda)*1000;
  const balance=num(finance.balance)*1000;
  const equity=num(finance.equity)*1000;
  const interest=num(finance.interest)*1000;
  add('Model solvabiliteit','finance',balance>0&&equity/balance*100<25);
  add('Model EBITDA-marge','finance',revenue>0&&ebitda>0&&ebitda/revenue*100<b.ebitdaMargin-2);
  add('Model EBITDA-multiple','finance',revenue>0);
  add('Model DSCR','finance',interest>0&&(ebitda||revenue*b.ebitdaMargin/100)/interest<1.3);

  add('Mensen','service',metrics.nps===undefined||metrics.nps===null||metrics.nps==='');
  add('Mensen','service',num(metrics.nps)<0&&metrics.nps!==undefined&&metrics.nps!==null&&metrics.nps!=='');
  add('Branche','commercie',canvasMissing(state,'merk'));
  add('Cijfers','finance',canvasMissing(state,'bmc'));

  add('Model 7S','culture',hard-soft>.7);
  add('Model 7S','tech',soft-hard>.7);
  add('Model Theory of Constraints',weakest?.id,level(maturity,weakest?.id)<3);
  add('Model waardeketen','service',level(maturity,'service')<3);
  add('Model vijf krachten','commercie',b.growth<1);
  add('Model BCG','tech',b.growth>1.5&&avg<b.digitalMaturity);
  add('Model Ansoff','commercie',num(metrics.largestCustomer)>0&&num(metrics.largestCustomer)<20&&b.growth<1.5);
  add('Model ADKAR','culture',level(maturity,'culture')<3&&signals.length>4);
  add('Model SWOT',strongest?.id);
  add('Model Balanced Scorecard','service',level(maturity,'service')<3||level(maturity,'commercie')<3);
  add('Model Blue Ocean','commercie');
  add('Model drie horizonten','sturing');

  add('Model Ulrich','mensen',level(maturity,'mensen')<3);
  add('Model SIPOC','operatie',level(maturity,'operatie')<4);
  add('Model RACI','sturing',employees>=16);
  add('Model OCAI','culture',level(maturity,'culture')<3);
  add('Model salestrechter','commercie',level(maturity,'commercie')<4);
  add('Model AARRR','commercie',num(metrics.marketing)>0&&!num(metrics.newCustomers));
  add('Model Kraljic','operatie');
  add('Model Pareto','finance',num(metrics.dso)>30);

  add('Model DuPont','finance',balance>0&&revenue>0&&revenue/balance<1);
  add('Model Altman Z','finance',balance>0&&equity/balance<.2);
  if(revenue>0&&num(metrics.grossMargin)>0){
    const fixed=num(finance.fixed)*1000||num(metrics.wages)*1000*1.25||revenue*.35;
    const breakEven=fixed/(num(metrics.grossMargin)/100);
    const safety=(revenue-breakEven)/revenue*100;
    add('Model break-even','finance',safety<20);
  }
  add('Model werkkapitaal','finance',num(metrics.dso)>b.dsoNorm);
  add('Branche','tech',avg<b.digitalMaturity-.3);

  return Object.freeze(signals);
}
