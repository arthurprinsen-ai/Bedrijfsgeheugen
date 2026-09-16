const num=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const present=value=>value!==undefined&&value!==null&&value!=='';

export function financeValueMetrics(state={},context={}){
  const metrics=state?.portal?.metrics||{};
  const finance=state?.portal?.valueFinance||{};
  const revenue=num(metrics.revenue);
  const ownEbitda=present(metrics.ebitda)?num(metrics.ebitda):0;
  const branchEbitdaPct=num(context.branchEbitdaPct);
  const ebitdaUsed=ownEbitda||revenue*branchEbitdaPct/100;
  const debt=num(finance.debt),cash=num(finance.cash),equity=num(finance.equity),balance=num(finance.balance);
  const interest=num(finance.interest),multiple=num(finance.multiple);
  const waccPct=num(finance.wacc),wacc=waccPct/100;
  const branchGrowthPct=num(context.branchGrowthPct),branchGrowth=branchGrowthPct/100;
  const ownGrossMarginPct=present(metrics.grossMargin)?num(metrics.grossMargin):0;
  const grossMarginPct=ownGrossMarginPct||num(context.branchGrossMarginPct);
  const grossMargin=grossMarginPct/100;
  const wages=num(metrics.wages),dso=num(metrics.dso);

  const enterpriseValue=ebitdaUsed*multiple;
  const equityValue=enterpriseValue-debt+cash;
  const freeCashFlow=ebitdaUsed*.7;
  const growth=Math.min(branchGrowth,wacc-.02);
  const dcfValue=wacc>growth?freeCashFlow*(1+growth)/(wacc-growth):null;

  const solvencyPct=balance?equity/balance*100:null;
  const interestCoverage=interest?ebitdaUsed/interest:null;
  const netDebtToEbitda=ebitdaUsed?(debt-cash)/ebitdaUsed:null;
  const altmanZ=balance?
    .717*((revenue*.15)/balance)+
    .847*(equity*.3/balance)+
    3.107*(ebitdaUsed/balance)+
    .42*(equity/Math.max(debt,1))+
    .998*(revenue/balance):null;

  const netMargin=revenue?ebitdaUsed*.6/revenue:0;
  const assetTurnover=balance?revenue/balance:0;
  const leverage=balance&&equity?balance/equity:0;
  const roePct=netMargin*assetTurnover*leverage*100;

  const fixedCosts=present(finance.fixed)&&num(finance.fixed)>0?num(finance.fixed):(wages?wages*1.25:revenue*.35);
  const breakEvenRevenue=grossMargin>0?fixedCosts/grossMargin:null;
  const safetyMarginPct=revenue&&breakEvenRevenue!==null?(revenue-breakEvenRevenue)/revenue*100:null;
  const workingCapitalReceivables=revenue&&dso?revenue/365*dso:0;

  const sensitivity=[10000,25000,50000].map(annualSaving=>Object.freeze({annualSaving,valueImpact:annualSaving*multiple}));

  return Object.freeze({
    revenue,ebitdaUsed,grossMarginPct,enterpriseValue,equityValue,freeCashFlow,growth,dcfValue,
    solvencyPct,interestCoverage,dscr:interestCoverage,netDebtToEbitda,altmanZ,
    dupont:Object.freeze({netMargin,assetTurnover,leverage,roePct}),
    fixedCosts,breakEvenRevenue,safetyMarginPct,workingCapitalReceivables,
    sensitivity:Object.freeze(sensitivity)
  });
}
