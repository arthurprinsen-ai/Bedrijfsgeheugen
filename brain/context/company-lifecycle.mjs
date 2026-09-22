const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};

export const COMPANY_LIFECYCLE_CONTEXTS=freeze({
  grow:{id:'grow',intent:'scale_value',signals:['growth','capacity','margin','maturity'],models:['dupont','bcg','ansoff','capability-maturity','businesscase','impact-engine','scenario-simulator'],portal_pages:['businesscase','strategie-naar-maandagochtend','strategy-dna','os:impact-engine','os:scenario-simulator','os:next-best-actions','roadmap','koppelingen','outcomes-evidence']},
  loss:{id:'loss',intent:'restore_margin_cash',signals:['negative-profit','margin-leakage','working-capital','cost-to-serve'],models:['break-even','contribution-margin','cash-conversion','cost-to-serve','13-week-cashflow','impact-engine','scenario-simulator'],portal_pages:['waarde-financiering','businesscase','cijfers-maatstaven','os:impact-engine','os:scenario-simulator','actieve-acties','roadmap','outcomes-evidence']},
  crisis:{id:'crisis',intent:'protect_continuity',signals:['cash-runway','obligations','critical-dependencies','liquidity'],models:['13-week-cashflow','cash-runway','scenario-planning','dependency-map','decision-log','impact-engine'],portal_pages:['waarde-financiering','os:scenario-simulator','os:next-best-actions','recovery-obligations','actieve-acties','audittrail','outcomes-evidence']},
  buy:{id:'buy',intent:'buy_side_ma',signals:['transaction-target','quality-of-earnings','working-capital','concentration','integration'],models:['normalized-ebitda','qoe-signals','working-capital','customer-concentration','key-person-risk','synergy-map','100-day-plan'],portal_pages:['due-diligence','waarde-financiering','documenten','audit','model-bcg','os:scenario-simulator','roadmap','outcomes-evidence']},
  sell:{id:'sell',intent:'sell_side_exit',signals:['exit-horizon','transferability','evidence-readiness','key-person-risk','value-leakage'],models:['exit-readiness','normalized-kpis','key-person-risk','process-evidence','value-leakage','data-room-readiness'],portal_pages:['exit','due-diligence','waarde-financiering','documenten','audit','roadmap','outcomes-evidence']},
  portfolio:{id:'portfolio',intent:'portfolio_value_creation',signals:['multi-company','capital-allocation','portfolio-risk','value-creation'],models:['portfolio-benchmark','value-creation','risk-heatmap','bcg','capital-allocation','execution-tracking'],portal_pages:['model-bcg','waarde-financiering','due-diligence','os:impact-engine','os:scenario-simulator','os:next-best-actions','outcomes-evidence','audittrail']}
});

const list=value=>Array.isArray(value)?value:[];
const number=value=>Number.isFinite(Number(value))?Number(value):null;
const lower=value=>String(value??'').trim().toLowerCase();

export function inferCompanyLifecycleContext(state={}){
  const explicit=lower(state?.portal?.lifecycle?.stage||state?.portal?.context?.stage||state?.company?.lifecycle_stage);
  if(COMPANY_LIFECYCLE_CONTEXTS[explicit])return freeze({stage:explicit,source:'explicit',confidence:1,reasons:['explicit-lifecycle-stage']});
  const transaction=lower(state?.portal?.transaction?.type||state?.transaction?.type||state?.ma?.type);
  if(['buy','buy-side','acquisition','acquire'].includes(transaction))return freeze({stage:'buy',source:'transaction',confidence:.95,reasons:['buy-side-transaction']});
  if(['sell','sell-side','exit','divest'].includes(transaction))return freeze({stage:'sell',source:'transaction',confidence:.95,reasons:['sell-side-transaction']});
  const companies=list(state?.portal?.portfolio?.companies||state?.portfolio?.companies);
  if(companies.length>1)return freeze({stage:'portfolio',source:'portfolio',confidence:.9,reasons:['multiple-portfolio-companies']});
  const finance=state?.portal?.finance||state?.finance||state?.portal?.profile?.finance||{};
  const ebitda=number(finance.ebitda??finance.operating_profit);
  const netIncome=number(finance.net_income??finance.profit);
  const runway=number(finance.cash_runway_weeks??finance.runway_weeks);
  if(runway!=null&&runway<=13)return freeze({stage:'crisis',source:'finance',confidence:.85,reasons:['cash-runway-lte-13-weeks']});
  if((ebitda!=null&&ebitda<0)||(netIncome!=null&&netIncome<0))return freeze({stage:'loss',source:'finance',confidence:.8,reasons:['negative-financial-result']});
  return freeze({stage:'grow',source:'default',confidence:0,reasons:['no-explicit-context']});
}

export function buildCompanyLifecycleContext(state={}){
  const detected=inferCompanyLifecycleContext(state);
  const definition=COMPANY_LIFECYCLE_CONTEXTS[detected.stage];
  return freeze({
    ...detected,
    intent:definition.intent,
    models:[...definition.models],
    portal_pages:[...definition.portal_pages],
    signals:[...definition.signals],
    evidence_mode:detected.source==='default'?'unproven-default':'derived',
    learning_key:`company-lifecycle:${detected.stage}`
  });
}
